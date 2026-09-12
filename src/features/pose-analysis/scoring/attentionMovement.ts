import type { MovementDefinition, FeatureRule } from './scoringTypes';
import type { FeatureId } from '../types';
const below = (feature: FeatureId, ideal: number, zero: number): FeatureRule => ({ feature, ideal: [0, ideal], zero: [0, zero] });
const above = (feature: FeatureId, ideal: number, zero: number): FeatureRule => ({ feature, ideal: [ideal, 180], zero: [zero, 180] });
export const attentionMovement: MovementDefinition = {
  id: 'attention', label: 'Đứng nghiêm', minimumDurationMs: 2400, minimumSamples: 18,
  criteria: [
    { id: 'torso', label: 'Thân thẳng', weight: 25, rules: [below('torsoTilt', 7, 25)], feedback: 'Giữ thân thẳng, tránh nghiêng hoặc cúi người.' },
    { id: 'balance', label: 'Vai và hông cân', weight: 15, rules: [below('shoulderTilt', 5, 18), below('hipTilt', 5, 18)], feedback: 'Giữ hai vai và hai bên hông cân bằng.' },
    { id: 'legs', label: 'Hai chân thẳng', weight: 20, rules: [above('leftKneeAngle', 170, 140), above('rightKneeAngle', 170, 140)], feedback: 'Duỗi thẳng hai đầu gối, giữ chân cân đối.' },
    { id: 'feet', label: 'Gót sát, bàn chân mở', weight: 20, rules: [below('heelGapRatio', 0.18, 0.65), { feature: 'footOpeningAngle', ideal: [35, 55], zero: [10, 90] }], feedback: 'Đưa hai gót chân sát nhau, mở hai mũi chân khoảng 45°.' },
    { id: 'arms', label: 'Tay dọc thân', weight: 15, rules: [above('leftElbowAngle', 165, 130), above('rightElbowAngle', 165, 130), below('leftWristHipDistance', 0.55, 1.15), below('rightWristHipDistance', 0.55, 1.15)], feedback: 'Duỗi tay tự nhiên và đưa hai bàn tay sát cạnh đùi.' },
    { id: 'head', label: 'Đầu ngay ngắn', weight: 5, rules: [below('headOffset', 0.12, 0.4)], feedback: 'Giữ đầu ngay ngắn ở giữa hai vai, nhìn về phía trước.' },
  ],
};
