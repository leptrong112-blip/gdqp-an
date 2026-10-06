import type { MovementDefinition } from './scoringTypes';

/**
 * Factory tạo MovementDefinition cho động tác quay (Quay trái / Quay phải).
 * Tái sử dụng 1 thuật toán phân tích chung (Generic Dynamic Analyzer),
 * chỉ khác nhau về tham số cấu hình mục tiêu (Target Yaw).
 */
export function createTurnMovement(direction: 'left' | 'right'): MovementDefinition {
  const isLeft = direction === 'left';
  return {
    id: isLeft ? 'turnLeft' : 'turnRight',
    label: isLeft ? 'Động tác quay trái' : 'Động tác quay phải',
    type: 'DYNAMIC',
    minimumDurationMs: 1500,
    minimumSamples: 15,
    dynamicConfig: {
      direction,
      targetYawDeg: isLeft ? 90 : -90,
      yawToleranceDeg: 20,
      startReadyDurationMs: 500,
      finalHoldDurationMs: 1500,
      maxAttemptDurationMs: 8000,
    },
    criteria: [
      {
        id: 'direction',
        required: true,
        label: 'Hướng quay',
        weight: 25,
        rules: [
          {
            feature: 'bodyYaw',
            ideal: isLeft ? [70, 110] : [-110, -70],
            zero: isLeft ? [-45, 0] : [0, 45],
          },
        ],
        feedback: isLeft ? 'Cần quay sang bên trái.' : 'Cần quay sang bên phải.',
      },
      {
        id: 'angle',
        required: true,
        label: 'Góc quay 90°',
        weight: 25,
        rules: [
          {
            feature: 'turnProgress',
            ideal: [80, 100],
            zero: [0, 50],
          },
        ],
        feedback: 'Cần quay đủ góc vuông 90° dứt khoát.',
      },
      {
        id: 'torso',
        required: true,
        label: 'Thân thẳng & quay tại chỗ',
        weight: 10,
        rules: [
          {
            feature: 'torsoTilt',
            ideal: [0, 8],
            zero: [0, 18],
          },
        ],
        feedback: 'Giữ thân người ngay ngắn và quay tại chỗ; không bước đi để đổi hướng.',
      },
      {
        id: 'stability',
        required: true,
        label: 'Giữ thế kết thúc',
        weight: 20,
        rules: [
          {
            feature: 'torsoStability',
            ideal: [1, 1],
            zero: [0, 0],
          },
        ],
        feedback: 'Giữ yên thân người ổn định sau khi quay.',
      },
      {
        id: 'arms',
        label: 'Hai tay áp sát chỉ quần',
        weight: 10,
        rules: [
          {
            feature: 'leftWristHipDistance',
            ideal: [0, 0.65],
            zero: [0, 0.95],
          },
        ],
        feedback: 'Hai tay khép sát chỉ quần tự nhiên.',
      },
      { id: 'feetReady', label: 'Bàn chân khi chuẩn bị', weight: 5, required: true, rules: [], feedback: 'Hai gót gần sát, hai mũi chân mở chữ V.' },
      { id: 'feetFinal', label: 'Bàn chân khi kết thúc', weight: 5, required: true, rules: [], feedback: 'Khép chân về tư thế hai gót gần sát, hai mũi chân mở chữ V.' },
    ],
  };
}

export const turnLeftMovement = createTurnMovement('left');
export const turnRightMovement = createTurnMovement('right');
