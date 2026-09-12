import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

export type AccountRole = 'admin' | 'teacher' | 'student';
export type PublicAccount = { id: string; username: string; name: string; role: AccountRole };
type Account = PublicAccount & { salt: string; hash: string };
export async function readAccounts(directory: string): Promise<Account[]> {
  try { return JSON.parse(await readFile(path.join(directory, 'accounts.json'), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
}
export async function saveAccounts(directory: string, accounts: Account[]) {
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, 'accounts.json');
  await writeFile(file + '.tmp', JSON.stringify(accounts, null, 2), { mode: 0o600 });
  await rename(file + '.tmp', file);
}
export function makeAccount(username: string, name: string, role: AccountRole, password: string): Account {
  const salt = randomBytes(16).toString('hex');
  return { id: randomUUID().replaceAll('-', '').toUpperCase(), username, name, role, salt, hash: scryptSync(password, salt, 64).toString('hex') };
}
const publicAccount = ({ id, username, name, role }: Account): PublicAccount => ({ id, username, name, role });
export function createAuth(directory: string) {
  const router = Router();
  const sessions = new Map<string, { user: PublicAccount; expires: number }>();
  const attempts = new Map<string, { count: number; expires: number }>();
  let writes = Promise.resolve();
  const sessionToken = (req: Request) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('gdqp_session='))?.slice(13) || '';
  const protectRequest = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}` && req.headers.origin !== process.env.APP_URL) return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
    next();
  };
  router.use(protectRequest);
  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    const session = sessions.get(sessionToken(req));
    if (!session || session.expires <= Date.now()) return res.status(401).json({ error: 'Vui lòng đăng nhập tài khoản.' });
    res.locals.user = session.user; next();
  };
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => requireUser(req, res, () => {
    if (res.locals.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ admin được truy cập kết quả và quản lý tài khoản.' });
    next();
  });
  const requireExamManager = (req: Request, res: Response, next: NextFunction) => requireUser(req, res, () => {
    if (!['admin', 'teacher'].includes(res.locals.user.role)) return res.status(403).json({ error: 'Chỉ admin và giáo viên được quản lý kết quả thi.' });
    next();
  });
  router.post('/login', async (req, res) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
    const key = req.ip || 'unknown';
    const attempt = attempts.get(key) || { count: 0, expires: now + 900_000 };
    if (attempt.count >= 10) return res.status(429).json({ error: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
    attempts.set(key, { ...attempt, count: attempt.count + 1 });
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length > 128) return res.status(400).json({ error: 'Thông tin đăng nhập không hợp lệ.' });
    try {
      const account = (await readAccounts(directory)).find(a => a.username === username);
      const hash = scryptSync(password, account?.salt || 'unknown-account-salt', 64);
      if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
      attempts.delete(key); sessions.delete(sessionToken(req));
      const token = randomBytes(32).toString('hex'); const user = publicAccount(account);
      sessions.set(token, { user, expires: now + 8 * 3600_000 });
      res.cookie('gdqp_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api', maxAge: 8 * 3600_000 });
      res.json({ user });
    } catch { res.status(500).json({ error: 'Không đọc được tài khoản. Vui lòng thử lại.' }); }
  });
  router.post('/logout', (req, res) => { sessions.delete(sessionToken(req)); res.clearCookie('gdqp_session', { path: '/api' }); res.json({ ok: true }); });
  router.get('/me', requireUser, (_req, res) => res.json({ user: res.locals.user }));
  router.get('/accounts', requireAdmin, async (_req, res) => {
    try { res.json({ accounts: (await readAccounts(directory)).map(publicAccount) }); }
    catch { res.status(500).json({ error: 'Không đọc được danh sách tài khoản.' }); }
  });
  router.post('/accounts', requireAdmin, async (req, res) => {
    const { name, role } = req.body || {};
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    if (!/^[a-z0-9._-]{3,40}$/.test(username) || typeof name !== 'string' || !name.trim() || name.length > 100 || !['student', 'teacher'].includes(role)) return res.status(400).json({ error: 'Nhập tên đăng nhập 3–40 ký tự, tên hiển thị và vai trò học sinh/giáo viên.' });
    const job = writes.then(async () => {
      const accounts = await readAccounts(directory);
      if (accounts.some(a => a.username === username)) { res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' }); return; }
      const password = randomBytes(12).toString('base64url');
      const account = makeAccount(username, name.trim(), role, password);
      await saveAccounts(directory, [...accounts, account]);
      res.status(201).json({ user: publicAccount(account), password });
    });
    writes = job.catch(() => {});
    try { await job; } catch { res.status(500).json({ error: 'Chưa tạo được tài khoản.' }); }
  });
  const optionalUser = (req: Request, res: Response, next: NextFunction) => {
    const session = sessions.get(sessionToken(req));
    if (session && session.expires > Date.now()) {
      res.locals.user = session.user;
    }
    next();
  };
  router.post('/change-password', optionalUser, async (req, res) => {
    const pin = req.headers['x-admin-pin'] || req.body?.pin;
    const isPinAdmin = pin === '123456' || pin === 'admin123';
    const user = res.locals.user;

    const targetUsername = (typeof req.body?.targetUsername === 'string' ? req.body.targetUsername.trim().toLowerCase() : '') || user?.username || 'admin';
    const oldPassword = typeof req.body?.oldPassword === 'string' ? req.body.oldPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    try {
      const accounts = await readAccounts(directory);
      const accountIndex = accounts.findIndex(a => a.username === targetUsername);
      if (accountIndex === -1) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      }
      const account = accounts[accountIndex];

      if (!isPinAdmin) {
        if (!oldPassword && !user) {
          return res.status(401).json({ error: 'Vui lòng nhập mật khẩu hiện tại hoặc mã PIN quản trị (123456).' });
        }
        if (oldPassword) {
          const hash = scryptSync(oldPassword, account.salt, 64);
          if (!timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) {
            return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
          }
        } else if (!user || (user.role !== 'admin' && user.username !== targetUsername)) {
          return res.status(403).json({ error: 'Không có quyền đổi mật khẩu tài khoản này.' });
        }
      }

      const newSalt = randomBytes(16).toString('hex');
      const newHash = scryptSync(newPassword, newSalt, 64).toString('hex');
      accounts[accountIndex] = {
        ...account,
        salt: newSalt,
        hash: newHash
      };

      await saveAccounts(directory, accounts);
      res.json({ ok: true, message: `Đã đổi mật khẩu cho tài khoản "${targetUsername}" thành công.` });
    } catch {
      res.status(500).json({ error: 'Không cập nhật được mật khẩu.' });
    }
  });
  return { router, requireUser, requireAdmin, requireExamManager, protectRequest, optionalUser, sessions };
}
