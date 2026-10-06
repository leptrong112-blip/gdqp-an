import type { PoseResultRecord } from './poseResultTypes';
import { poseScoreOnTen } from './scoreScale';

export const POSE_EXPORT_COLUMNS = ['Họ tên', 'Lớp', 'Động tác', 'Điểm ghi nhận (thang 10; đối chiếu cột chưa đánh giá)', 'Kết luận', 'Tiêu chí cần sửa', 'Tiêu chí chưa đủ dữ liệu', 'Tiêu chí bắt buộc', 'Độ tin cậy dữ liệu (%)', 'Điểm chưa đánh giá (thang 10)', 'Thời gian xử lý sau động tác (ms)', 'Bắt đầu', 'Hoàn thành', 'Điểm Nghiêm (/10)', 'Điểm Nghỉ (/10)', 'Điểm Chào (/10)', 'Mã lượt', 'Phiên bản chấm', 'Điểm Đứng nghiêm tiền đề (/10)', 'Kết luận tiền đề'] as const;
const assessmentLabels = { pass: 'Đạt', fail: 'Chưa đạt', incomplete: 'Chưa đủ dữ liệu' };
const timestamp = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });

/** Explicit column projection: no image, video, landmarks or incidental record fields. */
export function poseExcelRows(records: PoseResultRecord[]): (string | number)[][] {
  return records.map(record => {
    const stepScore = (movement: string): string | number => {
      const score = record.stepResults?.find(step => step.movementId === movement)?.score;
      return score == null ? '' : poseScoreOnTen(score);
    };
    const criteria = record.criteria.filter(item => item.required).map(item => `${item.label}: ${item.statusLevel === 'NOT_SCORABLE' ? 'Chưa đủ dữ liệu' : item.points >= item.maximum * .6 ? 'Đạt' : 'Chưa đạt'}`).join('; ');
    return [record.studentName, record.className, record.movementLabel, poseScoreOnTen(record.score), assessmentLabels[record.assessment],
      record.conciseFeedback.filter(item => item.type === 'MOTION_ERROR').map(item => `${item.label}: ${item.message}`).join('; '),
      record.conciseFeedback.filter(item => item.type === 'INSUFFICIENT_EVIDENCE').map(item => `${item.label}: ${item.message}`).join('; '),
      criteria, record.quality?.confidence == null ? '' : Math.round(record.quality.confidence * 100), record.quality?.unassessedPoints == null ? '' : poseScoreOnTen(record.quality.unassessedPoints),
      record.processingLatencyMs ?? '', timestamp(record.startedAt), timestamp(record.finishedAt), stepScore('attention'), stepScore('atEase'), stepScore('salute'), record.id, record.rubricVersion,
      record.preconditionResult ? poseScoreOnTen(record.preconditionResult.score) : '', record.preconditionResult ? assessmentLabels[record.preconditionResult.assessment] : ''];
  });
}

export async function exportPoseResultsToExcel(records: PoseResultRecord[], isCurrentAdmin: () => boolean): Promise<void> {
  if (!isCurrentAdmin()) throw new Error('Chỉ Admin được xuất kết quả AI Pose.');
  if (!records.length) throw new Error('Không có kết quả trong bộ lọc hiện tại để xuất.');
  const XLSX = await import('xlsx');
  if (!isCurrentAdmin()) throw new Error('Quyền xuất kết quả AI Pose đã thay đổi.');
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(POSE_EXPORT_COLUMNS), ...poseExcelRows(records)]);
  sheet['!cols'] = POSE_EXPORT_COLUMNS.map((_, i) => ({ wch: [0, 2, 5, 6, 7].includes(i) ? 32 : 22 }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Ket_qua_AI_Pose');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  if (!isCurrentAdmin()) throw new Error('Quyền xuất kết quả AI Pose đã thay đổi.');
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ket-qua-ai-pose-${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })}.xlsx`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
