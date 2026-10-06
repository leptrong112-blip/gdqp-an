import type { FeatureSample, FeatureId, SaluteHandMetrics } from '../types';
import type { CriterionResult } from './scoringTypes';
import { median, mad } from '../pipeline/geometry';

export function scoreSaluteHand(samples: FeatureSample[]): CriterionResult {
  const unknown = (): CriterionResult => ({ id:'saluteHand', label:'Bàn tay và ngón tay chào', points:0, maximum:10,
    status:'improve', statusLevel:'NOT_SCORABLE', feedback:'Camera chưa quan sát rõ và ổn định bàn tay phải ở tư thế chào. Phần này chưa được đánh giá, không trừ điểm vì thiếu hình ảnh.', mistakes:[], measurements:[] });
  const end = samples.at(-1)?.timestampMs ?? 0;
  const recent = samples.filter(s => s.timestampMs >= end - 1600 && s.saluteHand && Object.values(s.saluteHand).every(Number.isFinite));
  if (recent.length < 4 || end - recent.at(-1)!.timestampMs > 250 || recent.at(-1)!.timestampMs - recent[0].timestampMs < 600 ||
    recent.some((s,i) => i > 0 && (s.timestampMs <= recent[i-1].timestampMs || s.timestampMs - recent[i-1].timestampMs > 300))) return unknown();
  const rules: { key:keyof SaluteHandMetrics; feature:FeatureId; good:number; bad:number; variability:number; message:string }[] = [
    { key:'extension', feature:'saluteFingerExtension', good:155, bad:125, variability:15, message:'Các ngón tay còn co; duỗi tự nhiên khi chào.' },
    { key:'spread', feature:'saluteFingerSpread', good:18, bad:35, variability:12, message:'Các ngón tay đang xòe; khép các ngón lại.' },
    { key:'thumbGap', feature:'saluteThumbGap', good:.65, bad:1.1, variability:.2, message:'Ngón cái còn mở xa; khép nhẹ sát bàn tay.' },
    { key:'wristBend', feature:'saluteWristBend', good:30, bad:55, variability:15, message:'Cổ tay đang gập rõ so với cẳng tay.' },
    { key:'tipHeadDistance', feature:'saluteTipHeadDistance', good:.45, bad:.8, variability:.15, message:'Đầu ngón tay chưa gần vị trí chào bên phải đầu.' },
  ];
  let points = 0;
  const mistakes: string[] = [], measurements: CriterionResult['measurements'] = [];
  for (const rule of rules) {
    const values = recent.map(s => s.saluteHand![rule.key]), value = median(values), variability = mad(values);
    if (variability > rule.variability || values.filter(v => Math.abs(v-value) <= rule.variability).length / values.length < .75) return unknown();
    const fraction = Math.max(0,Math.min(1,(value-rule.bad)/(rule.good-rule.bad)));
    points += 2 * fraction;
    if (fraction < .8) mistakes.push(rule.message);
    measurements.push({ feature:rule.feature, value, variability });
  }
  points = Math.round(points * 10) / 10;
  const feedback = mistakes[0] ?? 'Các ngón duỗi và khép, cổ tay và vị trí đầu ngón phù hợp trong phần camera quan sát được.';
  return { id:'saluteHand', label:'Bàn tay và ngón tay chào', maximum:10, points, status:points >= 9 ? 'good' : 'improve',
    statusLevel:points >= 9 ? 'PASS' : points >= 6 ? 'NEEDS_ADJUSTMENT' : 'NOT_ACHIEVED', feedback, specificFeedback:feedback, mistakes, measurements };
}
