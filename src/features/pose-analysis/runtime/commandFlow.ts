import type { FeatureId, FeatureSample, MovementId } from '../types';
import { median } from '../pipeline/geometry';
import type { MovementDefinition } from '../scoring/scoringTypes';
import { attentionMovement } from '../scoring/attentionMovement';
import { atEaseMovement } from '../scoring/atEaseMovement';
import { ruleScore } from '../scoring/scoringEngine';
import { featureLabel } from '../diagnostics/featureLabels';

export const ATTENTION_FEET_INSTRUCTION = '2 gót chân đặt sát vào nhau, 2 mũi bàn chân mở rộng 45 độ.';
export const COMMAND_FLOW = {
  attention: { precondition: 'atEase', command: 'NGHIÊM' },
  atEase: { precondition: 'attention', command: 'NGHỈ' },
  turnLeft: { precondition: 'attention', command: 'BÊN TRÁI — QUAY' },
  turnRight: { precondition: 'attention', command: 'BÊN PHẢI — QUAY' },
  salute: { precondition: 'attention', command: 'CHÀO' },
  basicDrill: { precondition: 'atEase', command: 'NGHIÊM' },
} as const;
export type PoseCommandText = typeof COMMAND_FLOW[keyof typeof COMMAND_FLOW]['command'] | 'THÔI';
export type PreconditionStatus = 'WRONG_PRECONDITION' | 'INSUFFICIENT_EVIDENCE' | 'READY';
export const PREPARATION_STABLE_MS = 1500;
export const MOVEMENT_SETTLE_MS = 700;
export const COMMAND_OVERLAY_MS = 1100;
export const STOP_OVERLAY_MS = 1500;
export function commandFlow(id: MovementId) { return id === 'aboutFace' ? undefined : COMMAND_FLOW[id]; }
export function preparationDefinition(id: MovementId) {
  return commandFlow(id)?.precondition === 'atEase' ? atEaseMovement : attentionMovement;
}
/** Pose identity gate, not a grade: reuses existing rule bands without changing rubric math. */
export function postureReadiness(sample: FeatureSample | undefined, definition: MovementDefinition, options?: { allowUnobservedArms?: boolean; reasons?: string[] }): PreconditionStatus {
  const explain = (text: string) => options?.reasons?.push(text);
  if (!sample) { explain('Chưa tạo được số đo tư thế từ các khớp hiện tại.'); return 'INSUFFICIENT_EVIDENCE'; }
  const measured = (feature: FeatureId) => {
    const v = sample.values[feature];
    return `${featureLabel(feature)}: ${v && Number.isFinite(v.value) ? v.value.toFixed(feature.endsWith('Distance')?2:1) : 'chưa đo được'} (tin cậy ${v && Number.isFinite(v.confidence) ? Math.round(v.confidence*100)+'%' : 'chưa có'})`;
  };
  // Natural knee asymmetry inside the attention ideal band is not proof of nghỉ.
  // Require an observed bend outside that band as well as the resting identity.
  if (definition.id === 'attention') {
    const resting = atEaseMovement.criteria.find(c => c.id === 'legs')!;
    const restingValues = resting.rules.map(rule => sample.values[rule.feature]);
    if (restingValues.some(v => !v || !Number.isFinite(v.value) || v.confidence < .6)) {
      resting.rules.forEach((rule,i) => { const v=restingValues[i]; if(!v || !Number.isFinite(v.value) || v.confidence<.6) explain(`${measured(rule.feature)}; cần dữ liệu hiện tại với tin cậy ≥60%.`); });
      return 'INSUFFICIENT_EVIDENCE';
    }
    const attentionLegs = definition.criteria.find(c => c.id === 'legs')!;
    const naturallyStraight = attentionLegs.rules.every(rule => {
      const value = sample.values[rule.feature];
      return !!value && Number.isFinite(value.value) && value.confidence >= .6 && value.value >= rule.ideal[0] && value.value <= rule.ideal[1];
    });
    // A tolerated score for both mildly flexed knees is not evidence of nghỉ.
    // Require an actually straight support leg before the resting identity may
    // veto attention. Keep the attention leg/arm gates and all grade bands intact.
    const supportRule = resting.rules.find(rule => rule.feature === 'maxKneeAngle')!;
    const hasStraightSupport = sample.values.maxKneeAngle!.value >= supportRule.ideal[0];
    if (!naturallyStraight && hasStraightSupport && resting.rules.every((rule, i) => ruleScore(restingValues[i]!.value, rule) >= .6)) {
      explain(`Số đo gối đang giống tư thế nghỉ, chưa xác nhận nghiêm. ${measured('leftKneeAngle')}; ${measured('rightKneeAngle')}.`);
      return 'WRONG_PRECONDITION';
    }
  }
  const core = definition.criteria.filter(c => c.required || c.id === 'arms');
  let wrong = false;
  for (const criterion of core) {
    const scores: number[] = [], essential: number[] = [];
    for (const rule of criterion.rules) {
      const value = sample.values[rule.feature];
      if (!value || !Number.isFinite(value.value) || value.confidence < .6) {
        // Only acquisition may ignore unavailable arm evidence. Actual observed
        // arm errors still block readiness, and grading retains its own checks.
        if (criterion.id === 'arms' && options?.allowUnobservedArms) continue;
        explain(`${measured(rule.feature)}; cần dữ liệu hiện tại với tin cậy ≥60%.`);
        return 'INSUFFICIENT_EVIDENCE';
      }
      const score = ruleScore(value.value, rule); scores.push(score);
      if (rule.essential) essential.push(score);
    }
    if (!scores.length) continue;
    const fraction = definition.robustPosture ? Math.min(scores.reduce((a, b) => a + b, 0) / scores.length, ...essential) : Math.min(...scores);
    if (fraction < .6) {
      wrong = true;
      const failed=criterion.rules.filter(rule=>{ const v=sample.values[rule.feature]; return v && Number.isFinite(v.value) && v.confidence>=.6 && ruleScore(v.value,rule)<.6; });
      explain(`${criterion.label}: chưa qua ngưỡng nhận diện 60% (không phải điểm bài). ${failed.map(rule=>`${measured(rule.feature)}; khoảng lý tưởng ${rule.ideal.join('–')}`).join('; ')}.`);
    }
  }
  return wrong ? 'WRONG_PRECONDITION' : 'READY';
}

