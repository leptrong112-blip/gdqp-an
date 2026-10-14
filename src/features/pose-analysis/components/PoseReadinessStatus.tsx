import type { AnalysisSnapshot, PoseStage } from '../types';

const stages:Partial<Record<PoseStage,string>>={
  'quality-check':'Kiểm tra camera',calibrating:'Đo tỷ lệ cơ thể',
  'waiting-precondition':'Xác nhận tiền đề','precondition-scoring':'Ghi nhận tiền đề',countdown:'Đếm ngược',
};
export function PoseReadinessStatus({snapshot,stage,autoCalibrate}:{snapshot:AnalysisSnapshot|null;stage:PoseStage;autoCalibrate:boolean}) {
  if(!snapshot || !stages[stage])return null;
  const d=snapshot.readinessDebug;
  const manual=stage==='quality-check'&&!autoCalibrate;
  const reasons=manual?['Tự động đang TẮT. Bật lại tùy chọn tự động hoặc bấm hiệu chuẩn.']
    : d?.blockers.length?d.blockers
    : stage==='quality-check'?['Camera đạt: đang chuyển sang tự đo vị trí.']
    : stage==='countdown'?['Đang đếm ngược; chưa chấm động tác.']
    : ['Đã nhận tư thế; đang tích lũy thời gian quan sát hợp lệ.'];
  return <section aria-label="Chẩn đoán tiền đề trực tiếp" className="mt-2 border-t border-slate-700 pt-2 text-xs text-slate-200 break-words">
    <p className="font-semibold">{stages[stage]} · Tự động {autoCalibrate?'BẬT':'TẮT'} · Khung { (snapshot.frame.timestampMs/1000).toFixed(1) }s</p>
    <p className="mt-1 text-amber-200">{reasons[0]}</p>
    <details className="mt-1">
      <summary className="cursor-pointer text-sky-200">Chi tiết để quay video tìm lỗi</summary>
      <p className="mt-1">Chỉ hiển thị trên máy, không phải điểm bài.</p>
      <div className="grid gap-x-4 sm:grid-cols-2">
      <p>Giai đoạn: {stage} · Camera: {snapshot.quality.passed?'ĐẠT':'CHỜ'}</p>
      <p>Tiền đề tức thời: {d?.instantStatus??'—'} · Xác nhận: {d?.confirmedStatus??'—'}</p>
      <p>Hợp lệ: {((d?.validMs??0)/1000).toFixed(1)}/{((d?.requiredMs??0)/1000).toFixed(1)}s
        {d && d.requiredSamples>0 ? ` · Mẫu ${d.sampleCount}/${d.requiredSamples}`:''}</p>
      <p>Nhận diện {snapshot.inferenceFps.toFixed(1)} FPS · Xử lý {snapshot.inferenceMs.toFixed(0)} ms · Khoảng khung {d?.frameGapMs.toFixed(0)??'—'} ms</p>
      <p>Tuổi khung xương {snapshot.performance?.landmarkAgeMs?.toFixed(0)??'—'} ms · Mục tiêu {snapshot.performance?.targetFps??'—'} FPS</p>
      </div>
      {reasons.length>1 && <ul className="mt-1 list-disc pl-4">{reasons.slice(1).map((r,i)=><li key={`${i}:${r}`}>{r}</li>)}</ul>}
      {d?.rejectedJoints.length ? <p>Bộ lọc loại khớp bất thường: {d.rejectedJoints.join(', ')}</p>:null}
    </details>
  </section>;
}
