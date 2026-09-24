import type { MovementDefinition, FeatureRule } from './scoringTypes';
import type { FeatureId } from '../types';

const below = (feature: FeatureId, ideal: number, zero: number): FeatureRule => ({
  feature,
  ideal: [0, ideal],
  zero: [0, zero],
});

const above = (feature: FeatureId, ideal: number, zero: number): FeatureRule => ({
  feature,
  ideal: [ideal, 180],
  zero: [zero, 180],
});

export const atEaseMovement: MovementDefinition = {
  id: 'atEase',
  label: 'Đứng nghỉ',
  minimumDurationMs: 2400,
  minimumSamples: 18,
  robustPosture: true,
  criteria: [
    {
      id: 'legs',
      label: 'Chùng một chân, giữ chân trụ',
      weight: 25,
      required: true,
      rules: [
        { ...above('maxKneeAngle', 165, 145), essential: true }, // Chân trụ thẳng tự nhiên
        { feature: 'minKneeAngle', ideal: [145, 175], zero: [120, 179], essential: true },
        // A small but consistent asymmetry is enough; identical straight knees are not nghỉ.
        { feature: 'kneeAngleDiff', ideal: [5, 35], zero: [1, 55], essential: true },
      ],
      feedback: 'Chùng nhẹ một đầu gối (trái hoặc phải), dồn trọng tâm sang chân trụ thẳng.',
    },
    {
      id: 'feet',
      label: 'Gót giữ vị trí, mũi mở',
      weight: 20,
      rules: [
        below('heelGapRatio', 0.28, 0.7),
        { feature: 'footOpeningAngle', ideal: [25, 65], zero: [5, 95] },
      ],
      feedback: 'Giữ hai gót chân tại vị trí, mở hai mũi chân khoảng 45°.',
    },
    {
      id: 'torso',
      label: 'Thân người ngay ngắn',
      weight: 25,
      required: true,
      rules: [below('torsoTilt', 9, 25)],
      feedback: 'Thân trên vẫn giữ ngay ngắn, không ngả nghiêng quá mức.',
    },
    {
      id: 'balance',
      label: 'Vai thăng bằng',
      weight: 15,
      rules: [below('shoulderTilt', 7, 20), below('hipTilt', 12, 25)],
      feedback: 'Giữ hai vai thăng bằng, hông hơi nghiêng tự nhiên theo chân chùng.',
    },
    {
      id: 'arms',
      label: 'Tay buông tự nhiên',
      weight: 10,
      rules: [
        below('leftWristHipDistance', 0.65, 1.25),
        below('rightWristHipDistance', 0.65, 1.25),
      ],
      feedback: 'Hai tay buông thẳng tự nhiên dọc hai bên thân.',
    },
    {
      id: 'head',
      label: 'Đầu ngay ngắn',
      weight: 5,
      rules: [below('headOffset', 0.15, 0.45)],
      feedback: 'Giữ đầu ngay ngắn ở giữa hai vai, nhìn về phía trước.',
    },
  ],
};
