import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ShieldCheck, UserRound, LockKeyhole, ArrowRight, LogOut, ChevronDown, Home, BarChart3, ClipboardCheck, X, GraduationCap, KeyRound } from 'lucide-react';

export type Account = { id: string; username: string; name: string; role: 'admin' | 'teacher' | 'student' };
export const accountLabels = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học sinh' };
const AccountContext = createContext<{ user: Account | null; loading: boolean; openLogin: () => void; openChangePassword: () => void; logout: () => Promise<void> } | null>(null);
export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error('Cần đăng nhập tài khoản.');
  return account;
}
export async function accountApi(route: string, options?: RequestInit) {
  const response = await fetch(`/api/survey/${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) },
    credentials: 'same-origin'
  });
  const data = await response.json().catch(() => ({ error: 'Không kết nối được máy chủ. Vui lòng thử lại.' }));
  if (!response.ok) {
    if (response.status === 401 && route !== 'login' && route !== 'me' && !route.startsWith('responses') && route !== 'config') {
      window.dispatchEvent(new Event('gdqp-session-expired'));
    }
    throw new Error(data.error || 'Không thực hiện được yêu cầu.');
  }
  return data;
}
export function AccountMenu({ onNavigate }: { onNavigate: (tab: 'home' | 'survey' | 'admin' | 'exam_admin') => void }) {
  const { user, loading, openLogin, openChangePassword, logout } = useAccount();
  const [error, setError] = useState('');
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) menu.current?.removeAttribute('open'); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu.current?.open) { menu.current.removeAttribute('open'); menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const item = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800';
  function navigate(tab: 'home' | 'survey' | 'admin' | 'exam_admin') { menu.current?.removeAttribute('open'); onNavigate(tab); }
  if (!user) return <button disabled={loading} onClick={openLogin} className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3 py-2 text-xs font-bold disabled:opacity-50 transition-all shadow-xs" aria-label="Tài khoản — Đăng nhập" title="Đăng nhập tài khoản"><UserRound size={16} className="shrink-0" /><span className="hidden sm:inline">Tài khoản</span></button>;
  return <details ref={menu} className="relative print:hidden">
    <summary className="list-none cursor-pointer flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-2.5 sm:px-3 py-2 text-xs font-bold [&::-webkit-details-marker]:hidden" title={`Tài khoản: ${user.name}`}><UserRound size={16} className="shrink-0 text-red-500" /><span className="hidden sm:inline max-w-24 truncate">{user.username}</span><ChevronDown size={13} className="text-slate-400" /></summary>
    <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 shadow-xl z-50">
      <div className="px-3 py-3 mb-1 border-b border-slate-200 dark:border-slate-700"><p className="font-bold truncate">{user.name}</p><p className="text-xs text-slate-500 mt-1">{accountLabels[user.role]} · {user.username}</p></div>
      <button className={item} onClick={() => navigate('home')}><Home size={17} />Trang chủ</button>
      {(user.role === 'admin' || user.role === 'teacher') && (
        <button className={item} onClick={() => navigate('exam_admin')}><GraduationCap size={17} />Quản lý kết quả thi</button>
      )}
      {user.role === 'admin' ? (
        <button className={item} onClick={() => navigate('admin')}><BarChart3 size={17} />Báo cáo khảo sát</button>
      ) : (
        <button className={item} onClick={() => navigate('survey')}><ClipboardCheck size={17} />Khảo sát của tôi</button>
      )}
      <button className={item} onClick={() => { menu.current?.removeAttribute('open'); openChangePassword(); }}><KeyRound size={17} />Đổi mật khẩu</button>
      <button className={`${item} text-red-600`} onClick={async () => { try { await logout(); navigate('home'); } catch (e) { setError((e as Error).message); } }}><LogOut size={17} />Đăng xuất</button>
      {error && <p role="alert" className="p-3 text-xs text-red-600">{error}</p>}
    </div>
  </details>;
}
export default function AccountGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pinOrOld, setPinOrOld] = useState('');
  const [dialogMode, setDialogMode] = useState<'login' | 'changePassword'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (loginOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [loginOpen]);

  useEffect(() => {
    accountApi('me').then(data => setUser(data.user)).catch(() => {}).finally(() => setLoading(false));
    const expired = () => { setUser(null); setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); setDialogMode('login'); setLoginOpen(true); };
    window.addEventListener('gdqp-session-expired', expired);
    return () => window.removeEventListener('gdqp-session-expired', expired);
  }, []);

  async function logout() { await accountApi('logout', { method: 'POST' }); setUser(null); setPassword(''); setError(''); }

  return <AccountContext.Provider value={{
    user,
    loading,
    logout,
    openLogin: () => { setError(''); setSuccessMsg(''); setDialogMode('login'); setLoginOpen(true); },
    openChangePassword: () => {
      setError('');
      setSuccessMsg('');
      if (!user) { setDialogMode('login'); setLoginOpen(true); return; }
      setUsername(user.username);
      setDialogMode('changePassword');
      setLoginOpen(true);
    }
  }}>
    {children}
    <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else { setLoginOpen(false); setPassword(''); setNewPassword(''); setPinOrOld(''); setError(''); setSuccessMsg(''); } }} onClose={() => { setLoginOpen(false); setPassword(''); setNewPassword(''); setPinOrOld(''); setError(''); setSuccessMsg(''); }} aria-labelledby="login-title" className="m-auto w-[calc(100%_-_2rem)] max-w-5xl max-h-[90dvh] overflow-y-auto rounded-3xl p-0 bg-white text-slate-900 backdrop:bg-slate-950/60">
    <div className="relative">
    <button disabled={busy} onClick={() => setLoginOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 z-10 rounded-full bg-white text-slate-600 p-2 shadow hover:bg-slate-100"><X size={20} /></button>
    <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
      <section className="bg-gradient-to-br from-red-800 via-red-700 to-rose-600 text-white p-8 sm:p-12 flex flex-col justify-between gap-8">
        <div><div className="flex items-center gap-3 font-black tracking-wide"><ShieldCheck className="text-amber-300 w-9 h-9" /> HỌC QPAN 3D</div><h1 className="text-3xl sm:text-4xl font-black leading-tight mt-10">Học qua trải nghiệm.<br />Hiểu sâu, nhớ lâu.</h1><p className="text-red-100 mt-5 leading-relaxed">Nền tảng thực hành trải nghiệm 3D và khảo sát môn Giáo dục Quốc phòng và An ninh.</p></div>
        <div className="space-y-3 text-sm text-red-50">
          <p>Tất cả phản hồi khảo sát được lưu an toàn trên máy chủ.</p>
          <p>Chỉ quản trị viên được xem báo cáo tổng hợp.</p>
          <p>Hỗ trợ đăng nhập đồng thời trên nhiều thiết bị cùng lúc.</p>
        </div>
      </section>

      {dialogMode === 'login' ? (
        <section className="p-8 sm:p-12 flex flex-col justify-center"><h2 id="login-title" className="text-2xl font-extrabold">Đăng nhập tài khoản</h2><p className="text-sm text-slate-500 mt-2 mb-7">Sử dụng tài khoản đã được quản trị viên cấp.</p>
          <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { const result = await accountApi('login', { method: 'POST', body: JSON.stringify({ username, password }) }); setPassword(''); setUser(result.user); setLoginOpen(false); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
            <label className="block text-sm font-semibold">Tên đăng nhập<div className="relative mt-1.5"><UserRound size={18} className="absolute left-4 top-3.5 text-slate-400" /><input required autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={busy} value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-red-500" placeholder="Nhập tên đăng nhập" /></div></label>
            <label className="block text-sm font-semibold">Mật khẩu<div className="relative mt-1.5"><LockKeyhole size={18} className="absolute left-4 top-3.5 text-slate-400" /><input required type="password" autoComplete="current-password" maxLength={128} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-red-500" placeholder="Nhập mật khẩu" /></div></label>
            {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{error}</p>}
            <button disabled={busy} className="w-full flex justify-center items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold p-3 disabled:opacity-50 mt-2">{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}<ArrowRight size={18} /></button>
          </form>
          <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">Liên hệ quản trị viên nếu bạn quên mật khẩu.</p>
        </section>
      ) : (
        <section className="p-8 sm:p-12 flex flex-col justify-center">
          <h2 id="login-title" className="text-2xl font-extrabold flex items-center gap-2"><KeyRound className="text-red-600" /> Đổi mật khẩu</h2>
          <p className="text-sm text-slate-500 mt-2 mb-5">
            Nhập mật khẩu hiện tại để cập nhật mật khẩu mới.
          </p>
          <form className="space-y-3.5" onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            setError('');
            setSuccessMsg('');
            try {
              const result = await accountApi('change-password', {
                method: 'POST',
                body: JSON.stringify({
                  targetUsername: username.trim(),
                  oldPassword: pinOrOld.trim(),
                  newPassword: newPassword.trim()
                })
              });
              setSuccessMsg(result.message || 'Đổi mật khẩu thành công!');
              setPassword(newPassword.trim());
              setNewPassword('');
              setPinOrOld('');
              setTimeout(() => {
                setDialogMode('login');
                setSuccessMsg('');
              }, 2000);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}>
            <label className="block text-xs font-bold text-slate-700">Tên tài khoản
              <input required disabled={busy} value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 mt-1 font-mono text-sm" placeholder="Mặc định: admin" />
            </label>
            <label className="block text-xs font-bold text-slate-700">Mật khẩu hiện tại
              <input required type="password" autoComplete="current-password" disabled={busy} value={pinOrOld} onChange={e => setPinOrOld(e.target.value)} className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 mt-1 text-sm" placeholder="Nhập mật khẩu hiện tại" />
            </label>
            <label className="block text-xs font-bold text-slate-700">Mật khẩu mới (tối thiểu 8 ký tự)
              <input required type="password" autoComplete="new-password" minLength={8} disabled={busy} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 mt-1 text-sm" placeholder="Nhập mật khẩu mới" />
            </label>

            {error && <p role="alert" className="text-xs text-red-700 bg-red-50 rounded-xl p-2.5">{error}</p>}
            {successMsg && <p role="status" className="text-xs text-emerald-800 bg-emerald-50 rounded-xl p-2.5 font-bold">{successMsg}</p>}

            <button disabled={busy} className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold p-3 disabled:opacity-50 text-sm mt-1">
              {busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
            </button>
            <button type="button" onClick={() => { setDialogMode('login'); setError(''); setSuccessMsg(''); }} className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline pt-1">
              Quay lại Đăng nhập
            </button>
          </form>
        </section>
      )}
    </div>
    </div></dialog>
  </AccountContext.Provider>;
}