/** Identity confirmation only. Aggregated values never enter scoring evidence. */
export class PreparationReadiness {
  private samples: FeatureSample[] = [];
  private status: PreconditionStatus = 'INSUFFICIENT_EVIDENCE';
  private candidate: PreconditionStatus = 'INSUFFICIENT_EVIDENCE';
  private candidateSince = 0;
  private reasons: string[] = [];
  get diagnosticReasons() { return [...this.reasons]; }
  reset() { this.samples = []; this.status = this.candidate = 'INSUFFICIENT_EVIDENCE'; this.candidateSince = 0; this.reasons=[]; }
  update(sample: FeatureSample | undefined, definition: MovementDefinition): PreconditionStatus {
    const options = { allowUnobservedArms:true, reasons:[] as string[] };
    if (postureReadiness(sample, definition, options) === 'INSUFFICIENT_EVIDENCE' || !sample) {
      this.reset(); this.reasons=options.reasons; return this.status;
    }
    this.samples.push(sample);
    this.samples = this.samples.filter(s => sample.timestampMs - s.timestampMs <= 500).slice(-30);
    const identity: FeatureSample = { timestampMs:sample.timestampMs, values:{} };
    // Only keys observed NOW may be aggregated; do not carry missing features.
    for (const key of Object.keys(sample.values) as FeatureId[]) {
      const observed = this.samples.map(s => s.values[key]).filter(v => v && Number.isFinite(v.value) && v.confidence >= .6);
      // Isolated noisy elbow/knee estimates must not pull a natural standing
      // pose across its identity boundary. Sustained changes still replace this
      // short window; these robust values never enter grading evidence.
      if (observed.length) identity.values[key] = { value:median(observed.map(v => v!.value)), confidence:Math.min(...observed.map(v => v!.confidence)) };
    }
    options.reasons=[];
    const next = postureReadiness(identity, definition, options);
    if (this.status === 'INSUFFICIENT_EVIDENCE') this.status = next;
    if (next === this.status) { this.candidate = next; this.candidateSince = sample.timestampMs; }
    else {
      if (next !== this.candidate) { this.candidate = next; this.candidateSince = sample.timestampMs; }
      if (sample.timestampMs - this.candidateSince >= 300) this.status = next;
    }
    this.reasons = next === this.status ? options.reasons : ['Đang xác nhận thay đổi tư thế qua nhiều khung hình.', ...options.reasons];
    return this.status;
  }
}
