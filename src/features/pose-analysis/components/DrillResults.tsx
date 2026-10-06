import type { ScoreResult } from '../scoring/scoringTypes';
import { DRILL_IDS, DRILL_LABELS, stepPassed } from '../scoring/basicDrill';
import { poseScoreOnTen } from '../results/scoreScale';

export function DrillResults({ result, onRetry }: { result: ScoreResult; onRetry?: () => void }) {
  const drill = result.drill!;
  const missingPoints = drill.steps.reduce((sum,s) => sum + (s.result.status === 'scored' ? s.result.unassessedPoints ?? 0 : 0),0);
  const incomplete = result.status === 'scored' && result.assessment === 'incomplete';
  return <section aria-label="Kết quả chuỗi điều lệnh cơ bản" className="space-y-4 text-slate-800 dark:text-slate-100">
    <h3 className="text-xl font-black">Nghiêm → Nghỉ → Chào</h3>
    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 space-y-2" role="status">
      <p className="text-2xl font-black">{result.status === 'scored' ? `${poseScoreOnTen(result.total)} / ${poseScoreOnTen(100 - missingPoints / 3)} điểm${missingPoints > 0 ? ' ở phần đã đánh giá' : ''}` : 'Chưa có điểm tổng'}</p>
      <p>Hoàn thành: {Math.round(drill.completion * 100)}% · {drill.steps.filter(s => s.result.status === 'scored').length}/3 động tác</p>
      {result.status === 'scored' && !missingPoints && <p>Điểm trung bình: {poseScoreOnTen(result.total)}/10</p>}
      <p className="font-bold">{incomplete ? 'CAMERA CHƯA XÁC NHẬN ĐỦ CÁC TIÊU CHÍ' : drill.passed ? 'ĐẠT TOÀN CHUỖI' : drill.completion < 1 ? 'CHƯA HOÀN TẤT CHUỖI — chưa đủ cơ sở kết luận đạt' : 'CHƯA ĐẠT TOÀN CHUỖI'}</p>
      <p className="text-sm">{drill.passed ? 'Điểm trung bình toàn chuỗi đã đạt. Xem góp ý riêng của từng bước để tiếp tục hoàn thiện.' : 'Luyện lại những bước cần cải thiện; bước thiếu dữ liệu phải được ghi nhận trước khi kết luận toàn chuỗi.'}</p>
      <p className="text-xs">Điểm trung bình của ba động tác từ 6,5/10 là đạt toàn chuỗi khi đủ dữ liệu. Các bước và tiêu chí chưa đạt vẫn có góp ý riêng. Điểm không phải độ chính xác của AI hay chứng nhận điều lệnh.</p>
    </div>
    {result.status === 'notScorable' && <p role="alert" className="text-amber-700 dark:text-amber-300">{result.reasons.join(' ')}</p>}
    <ol className="space-y-3">
      {DRILL_IDS.map((id, index) => {
        const step = drill.steps.find(s => s.movementId === id)?.result;
        const scored = step?.status === 'scored' ? step : null;
        const status = !scored ? 'Chưa chấm' : scored.assessment === 'incomplete' ? 'Camera chưa xác nhận đủ' : !stepPassed(scored) ? 'Chưa đạt' : scored.total < 80 ? 'Đạt tối thiểu · Cần chỉnh' : 'Đạt';
        return <li key={id} className="rounded-2xl border border-slate-300 dark:border-slate-700 p-4 space-y-2">
          <h4 className="font-bold">{index + 1}. {DRILL_LABELS[index]} — {scored ? `${poseScoreOnTen(scored.total)}/${poseScoreOnTen(100 - (scored.unassessedPoints ?? 0))}` : '—'} · {status}</h4>
          {scored ? <>
            <p className="text-sm">{scored.corrections.length ? scored.corrections.join(' ') : 'Giữ tốt các tiêu chí được camera đo.'}</p>
            <details><summary className="cursor-pointer text-sm">Nhận xét từng tiêu chí</summary>
              <ul className="mt-2 space-y-1 text-sm">{scored.criteria.map(c => <li key={c.id}>{c.label}: {c.statusLevel === 'NOT_SCORABLE' ? '—' : poseScoreOnTen(c.points)}/{poseScoreOnTen(c.maximum)} — {c.specificFeedback ?? c.feedback}</li>)}</ul>
            </details>
          </> : <p className="text-sm">{step?.status === 'notScorable' ? step.reasons.join(' ') : 'Chưa thực hiện; không quy thành điểm 0.'}</p>}
        </li>;
      })}
    </ol>
    {onRetry && <button type="button" onClick={onRetry} className="rounded-xl bg-red-600 text-white font-bold px-5 py-3">Thực hiện lại toàn chuỗi</button>}
  </section>;
}
