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

export const saluteMovement: MovementDefinition = {
  id: 'salute',
  label: 'Động tác chào / thôi chào',
  minimumDurationMs: 2400,
  minimumSamples: 18,
  criteria: [
    {
      id: 'saluteArm',
      label: 'Tay phải chào tự nhiên, đúng vị trí',
      weight: 35,
      rules: [
        below('rightWristHeadDistance', 0.60, 1.10),
        { feature: 'rightElbowAngle', ideal: [25, 85], zero: [10, 120] },
      ],
      feedback: 'Tay phải giơ lên tự nhiên, đầu ngón tay chạm sát mép ngoài đuôi lông mày bên phải (hoặc dưới vành mũ).',
    },
    {
      id: 'leftArm',
      label: 'Tay trái buông tự nhiên dọc thân',
      weight: 15,
      rules: [
        above('leftElbowAngle', 150, 115),
        below('leftWristHipDistance', 0.70, 1.30),
      ],
      feedback: 'Tay trái buông thẳng tự nhiên dọc thân người, khép nhẹ các ngón tay.',
    },
    {
      id: 'torso',
      label: 'Thân người ngay ngắn',
      weight: 20,
      rules: [
        below('torsoTilt', 10, 28),
        below('shoulderTilt', 12, 25),
      ],
      feedback: 'Giữ thân người ngay ngắn tự nhiên, hai vai thăng bằng.',
    },
    {
      id: 'legs',
      label: 'Hai chân đứng thẳng',
      weight: 15,
      rules: [
        above('leftKneeAngle', 155, 130),
        above('rightKneeAngle', 155, 130),
      ],
      feedback: 'Hai đầu gối thẳng tự nhiên, đứng vững vàng trên hai chân.',
    },
    {
      id: 'feet',
      label: 'Hai bàn chân mở tự nhiên',
      weight: 10,
      rules: [
        below('heelGapRatio', 0.35, 0.75),
        { feature: 'footOpeningAngle', ideal: [20, 65], zero: [0, 100] },
      ],
      feedback: 'Hai gót chân đứng gần nhau, mũi chân mở rộng hình chữ V tự nhiên.',
    },
    {
      id: 'head',
      label: 'Đầu ngay ngắn, mắt nhìn thẳng',
      weight: 5,
      rules: [
        below('headOffset', 0.20, 0.50),
      ],
      feedback: 'Đầu ngay ngắn, mắt nhìn thẳng về phía trước với thái độ trang nghiêm.',
    },
  ],
};
