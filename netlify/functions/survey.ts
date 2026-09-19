import { getStore } from '@netlify/blobs';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { aiFeedbackAnalysis, localFeedbackAnalysis, type FeedbackAnalysis } from '../../server/survey';
import { surveyQuestions, type SurveyResponse, type SurveyRole, type SurveyPhase } from '../../src/data/survey';

type AccountRole = 'admin' | 'teacher' | 'student';
type PublicAccount = { id: string; username: string; name: string; role: AccountRole };
type Account = PublicAccount & { salt: string; hash: string };
type Session = { user: PublicAccount; expires: number };

const accountsStore = getStore('gdqp-accounts');
const sessionsStore = getStore('gdqp-sessions');
const surveyStore = getStore('gdqp-survey');
const eightHours = 8 * 60 * 60 * 1000;

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});

const publicAccount = ({ id, username, name, role }: Account): PublicAccount => ({ id, username, name, role });
const cookieToken = (request: Request) => request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('gdqp_session='))?.slice(13) || '';
const sessionCookie = (token: string, maxAge: number) => `gdqp_session=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

function routePath(request: Request) {
  const pathname = new URL(request.url).pathname;
  for (const prefix of ['/api/survey', '/.netlify/functions/survey']) {
    if (pathname.startsWith(prefix)) return pathname.slice(prefix.length) || '/';
  }
  return pathname;
}

async function requestBody(request: Request) {
  try { return await request.json() as Record<string, unknown>; }
  catch { return {}; }
}

function makeAccount(username: string, name: string, role: AccountRole, password: string): Account {
  const salt = randomBytes(16).toString('hex');
  return { id: randomUUID().replaceAll('-', '').toUpperCase(), username, name, role, salt, hash: scryptSync(password, salt, 64).toString('hex') };
}

async function seedAccounts(): Promise<Account[]> {
  const existing = await accountsStore.get('accounts', { type: 'json', consistency: 'strong' }) as Account[] | null;
  if (existing) return existing;
  let defaults: Account[] = [];
  try {
    defaults = JSON.parse(await readFile(path.join(process.cwd(), 'data', 'accounts.json'), 'utf8')) as Account[];
  } catch {
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'GdqpAdmin@2026';
    defaults = [makeAccount('admin', 'Quản trị viên GDQP', 'admin', adminPassword)];
  }
  await accountsStore.setJSON('accounts', defaults, { onlyIfNew: true });
  return await accountsStore.get('accounts', { type: 'json', consistency: 'strong' }) as Account[] || defaults;
}

async function updateAccounts(change: (accounts: Account[]) => Account[] | Promise<Account[]>): Promise<Account[]> {
  for (let attempt = 0; attempt < 8; attempt++) {
    await seedAccounts();
    const current = await accountsStore.getWithMetadata('accounts', { type: 'json', consistency: 'strong' });
    if (!current?.etag) continue;
    const next = await change(current.data as Account[]);
    const result = await accountsStore.setJSON('accounts', next, { onlyIfMatch: current.etag });
    if (result.modified) return next;
  }
  throw new Error('ACCOUNT_WRITE_CONFLICT');
}

async function readResponses(): Promise<SurveyResponse[]> {
  return await surveyStore.get('responses', { type: 'json', consistency: 'strong' }) as SurveyResponse[] | null || [];
}

async function updateResponses(change: (rows: SurveyResponse[]) => SurveyResponse[] | Promise<SurveyResponse[]>): Promise<SurveyResponse[]> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await surveyStore.getWithMetadata('responses', { type: 'json', consistency: 'strong' });
    const rows = current?.data as SurveyResponse[] | undefined || [];
    const next = await change(rows);
    const result = current?.etag
      ? await surveyStore.setJSON('responses', next, { onlyIfMatch: current.etag })
      : await surveyStore.setJSON('responses', next, { onlyIfNew: true });
    if (result.modified) return next;
  }
  throw new Error('SURVEY_WRITE_CONFLICT');
}

async function currentUser(request: Request): Promise<PublicAccount | null> {
  const token = cookieToken(request);
  if (!token) return null;
  const session = await sessionsStore.get(`session-${token}`, { type: 'json', consistency: 'strong' }) as Session | null;
  if (!session || session.expires <= Date.now()) {
    if (session) await sessionsStore.delete(`session-${token}`);
    return null;
  }
  return session.user;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin || origin === process.env.APP_URL;
}

function anonymizeFeedback(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email đã ẩn]')
    .replace(/(?:\+?84|0)(?:[ .-]?\d){9,10}/g, '[số điện thoại đã ẩn]')
    .replace(/\s+/g, ' ').trim().slice(0, 1200);
}

async function feedbackDataset() {
  const rows = (await readResponses()).filter(row => row.feedback?.trim());
  const items = rows.map(row => anonymizeFeedback(row.feedback || '')).filter(Boolean);
  const signature = createHash('sha256').update(rows.map(row => `${row.id}:${row.feedback}`).join('\n')).digest('hex');
  return { items, signature };
}

export default async function handler(request: Request) {
  try {
    if (!sameOrigin(request)) return json({ error: 'Yêu cầu không hợp lệ.' }, 403);
    const route = routePath(request);
    const method = request.method.toUpperCase();
    const user = await currentUser(request);
    const requireUser = () => user ? null : json({ error: 'Vui lòng đăng nhập tài khoản.' }, 401);
    const requireAdmin = () => user?.role === 'admin' ? null : json({ error: user ? 'Chỉ admin được truy cập mục này.' : 'Vui lòng đăng nhập tài khoản admin.' }, user ? 403 : 401);

    if (method === 'POST' && route === '/login') {
      const body = await requestBody(request);
      const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length > 128) return json({ error: 'Thông tin đăng nhập không hợp lệ.' }, 400);
      const account = (await seedAccounts()).find(item => item.username === username);
      const hash = scryptSync(password, account?.salt || 'unknown-account-salt', 64);
      if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) return json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, 401);
      const token = randomBytes(32).toString('hex');
      const loggedIn = publicAccount(account);
      await sessionsStore.setJSON(`session-${token}`, { user: loggedIn, expires: Date.now() + eightHours });
      return json({ user: loggedIn }, 200, { 'Set-Cookie': sessionCookie(token, eightHours / 1000) });
    }

    if (method === 'POST' && route === '/logout') {
      const token = cookieToken(request);
      if (token) await sessionsStore.delete(`session-${token}`);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    }

    if (method === 'GET' && route === '/me') return requireUser() || json({ user });

    if (route === '/accounts') {
      const denied = requireAdmin();
      if (denied) return denied;
      if (method === 'GET') return json({ accounts: (await seedAccounts()).map(publicAccount) });
      if (method === 'POST') {
        const body = await requestBody(request);
        const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const role = body.role as AccountRole;
        if (!/^[a-z0-9._-]{3,40}$/.test(username) || !name || name.length > 100 || !['student', 'teacher'].includes(role)) return json({ error: 'Nhập tên đăng nhập 3–40 ký tự, tên hiển thị và vai trò học sinh/giáo viên.' }, 400);
        const password = randomBytes(12).toString('base64url');
        let created: Account | null = null;
        await updateAccounts(accounts => {
          if (accounts.some(account => account.username === username)) throw new Error('ACCOUNT_EXISTS');
          created = makeAccount(username, name, role, password);
          return [...accounts, created];
        });
        return json({ user: publicAccount(created!), password }, 201);
      }
    }

    if (method === 'POST' && route === '/change-password') {
      const denied = requireUser();
      if (denied) return denied;
      const body = await requestBody(request);
      const targetUsername = typeof body.targetUsername === 'string' ? body.targetUsername.trim().toLowerCase() : user!.username;
      const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
      if (targetUsername !== user!.username) return json({ error: 'Bạn chỉ có thể đổi mật khẩu của chính mình.' }, 403);
      if (newPassword.length < 8 || newPassword.length > 128) return json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' }, 400);
      await updateAccounts(accounts => {
        const index = accounts.findIndex(account => account.username === targetUsername);
        if (index < 0) throw new Error('ACCOUNT_NOT_FOUND');
        const account = accounts[index];
        const hash = scryptSync(oldPassword, account.salt, 64);
        if (!timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) throw new Error('WRONG_PASSWORD');
        const salt = randomBytes(16).toString('hex');
        const next = [...accounts];
        next[index] = { ...account, salt, hash: scryptSync(newPassword, salt, 64).toString('hex') };
        return next;
      });
      return json({ ok: true, message: 'Đã đổi mật khẩu thành công.' });
    }

    if (route === '/config') {
      if (method === 'GET') return json(await surveyStore.get('config', { type: 'json', consistency: 'strong' }) || { isOpen: true });
      if (method === 'POST') {
        const denied = requireAdmin();
        if (denied) return denied;
        const body = await requestBody(request);
        const config = { isOpen: Boolean(body.isOpen) };
        await surveyStore.setJSON('config', config);
        return json({ ok: true, ...config });
      }
    }

    if (method === 'GET' && route === '/responses') {
      const denied = requireAdmin();
      return denied || json({ responses: await readResponses() });
    }

    if (method === 'DELETE' && route.startsWith('/responses/')) {
      const denied = requireAdmin();
      if (denied) return denied;
      const id = decodeURIComponent(route.slice('/responses/'.length));
      const next = await updateResponses(rows => id === 'all' ? [] : rows.filter(row => row.id !== id));
      return json({ ok: true, remaining: next.length });
    }

    if (method === 'GET' && route === '/my-responses') {
      const denied = requireUser();
      if (denied) return denied;
      const responses = (await readResponses()).filter(row => row.code === user!.id || row.username === user!.username);
      return json({ responses });
    }

    if (method === 'POST' && route === '/responses') {
      const body = await requestBody(request);
      const config = await surveyStore.get('config', { type: 'json', consistency: 'strong' }) as { isOpen: boolean } | null || { isOpen: true };
      if (!config.isOpen && user?.role !== 'admin') return json({ error: 'Đợt khảo sát GDQP-AN hiện đang tạm đóng. Cảm ơn bạn!' }, 403);
      const phase = body.phase as SurveyPhase;
      const role = (user?.role || body.role) as SurveyRole;
      const answers = body.answers as Record<string, number[]>;
      const feedback = body.feedback;
      const name = user?.name || (typeof body.name === 'string' ? body.name.trim() : '');
      const school = typeof body.school === 'string' ? body.school.trim().slice(0, 160) : '';
      const className = typeof body.className === 'string' ? body.className.trim().slice(0, 80) : '';
      const position = typeof body.position === 'string' ? body.position.trim().slice(0, 80) : '';
      if (user?.role === 'admin') return json({ error: 'Admin chỉ tổng hợp kết quả khảo sát.' }, 403);
      if (user && body.role && body.role !== user.role) return json({ error: 'Không được thay đổi vai trò tài khoản.' }, 403);
      if (!user && !name) return json({ error: 'Vui lòng nhập họ và tên của bạn.' }, 400);
      if (!['student', 'teacher'].includes(role) || !['before', 'after'].includes(phase) || !answers || typeof answers !== 'object' || Array.isArray(answers)) return json({ error: 'Thông tin khảo sát không hợp lệ.' }, 400);
      if (feedback !== undefined && typeof feedback !== 'string') return json({ error: 'Nội dung góp ý không hợp lệ.' }, 400);
      const questions = surveyQuestions(role, phase);
      const invalid = Object.keys(answers).length !== questions.length || questions.some(question => {
        const values = answers[question.id];
        const exclusive = question.exclusiveLast ?? question.options.at(-1)?.toLowerCase().includes('không');
        return !Array.isArray(values) || !values.length || (!question.multiple && values.length !== 1) || new Set(values).size !== values.length || values.some(value => !Number.isInteger(value) || value < 0 || value >= question.options.length) || (question.multiple && exclusive && values.includes(question.options.length - 1) && values.length > 1);
      });
      if (invalid) return json({ error: 'Vui lòng trả lời đầy đủ và kiểm tra các lựa chọn.' }, 400);
      const code = user?.id || `${name.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '_').slice(0, 16)}_${(className || position || 'khao_sat').toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '_').slice(0, 10)}`;
      await updateResponses(rows => {
        if (user && rows.some(row => row.code === code && row.role === role && row.phase === phase)) throw new Error('DUPLICATE_RESPONSE');
        return [...rows, {
          id: randomUUID(), code, username: user?.username, name, school, className, position, role, phase, answers,
          feedback: typeof feedback === 'string' ? feedback.trim().slice(0, 4000) : '', createdAt: new Date().toISOString()
        }];
      });
      return json({ ok: true }, 201);
    }

    if (route === '/feedback-analysis') {
      const denied = requireAdmin();
      if (denied) return denied;
      const { items, signature } = await feedbackDataset();
      const cached = await surveyStore.get('feedback-analysis', { type: 'json', consistency: 'strong' }) as FeedbackAnalysis | null;
      if (method === 'GET') return json({ analysis: cached?.signature === signature ? cached : null, needsRefresh: cached?.signature !== signature, feedbackCount: items.length });
      if (method === 'POST') {
        const body = await requestBody(request);
        if (!body.force && cached?.signature === signature) return json({ analysis: cached, cached: true });
        const analysis = await aiFeedbackAnalysis(items, signature).catch(() => localFeedbackAnalysis(items, signature));
        await surveyStore.setJSON('feedback-analysis', analysis);
        return json({ analysis, cached: false });
      }
    }

    return json({ error: 'Không tìm thấy API.' }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ACCOUNT_EXISTS') return json({ error: 'Tên đăng nhập đã tồn tại.' }, 409);
    if (message === 'ACCOUNT_NOT_FOUND') return json({ error: 'Không tìm thấy tài khoản.' }, 404);
    if (message === 'WRONG_PASSWORD') return json({ error: 'Mật khẩu hiện tại không đúng.' }, 401);
    if (message === 'DUPLICATE_RESPONSE') return json({ error: 'Tài khoản này đã gửi khảo sát ở giai đoạn đã chọn.' }, 409);
    console.error('survey function error', error);
    return json({ error: 'Máy chủ đang bận. Vui lòng thử lại.' }, 500);
  }
}
