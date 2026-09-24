import type { SequenceReport } from '../scoring/sequenceAnalysis';

export function SequenceSummary({ report }: { report: SequenceReport }) {
  if (report.status === 'unavailable') return <section aria-label="Phân tích chuỗi động tác" className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
    <h3 className="font-bold">Phân tích chuỗi động tác</h3>
    <p className="mt-2">{report.reason}</p>
  </section>;
  const y = (progress: number) => 110 - Math.max(-0.25, Math.min(1.25, progress)) * 72;
  const points = report.trace.map((p, i) => `${20 + i / (report.trace.length - 1) * 320},${y(p.progress)}`).join(' ');
  return <section aria-label="Phân tích chuỗi động tác" className="rounded-2xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50/60 dark:bg-cyan-950/20 p-4 space-y-3">
    <h3 className="font-bold text-sm">Phân tích chuỗi động tác</h3>
    <p className="text-xs">{report.complete ? 'Đã ghi nhận đủ trình tự quay liên tục.' : 'Trình tự quay chưa đạt; xem chi tiết bên dưới.'}</p>
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      {[['Chuẩn bị', report.readyMs], ['Chuyển động', report.movingMs], ['Giữ thế cuối', report.holdMs]].map(([label, time]) =>
        <div key={label} className="rounded-xl bg-white/70 dark:bg-slate-900/70 p-2"><div>{label}</div><strong>{time === null ? 'Chưa tới đích' : `${(Number(time) / 1000).toFixed(1)} s`}</strong></div>)}
    </div>
    <svg viewBox="0 0 360 150" role="img" aria-label="Diễn biến góc quay theo thời gian: nét liền là chuyển động ghi nhận, nét đứt là mẫu toán học tham khảo" className="w-full max-h-44">
      <line x1="20" y1="128" x2="340" y2="128" stroke="currentColor" opacity="0.3" />
      <polyline points={`20,${y(0)} 84,${y(0)} 212,${y(1)} 340,${y(1)}`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" />
      <polyline points={points} fill="none" stroke="#0891b2" strokeWidth="3" />
      <text x="20" y="145" fill="currentColor" fontSize="10">Bắt đầu</text>
      <text x="290" y="145" fill="currentColor" fontSize="10">Kết thúc</text>
    </svg>
    <ul className="list-disc pl-5 text-xs space-y-1">{report.feedback.map(tip => <li key={tip}>{tip}</li>)}</ul>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">Nét liền: góc quay ghi nhận. Nét đứt: mẫu toán học thử nghiệm. Độ lệch so với mẫu: {report.distance.toFixed(3)} (chỉ tham khảo, không dùng tính điểm). Thiếu dữ liệu chuyển động thì chưa chấm; đoạn quay ngược được tính trong tiêu chí hướng quay. Chưa đánh giá trình tự bàn chân; cần giáo viên kiểm chứng.</p>
  </section>;
}
