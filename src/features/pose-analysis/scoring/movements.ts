import { attentionMovement } from './attentionMovement';
import { atEaseMovement } from './atEaseMovement';
import { turnLeftMovement, turnRightMovement } from './turnMovements';
import { saluteMovement } from './saluteMovement';
import type { MovementDefinition } from './scoringTypes';
import type { MovementId } from '../types';

export const MOVEMENTS: Partial<Record<MovementId, MovementDefinition>> = {
  attention: attentionMovement,
  atEase: atEaseMovement,
  turnLeft: turnLeftMovement,
  turnRight: turnRightMovement,
  salute: saluteMovement,
};

export interface ExerciseInfo {
  id: MovementId;
  name: string;
  shortDesc: string;
  badge: string;
  icon: string;
  definition?: MovementDefinition;
  available?: boolean;
  guidelines: {
    number: number;
    title: string;
    description: string;
  }[];
}

export const EXERCISE_CATALOG: ExerciseInfo[] = [
  {
    id: 'attention',
    name: 'Tư thế đứng nghiêm',
    shortDesc: 'Hai gót sát, mũi mở 45°, hai chân thẳng, tay áp sát chỉ quần.',
    badge: 'Cơ bản',
    icon: '🎖️',
    available: true,
    definition: attentionMovement,
    guidelines: [
      {
        number: 1,
        title: 'Hai gót sát, mũi mở 45°',
        description: 'Hai gót chân chạm sát nhau trên một đường thẳng. Hai mũi chân mở rộng hình chữ V khoảng 45°.',
      },
      {
        number: 2,
        title: 'Thân người thẳng, ngực nở',
        description: 'Hai đầu gối thẳng, ngực nở đều, bụng hơi thóp lại, hai vai thăng bằng ngang nhau.',
      },
      {
        number: 3,
        title: 'Hai tay buông thẳng dọc thân',
        description: 'Các ngón tay khép tự nhiên, ngón tay cái áp dọc theo mép đường chỉ quần.',
      },
      {
        number: 4,
        title: 'Đầu ngay ngắn, mắt nhìn thẳng',
        description: 'Cằm thu nhẹ vào trong, miệng ngậm, mắt nhìn thẳng ngang tầm về phía trước, giữ toàn thân bất động.',
      },
    ],
  },
  {
    id: 'atEase',
    name: 'Tư thế đứng nghỉ',
    shortDesc: 'Chùng nhẹ một đầu gối, dồn trọng tâm sang chân trụ, thân trên ngay ngắn.',
    badge: 'Cơ bản',
    icon: '🧘',
    available: true,
    definition: atEaseMovement,
    guidelines: [
      {
        number: 1,
        title: 'Hai gót giữ vị trí, mũi mở 45°',
        description: 'Hai gót chân vẫn giữ nguyên vị trí ban đầu, hai mũi chân mở hình chữ V khoảng 45°.',
      },
      {
        number: 2,
        title: 'Chùng một chân, chân trụ thẳng',
        description: 'Chùng nhẹ đầu gối chân trái (hoặc phải), dồn trọng tâm toàn thân sang chân còn lại giữ thẳng vững chắc.',
      },
      {
        number: 3,
        title: 'Thân người ngay ngắn, vai cân',
        description: 'Thân trên vẫn giữ ngay ngắn, không ngả nghiêng, hai vai thăng bằng ngang nhau.',
      },
      {
        number: 4,
        title: 'Hai tay buông tự nhiên, mắt nhìn thẳng',
        description: 'Hai tay buông thẳng tự nhiên dọc hai bên thân, các ngón tay nắm hờ hoặc khép nhẹ, mắt nhìn thẳng.',
      },
    ],
  },
  {
    id: 'turnLeft',
    name: 'Động tác quay trái',
    shortDesc: 'Lấy gót chân trái và mũi chân phải làm trụ, quay người 90° sang trái dứt khoát.',
    badge: 'Cơ bản',
    icon: '↩️',
    available: true,
    definition: turnLeftMovement,
    guidelines: [
      {
        number: 1,
        title: 'Tư thế chuẩn bị đứng nghiêm',
        description: 'Đứng nghiêm nhìn thẳng camera, hai gót sát, mũi mở 45°, hai tay áp sát mép chỉ quần.',
      },
      {
        number: 2,
        title: 'Gót trái & Mũi phải làm trụ',
        description: 'Lấy gót chân trái và mũi bàn chân phải làm trụ, giữ thân người thẳng chuẩn bị quay.',
      },
      {
        number: 3,
        title: 'Quay 90° sang trái dứt khoát',
        description: 'Dùng sức hai bàn chân xoay toàn thân sang trái một góc vuông 90°, trọng tâm dồn vào chân trái.',
      },
      {
        number: 4,
        title: 'Rút chân phải về & Giữ ổn định',
        description: 'Đưa chân phải lên khép sát gót chân trái thành tư thế đứng nghiêm, giữ yên bất động 1.5 giây.',
      },
    ],
  },
  {
    id: 'turnRight',
    name: 'Động tác quay phải',
    shortDesc: 'Lấy gót chân phải và mũi chân trái làm trụ, quay người 90° sang phải dứt khoát.',
    badge: 'Cơ bản',
    icon: '↪️',
    available: true,
    definition: turnRightMovement,
    guidelines: [
      {
        number: 1,
        title: 'Tư thế chuẩn bị đứng nghiêm',
        description: 'Đứng nghiêm nhìn thẳng camera, hai gót sát, mũi mở 45°, hai tay áp sát mép chỉ quần.',
      },
      {
        number: 2,
        title: 'Gót phải & Mũi trái làm trụ',
        description: 'Lấy gót chân phải và mũi bàn chân trái làm trụ, giữ thân người thẳng chuẩn bị quay.',
      },
      {
        number: 3,
        title: 'Quay 90° sang phải dứt khoát',
        description: 'Dùng sức hai bàn chân xoay toàn thân sang phải một góc vuông 90°, trọng tâm dồn vào chân phải.',
      },
      {
        number: 4,
        title: 'Rút chân trái về & Giữ ổn định',
        description: 'Đưa chân trái lên khép sát gót chân phải thành tư thế đứng nghiêm, giữ yên bất động 1.5 giây.',
      },
    ],
  },
  {
    id: 'aboutFace',
    name: 'Động tác quay đằng sau',
    shortDesc: 'Lấy gót chân phải và mũi chân trái làm trụ, quay người 180° từ trái qua phải.',
    badge: 'Sắp ra mắt',
    icon: '🔄',
    available: false,
    guidelines: [],
  },
  {
    id: 'salute',
    name: 'Động tác chào / thôi chào',
    shortDesc: 'Tay phải đưa lên, đầu ngón tay chạm vành mũ bên phải, mắt nhìn thẳng.',
    badge: 'SGK 10 · Bài 9',
    icon: '🫡',
    available: true,
    definition: saluteMovement,
    guidelines: [
      {
        number: 1,
        title: 'Tư thế chuẩn bị đứng nghiêm',
        description: 'Đứng nghiêm nhìn thẳng camera, hai gót sát, mũi mở 45°, hai tay áp sát mép chỉ quần.',
      },
      {
        number: 2,
        title: 'Tay phải đưa lên chào chuẩn xác',
        description: 'Tay phải đưa lên theo đường ngắn nhất, các ngón tay khép sát, đầu ngón tay chạm mép dưới vành mũ (hoặc đuôi lông mày phải).',
      },
      {
        number: 3,
        title: 'Tay trái giữ nghiêm & Thân người thẳng',
        description: 'Tay trái buông thẳng tự nhiên dọc thân, ngón tay khép sát mép chỉ quần; thân người giữ thẳng, ngực nở, hai vai thăng bằng.',
      },
      {
        number: 4,
        title: 'Đầu ngay ngắn, mắt nhìn thẳng',
        description: 'Đầu ngay ngắn, cằm thu nhẹ, mắt nhìn thẳng về phía trước; khi dứt động tác hạ tay xuống theo đường ngắn nhất về tư thế đứng nghiêm.',
      },
    ],
  },
];
