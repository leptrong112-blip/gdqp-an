import { useEffect, useState } from 'react';
import { accountApi, accountLabels, type Account } from './AccountGate';
import { surveyButton, surveyInput, surveyPanel } from './SurveySection';
export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ user: Account; password: string } | null>(null);
  async function load() { setAccounts((await accountApi('accounts')).accounts); }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  return <section className={`${surveyPanel} print:hidden`}>
    <h3 className="text-xl font-bold">Quản lý tài khoản</h3><p className="text-sm text-slate-500 mt-2">Cấp tài khoản riêng cho từng học sinh và giáo viên để theo dõi đúng phản hồi trước–sau.</p>
    <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-5" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); setCreated(null); try { const result = await accountApi('accounts', { method: 'POST', body: JSON.stringify({ username, name, role }) }); setCreated(result); setUsername(''); setName(''); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
      <label className="text-sm space-y-2">Tên đăng nhập<input className={surveyInput} required pattern="[a-zA-Z0-9._\-]{3,40}" maxLength={40} value={username} onChange={e => setUsername(e.target.value)} placeholder="Ví dụ: hocsinh02" /></label>
      <label className="text-sm space-y-2">Tên hiển thị<input className={surveyInput} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Tên học sinh / giáo viên" /></label>
      <label className="text-sm space-y-2">Vai trò<select className={surveyInput} value={role} onChange={e => setRole(e.target.value)}><option value="student">Học sinh</option><option value="teacher">Giáo viên</option></select></label>
      <button disabled={busy} className={surveyButton}>{busy ? 'Đang tạo…' : 'Cấp tài khoản'}</button>
    </form>
    {error && <p role="alert" className="text-red-600 text-sm mt-4">{error}</p>}
    {created && <div role="status" className="mt-4 rounded-xl bg-emerald-50 text-emerald-900 p-4"><p className="font-bold">Đã tạo tài khoản {accountLabels[created.user.role]}</p><p>Tên đăng nhập: <strong className="font-mono select-all">{created.user.username}</strong></p><p>Mật khẩu: <strong className="font-mono select-all">{created.password}</strong></p><p className="text-sm mt-2">Lưu lại và gửi cho người được cấp. Mật khẩu chỉ hiển thị lần này.</p><button className="text-sm underline mt-2" onClick={() => setCreated(null)}>Đã lưu thông tin</button></div>}
    <details className="mt-5"><summary className="cursor-pointer font-semibold">Danh sách tài khoản ({accounts.length})</summary><div className="overflow-x-auto mt-3"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Tên đăng nhập</th><th className="p-2">Tên hiển thị</th><th className="p-2">Vai trò</th></tr></thead><tbody>{accounts.map(a => <tr className="border-t border-slate-200 dark:border-slate-700" key={a.id}><td className="p-2 font-mono">{a.username}</td><td className="p-2">{a.name}</td><td className="p-2">{accountLabels[a.role]}</td></tr>)}</tbody></table></div></details>
  </section>;
}
