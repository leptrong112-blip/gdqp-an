import { randomBytes } from 'node:crypto';
import path from 'node:path';
import 'dotenv/config';
import { makeAccount, readAccounts, saveAccounts } from '../server/auth';
const directory = process.env.SURVEY_DATA_DIR || path.join(process.cwd(), 'data');
const accounts = await readAccounts(directory);
const created = [];
for (const [username, name, role] of [['admin', 'Quản trị viên', 'admin'], ['giaovien', 'Giáo viên', 'teacher'], ['hocsinh01', 'Học sinh 01', 'student']] as const) {
  if (accounts.some(a => a.username === username)) continue;
  const password = randomBytes(12).toString('base64url');
  accounts.push(makeAccount(username, name, role, password));
  created.push({ username, password, role });
}
await saveAccounts(directory, accounts);
console.log(JSON.stringify(created));
