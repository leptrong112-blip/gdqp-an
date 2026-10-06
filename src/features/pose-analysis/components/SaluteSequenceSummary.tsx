import type { ScoreResult } from '../scoring/scoringTypes';

export function SaluteSequenceSummary({ result }: { result: ScoreResult }) {
  const sequence = result.saluteSequence;
  if (!sequence) return null;
  const hand = result.status === 'scored' ? result.criteria.find(c => c.id === 'saluteHand') : undefined;
  return <section aria-label="Chuỗi Chào và dữ liệu bàn tay" className="rounded-2xl border border-slate-300 dark:border-slate-700 p-4 text-sm space-y-2">
    <h4 className="font-bold">Chuỗi thực hiện Chào</h4>
    <p>Tiền đề: {sequence.commandMs !== undefined ? 'Đứng nghiêm đã được xác nhận trước khẩu lệnh.' : 'chưa xác nhận đủ Đứng nghiêm.'}</p>
    <p>Chuyển động: {sequence.motionObserved && sequence.arrivalMs !== undefined ? 'đã ghi nhận nâng tay sau CHÀO và tới tư thế đích.' : 'chưa đủ dữ liệu xác nhận chuỗi nâng tay.'}</p>
    {sequence.firstMovementMs !== undefined && sequence.commandMs !== undefined && <p className="text-xs">Từ khẩu lệnh đến chuyển động đầu tiên: {((sequence.firstMovementMs - sequence.commandMs) / 1000).toFixed(2)} giây (tham khảo, không chấm tốc độ).</p>}
    <p>Tư thế cuối: {result.status === 'scored' ? 'đã có khoảng giữ ổn định; xem tiêu chí thân và tay bên dưới.' : 'chưa đủ dữ liệu để chấm.'}</p>
    <p>Bàn tay: {hand && hand.statusLevel !== 'NOT_SCORABLE' ? 'đã ghi nhận đủ dữ liệu để đánh giá riêng.' : 'chưa đủ dữ liệu để đánh giá. Hãy giữ tay rõ trong khung hình; không kết luận tay sai vì thiếu hình ảnh.'}</p>
  </section>;
}
