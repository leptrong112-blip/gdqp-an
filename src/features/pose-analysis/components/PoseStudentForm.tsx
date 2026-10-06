import { useState } from 'react';
import { createPoseStudentSession, type PoseStudentSession } from '../results/studentSession';

export function PoseStudentForm({ onStart }: { onStart: (student: PoseStudentSession) => void }) {
  const [studentName, setStudentName] = useState(''), [className, setClassName] = useState(''), [error, setError] = useState('');
  return <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
    <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">AI Pose</p>
    <h1 className="mt-2 text-2xl font-black">Thông tin học sinh</h1>
    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Thông tin được dùng để giáo viên theo dõi kết quả thực hành.</p>
    <form className="mt-6 space-y-4" onSubmit={event => {
      event.preventDefault();
      const student = createPoseStudentSession(studentName, className);
      if (!student) { setError('Vui lòng nhập họ tên (tối đa 120 ký tự) và lớp (tối đa 40 ký tự).'); return; }
      onStart(student);
    }}>
      <label className="block text-sm font-bold">Họ và tên
        <input autoFocus required maxLength={120} autoComplete="name" value={studentName} onChange={event => setStudentName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-600" />
      </label>
      <label className="block text-sm font-bold">Lớp
        <input required maxLength={40} autoComplete="off" value={className} onChange={event => setClassName(event.target.value)} placeholder="Ví dụ: 10A1" className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-600" />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Bắt đầu AI Pose</button>
    </form>
  </section>;
}
