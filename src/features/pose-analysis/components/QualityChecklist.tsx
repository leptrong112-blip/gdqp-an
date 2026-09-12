import { CheckCircle2, Circle } from 'lucide-react';
import type { QualityReport } from '../types';
const labels = ['Ánh sáng', 'Một người', 'Thấy toàn thân', 'Khớp rõ ràng', 'Khung hình ổn định', 'Nhìn chính diện'];
export function QualityChecklist({ report }: { report?: QualityReport }) {
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
    <h2 className="font-bold mb-4">Kiểm tra trước khi chấm</h2>
    <ul className="space-y-3">{labels.map((label, index) => { const check = report?.checks[index]; return <li key={label} className="flex gap-3 text-sm items-center">{check?.passed ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <Circle size={18} className="text-slate-400 shrink-0" />}<span>{label}</span></li>; })}</ul>
    <p role="status" className={`text-sm mt-5 p-3 rounded-xl ${report?.passed ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'}`}>{report?.passed ? 'Đã sẵn sàng. Bắt đầu hiệu chuẩn để chấm.' : report?.reasons[0] || 'Bật camera để kiểm tra chất lượng hình ảnh.'}</p>
  </section>;
}
