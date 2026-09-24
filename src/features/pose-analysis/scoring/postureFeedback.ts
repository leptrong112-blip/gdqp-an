import type { FeatureId, MovementId } from '../types';
import type { CriterionResult, CriterionStatusLevel, FeatureRule } from './scoringTypes';

export interface RequirementCardResult {
  id: string;
  number: number;
  title: string;
  points: number;
  maximum: number;
  statusLevel: CriterionStatusLevel;
  feedback: string;
  mistakes: string[];
  subCriteria?: CriterionResult[];
}

/**
 * Chẩn đoán lỗi cụ thể bằng tiếng Việt dựa trên các số đo thực tế đã tính toán.
 */
export function diagnoseMeasurements(
  criterionId: string,
  measurements: { feature: FeatureId; value: number; variability: number }[],
  defaultFeedback: string,
  fraction: number,
  rules?: FeatureRule[]
): { statusLevel: CriterionStatusLevel; specificFeedback: string; mistakes: string[] } {
  const mistakes: string[] = [];
  const measurementMap = new Map(measurements.map(m => [m.feature, m.value]));

  let statusLevel: CriterionStatusLevel = 'PASS';
  if (fraction >= 0.9) {
    statusLevel = 'PASS';
  } else if (fraction >= 0.6) {
    statusLevel = 'NEEDS_ADJUSTMENT';
  } else {
    statusLevel = 'NOT_ACHIEVED';
  }

  switch (criterionId) {
    case 'feet': {
      const heelGap = measurementMap.get('heelGapRatio');
      const angle = measurementMap.get('footOpeningAngle');

      if (heelGap !== undefined && heelGap > 0.18) {
        mistakes.push('Hai gót chân chưa đủ gần nhau.');
      }
      if (angle !== undefined) {
        if (angle < 35) {
          mistakes.push('Hai mũi chân mở hơi hẹp (dưới 45°).');
        } else if (angle > 55) {
          mistakes.push('Hai mũi chân mở hơi rộng (quá 45°).');
        }
      }
      break;
    }

    case 'torso': {
      const tilt = measurementMap.get('torsoTilt');
      if (tilt !== undefined && tilt > 7) {
        mistakes.push('Thân người đang hơi nghiêng.');
      }
      break;
    }

    case 'balance': {
      const shoulderTilt = measurementMap.get('shoulderTilt');
      const hipTilt = measurementMap.get('hipTilt');

      if (shoulderTilt !== undefined && shoulderTilt > 5) {
        mistakes.push('Vai trái và vai phải chưa cân bằng.');
      }
      if (hipTilt !== undefined && hipTilt > 5) {
        mistakes.push('Hai bên hông chưa thăng bằng.');
      }
      break;
    }

    case 'legs': {
      const maxKnee = measurementMap.get('maxKneeAngle');
      const minKnee = measurementMap.get('minKneeAngle');

      if (maxKnee !== undefined && minKnee !== undefined) {
        if (maxKnee < 170) {
          mistakes.push('Chưa giữ một chân thẳng làm chân trụ vững chắc.');
        }
        if (minKnee > 168) {
          mistakes.push('Chưa chùng một đầu gối ở tư thế đứng nghỉ.');
        } else if (minKnee < 145) {
          mistakes.push('Đầu gối chùng quá sâu, tránh khụy gối quá mức.');
        }
      } else {
        const leftKnee = measurementMap.get('leftKneeAngle');
        const rightKnee = measurementMap.get('rightKneeAngle');

        if (leftKnee !== undefined && leftKnee < 170) {
          mistakes.push('Đầu gối trái chưa duỗi thẳng.');
        }
        if (rightKnee !== undefined && rightKnee < 170) {
          mistakes.push('Đầu gối phải chưa duỗi thẳng.');
        }
      }
      break;
    }

    case 'arms': {
      const leftElbow = measurementMap.get('leftElbowAngle');
      const rightElbow = measurementMap.get('rightElbowAngle');
      const leftWrist = measurementMap.get('leftWristHipDistance');
      const rightWrist = measurementMap.get('rightWristHipDistance');

      if (leftWrist !== undefined && leftWrist > 0.55) {
        mistakes.push('Tay trái đang hơi cách thân.');
      }
      if (rightWrist !== undefined && rightWrist > 0.55) {
        mistakes.push('Tay phải đang hơi cách thân.');
      }
      if ((leftElbow !== undefined && leftElbow < 165) || (rightElbow !== undefined && rightElbow < 165)) {
        mistakes.push('Cánh tay chưa buông thẳng tự nhiên.');
      }
      break;
    }

    case 'saluteArm': {
      const wristHeadDist = measurementMap.get('rightWristHeadDistance');
      const rightElbow = measurementMap.get('rightElbowAngle');

      if (wristHeadDist !== undefined && wristHeadDist > 0.60) {
        mistakes.push('Tay phải nên đưa lên gần sát đuôi lông mày phải hoặc vành mũ hơn.');
      }
      if (rightElbow !== undefined) {
        if (rightElbow < 22) {
          mistakes.push('Khuỷu tay phải gập hơi sâu, mở nhẹ sang bên một chút.');
        } else if (rightElbow > 88) {
          mistakes.push('Cánh tay hơi duỗi thẳng, gập khuỷu tay lại gần đầu hơn.');
        }
      }
      break;
    }

    case 'leftArm': {
      const leftWrist = measurementMap.get('leftWristHipDistance');
      const leftElbow = measurementMap.get('leftElbowAngle');

      if (leftWrist !== undefined && leftWrist > 0.70) {
        mistakes.push('Tay trái nên buông xuôi tự nhiên sát bên thân người.');
      }
      if (leftElbow !== undefined && leftElbow < 145) {
        mistakes.push('Tay trái thả lỏng duỗi thẳng tự nhiên.');
      }
      break;
    }

    case 'head': {
      const headOffset = measurementMap.get('headOffset');
      if (headOffset !== undefined && headOffset > 0.12) {
        mistakes.push('Đầu đang lệch nhẹ sang một bên.');
      }
      break;
    }
  }

  let specificFeedback = defaultFeedback;
  // Nghiêm/nghỉ feedback must use the exact rubric, not the older hard-coded bands.
  if (rules) {
    mistakes.length = 0;
    if (statusLevel !== 'PASS') for (const rule of rules) {
      const value = measurementMap.get(rule.feature);
      if (value === undefined || (value >= rule.ideal[0] && value <= rule.ideal[1])) continue;
      const messages: Partial<Record<FeatureId, string>> = {
        heelGapRatio: 'Hai gót chân chưa đủ gần nhau.',
        footOpeningAngle: 'Điều chỉnh hai mũi chân mở chữ V tự nhiên, khoảng 45°.',
        torsoTilt: 'Giữ thân người ngay ngắn, tránh nghiêng hoặc cúi.',
        shoulderTilt: 'Giữ hai vai cân bằng tự nhiên.', hipTilt: 'Điều chỉnh độ nghiêng hông trong tư thế đang tập.',
        leftKneeAngle: 'Đầu gối trái gập nhiều; duỗi tự nhiên, không cần khóa gối.',
        rightKneeAngle: 'Đầu gối phải gập nhiều; duỗi tự nhiên, không cần khóa gối.',
        maxKneeAngle: 'Giữ một chân thẳng tự nhiên làm chân trụ.',
        minKneeAngle: value > rule.ideal[1] ? 'Chưa chùng một đầu gối ở tư thế đứng nghỉ.' : 'Đầu gối chùng quá sâu, tránh khụy gối quá mức.',
        kneeAngleDiff: value < rule.ideal[0] ? 'Chùng nhẹ một chân, tránh chùng đều cả hai chân.' : 'Hai chân chênh lệch quá nhiều; giảm độ khụy gối.',
        leftWristHipDistance: 'Tay trái đang hơi cách thân.', rightWristHipDistance: 'Tay phải đang hơi cách thân.',
        leftElbowAngle: 'Thả lỏng và duỗi tay trái tự nhiên.', rightElbowAngle: 'Thả lỏng và duỗi tay phải tự nhiên.',
        headOffset: 'Giữ đầu ngay ngắn ở giữa hai vai.',
      };
      const message = messages[rule.feature] ?? defaultFeedback;
      if (!mistakes.includes(message)) mistakes.push(message);
    }
  }
  if (statusLevel === 'PASS') {
    switch (criterionId) {
      case 'feet':
        specificFeedback = 'Gót chân khép sát, hai mũi chân mở hình chữ V chuẩn ~45°.';
        break;
      case 'torso':
        specificFeedback = 'Thân người thẳng đứng, ngực nở tự nhiên.';
        break;
      case 'balance':
        specificFeedback = 'Hai vai và hai bên hông thăng bằng ngang nhau.';
        break;
      case 'legs':
        specificFeedback = measurementMap.has('minKneeAngle')
          ? 'Một đầu gối chùng nhẹ, chân còn lại giữ thẳng làm chân trụ.'
          : 'Hai chân duỗi thẳng, đầu gối vững chắc.';
        break;
      case 'arms':
        specificFeedback = 'Hai tay buông thẳng dọc thân, áp sát cạnh đùi tự nhiên.';
        break;
      case 'saluteArm':
        specificFeedback = 'Tay phải giơ lên tự nhiên, vị trí chào rất tốt.';
        break;
      case 'leftArm':
        specificFeedback = 'Tay trái buông tự nhiên dọc thân, đúng tư thế.';
        break;
      case 'head':
        specificFeedback = 'Đầu ngay ngắn ở giữa hai vai, mắt nhìn thẳng.';
        break;
      default:
        specificFeedback = 'Giữ rất tốt tiêu chí này.';
    }
  } else if (mistakes.length > 0) {
    specificFeedback = mistakes[0];
  }

  return { statusLevel, specificFeedback, mistakes };
}

/**
 * Nhóm 6 tiêu chí thuật toán thành 4 Thẻ Yêu Cầu cốt lõi (tương ứng với Bước 2 hướng dẫn):
 * 1. Hai gót sát, mũi mở 45° (feet: 20đ)
 * 2. Thân người thẳng, ngực nở (torso 25đ + balance 15đ + legs 20đ = 60đ)
 * 3. Hai tay buông thẳng dọc thân (arms: 15đ)
 * 4. Đầu ngay ngắn, mắt nhìn thẳng (head: 5đ)
 */
export function buildRequirementCards(
  criteria: CriterionResult[],
  movementId: MovementId = 'attention'
): RequirementCardResult[] {
  const getCriterion = (id: string) => criteria.find(c => c.id === id);

  const feet = getCriterion('feet');
  const torso = getCriterion('torso');
  const balance = getCriterion('balance');
  const legs = getCriterion('legs');
  const arms = getCriterion('arms');
  const head = getCriterion('head');

  if (movementId === 'atEase') {
    // ═══════════════════ BÀI TẬP: TƯ THẾ ĐỨNG NGHỈ ═══════════════════
    // 1. Hai gót giữ vị trí, mũi mở 45°
    const card1Mistakes = feet?.mistakes ?? [];
    const card1Status: CriterionStatusLevel = !feet
      ? 'NOT_SCORABLE'
      : feet.statusLevel ?? (feet.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');

    const card1: RequirementCardResult = {
      id: 'card-feet',
      number: 1,
      title: 'Hai gót giữ vị trí, mũi mở 45°',
      points: feet?.points ?? 0,
      maximum: feet?.maximum ?? 20,
      statusLevel: card1Status,
      feedback: feet?.specificFeedback || feet?.feedback || 'Hai gót chân giữ nguyên vị trí, mũi mở khoảng 45°.',
      mistakes: card1Mistakes,
      subCriteria: feet ? [feet] : [],
    };

    // 2. Chùng một chân, chân trụ thẳng
    const card2Mistakes = legs?.mistakes ?? [];
    const card2Status: CriterionStatusLevel = !legs
      ? 'NOT_SCORABLE'
      : legs.statusLevel ?? (legs.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');

    const card2: RequirementCardResult = {
      id: 'card-legs',
      number: 2,
      title: 'Chùng một chân, chân trụ thẳng',
      points: legs?.points ?? 0,
      maximum: legs?.maximum ?? 25,
      statusLevel: card2Status,
      feedback: legs?.specificFeedback || legs?.feedback || 'Chùng nhẹ một đầu gối, dồn trọng tâm sang chân trụ thẳng.',
      mistakes: card2Mistakes,
      subCriteria: legs ? [legs] : [],
    };

    // 3. Thân người ngay ngắn, vai cân (torso 25đ + balance 15đ = 40đ)
    const upperSub = [torso, balance].filter(Boolean) as CriterionResult[];
    const upperPoints = Math.round(upperSub.reduce((sum, c) => sum + c.points, 0) * 10) / 10;
    const upperMax = upperSub.reduce((sum, c) => sum + c.maximum, 0) || 40;
    const upperRatio = upperMax > 0 ? upperPoints / upperMax : 0;
    const card3Mistakes = [...(torso?.mistakes ?? []), ...(balance?.mistakes ?? [])];

    let card3Status: CriterionStatusLevel = 'PASS';
    if (upperSub.length < 2) card3Status = 'NOT_SCORABLE';
    else if (upperRatio >= 0.9) card3Status = 'PASS';
    else if (upperRatio >= 0.6) card3Status = 'NEEDS_ADJUSTMENT';
    else card3Status = 'NOT_ACHIEVED';

    const card3: RequirementCardResult = {
      id: 'card-torso-balance',
      number: 3,
      title: 'Thân người ngay ngắn, vai cân',
      points: upperPoints,
      maximum: upperMax,
      statusLevel: card3Status,
      feedback: card3Status === 'PASS'
        ? 'Thân trên thẳng ngay ngắn, hai vai thăng bằng.'
        : (card3Mistakes[0] || 'Cần chú ý giữ vai thăng bằng và thân người không ngả nghiêng.'),
      mistakes: card3Mistakes,
      subCriteria: upperSub,
    };

    // 4. Hai tay buông tự nhiên, mắt nhìn thẳng (arms 10đ + head 5đ = 15đ)
    const armsHeadSub = [arms, head].filter(Boolean) as CriterionResult[];
    const armsHeadPoints = Math.round(armsHeadSub.reduce((sum, c) => sum + c.points, 0) * 10) / 10;
    const armsHeadMax = armsHeadSub.reduce((sum, c) => sum + c.maximum, 0) || 15;
    const armsHeadRatio = armsHeadMax > 0 ? armsHeadPoints / armsHeadMax : 0;
    const card4Mistakes = [...(arms?.mistakes ?? []), ...(head?.mistakes ?? [])];

    let card4Status: CriterionStatusLevel = 'PASS';
    if (armsHeadSub.length < 2) card4Status = 'NOT_SCORABLE';
    else if (armsHeadRatio >= 0.9) card4Status = 'PASS';
    else if (armsHeadRatio >= 0.6) card4Status = 'NEEDS_ADJUSTMENT';
    else card4Status = 'NOT_ACHIEVED';

    const card4: RequirementCardResult = {
      id: 'card-arms-head',
      number: 4,
      title: 'Hai tay buông tự nhiên, mắt nhìn thẳng',
      points: armsHeadPoints,
      maximum: armsHeadMax,
      statusLevel: card4Status,
      feedback: card4Status === 'PASS'
        ? 'Hai tay buông tự nhiên dọc thân, mắt nhìn thẳng về phía trước.'
        : (card4Mistakes[0] || 'Hai tay buông tự nhiên dọc thân, cằm hơi thu.'),
      mistakes: card4Mistakes,
      subCriteria: armsHeadSub,
    };

    return [card1, card2, card3, card4];
  }

  if (movementId === 'turnLeft' || movementId === 'turnRight') {
    // ═══════════════════ BÀI TẬP: ĐỘNG TÁC QUAY (QUAY TRÁI / QUAY PHẢI) ═══════════════════
    const isLeft = movementId === 'turnLeft';
    const direction = getCriterion('direction');
    const angle = getCriterion('angle');
    const torso = getCriterion('torso');
    const stability = getCriterion('stability');
    const arms = getCriterion('arms');

    // 1. Hướng quay
    const card1Status: CriterionStatusLevel = !direction
      ? 'NOT_SCORABLE'
      : direction.statusLevel ?? (direction.status === 'good' ? 'PASS' : 'NOT_ACHIEVED');
    const card1: RequirementCardResult = {
      id: 'card-direction',
      number: 1,
      title: `Hướng quay sang ${isLeft ? 'trái' : 'phải'}`,
      points: direction?.points ?? 0,
      maximum: direction?.maximum ?? 25,
      statusLevel: card1Status,
      feedback: direction?.specificFeedback || direction?.feedback || `Quay đúng sang phía ${isLeft ? 'trái' : 'phải'}.`,
      mistakes: direction?.mistakes ?? [],
      subCriteria: direction ? [direction] : [],
    };

    // 2. Góc quay vuông 90°
    const card2Status: CriterionStatusLevel = !angle
      ? 'NOT_SCORABLE'
      : angle.statusLevel ?? (angle.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');
    const card2: RequirementCardResult = {
      id: 'card-angle',
      number: 2,
      title: 'Góc quay vuông 90°',
      points: angle?.points ?? 0,
      maximum: angle?.maximum ?? 25,
      statusLevel: card2Status,
      feedback: angle?.specificFeedback || angle?.feedback || 'Quay dứt khoát đến góc vuông 90°.',
      mistakes: angle?.mistakes ?? [],
      subCriteria: angle ? [angle] : [],
    };

    // 3. Thân người thẳng & vai cân
    const card3Status: CriterionStatusLevel = !torso
      ? 'NOT_SCORABLE'
      : torso.statusLevel ?? (torso.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');
    const card3: RequirementCardResult = {
      id: 'card-torso',
      number: 3,
      title: 'Thân người thẳng & vai cân',
      points: torso?.points ?? 0,
      maximum: torso?.maximum ?? 20,
      statusLevel: card3Status,
      feedback: torso?.specificFeedback || torso?.feedback || 'Giữ thân người thẳng đứng khi chuyển động.',
      mistakes: torso?.mistakes ?? [],
      subCriteria: torso ? [torso] : [],
    };

    // 4. Giữ thế kết thúc & khép tay
    const holdSub = [stability, arms].filter(Boolean) as CriterionResult[];
    const holdPoints = Math.round(holdSub.reduce((s, c) => s + c.points, 0) * 10) / 10;
    const holdMax = holdSub.reduce((s, c) => s + c.maximum, 0) || 30;
    const holdRatio = holdMax > 0 ? holdPoints / holdMax : 0;
    const card4Mistakes = [...(stability?.mistakes ?? []), ...(arms?.mistakes ?? [])];
    let card4Status: CriterionStatusLevel = 'PASS';
    if (holdSub.length < 2) card4Status = 'NOT_SCORABLE';
    else if (holdRatio >= 0.88) card4Status = 'PASS';
    else if (holdRatio >= 0.6) card4Status = 'NEEDS_ADJUSTMENT';
    else card4Status = 'NOT_ACHIEVED';

    const card4: RequirementCardResult = {
      id: 'card-hold-arms',
      number: 4,
      title: 'Giữ thế kết thúc & khép tay',
      points: holdPoints,
      maximum: holdMax,
      statusLevel: card4Status,
      feedback: card4Status === 'PASS'
        ? 'Tư thế kết thúc vững vàng, hai tay khép sát chỉ quần.'
        : (card4Mistakes[0] || 'Cần giữ yên ổn định 1.5 giây sau khi quay.'),
      mistakes: card4Mistakes,
      subCriteria: holdSub,
    };

    return [card1, card2, card3, card4];
  }

  if (movementId === 'salute') {
    // ═══════════════════ BÀI TẬP: ĐỘNG TÁC CHÀO / THÔI CHÀO ═══════════════════
    const saluteArm = getCriterion('saluteArm');
    const leftArm = getCriterion('leftArm');

    // Thẻ 1: Tay phải giơ lên chào tự nhiên (35 điểm)
    const card1Status: CriterionStatusLevel = !saluteArm
      ? 'NOT_SCORABLE'
      : saluteArm.statusLevel ?? (saluteArm.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');
    const card1: RequirementCardResult = {
      id: 'card-salute-arm',
      number: 1,
      title: 'Tay phải giơ lên chào tự nhiên',
      points: saluteArm?.points ?? 0,
      maximum: saluteArm?.maximum ?? 35,
      statusLevel: card1Status,
      feedback: card1Status === 'PASS'
        ? 'Tay phải đưa lên tự nhiên, ngón tay đặt sát mép ngoài đuôi lông mày hoặc vành mũ bên phải.'
        : (saluteArm?.specificFeedback || saluteArm?.feedback || 'Tay phải giơ lên tự nhiên, đầu ngón tay gần đuôi lông mày phải.'),
      mistakes: saluteArm?.mistakes ?? [],
      subCriteria: saluteArm ? [saluteArm] : [],
    };

    // Thẻ 2: Tay trái buông tự nhiên dọc thân (15 điểm)
    const card2Status: CriterionStatusLevel = !leftArm
      ? 'NOT_SCORABLE'
      : leftArm.statusLevel ?? (leftArm.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');
    const card2: RequirementCardResult = {
      id: 'card-left-arm',
      number: 2,
      title: 'Tay trái buông tự nhiên dọc thân',
      points: leftArm?.points ?? 0,
      maximum: leftArm?.maximum ?? 15,
      statusLevel: card2Status,
      feedback: card2Status === 'PASS'
        ? 'Tay trái thả lỏng buông thẳng tự nhiên dọc thân người.'
        : (leftArm?.specificFeedback || leftArm?.feedback || 'Tay trái buông thẳng tự nhiên dọc thân.'),
      mistakes: leftArm?.mistakes ?? [],
      subCriteria: leftArm ? [leftArm] : [],
    };

    // Thẻ 3: Thân người ngay ngắn & Đứng thẳng (torso 20đ + legs 15đ + feet 10đ = 45 điểm)
    const bodySub = [torso, legs, feet].filter(Boolean) as CriterionResult[];
    const bodyPoints = Math.round(bodySub.reduce((sum, c) => sum + c.points, 0) * 10) / 10;
    const bodyMax = bodySub.reduce((sum, c) => sum + c.maximum, 0) || 45;
    const bodyRatio = bodyMax > 0 ? bodyPoints / bodyMax : 0;
    const card3Mistakes = [
      ...(torso?.mistakes ?? []),
      ...(legs?.mistakes ?? []),
      ...(feet?.mistakes ?? []),
    ];

    let card3Status: CriterionStatusLevel = 'PASS';
    if (bodySub.length < 3) card3Status = 'NOT_SCORABLE';
    else if (bodyRatio >= 0.85) card3Status = 'PASS';
    else if (bodyRatio >= 0.6) card3Status = 'NEEDS_ADJUSTMENT';
    else card3Status = 'NOT_ACHIEVED';

    const card3Feedback = card3Status === 'PASS'
      ? 'Thân người giữ ngay ngắn tự nhiên, hai chân đứng vững vàng.'
      : card3Mistakes[0] || 'Cần chú ý giữ thân ngay ngắn, đứng vững trên hai chân.';

    const card3: RequirementCardResult = {
      id: 'card-body-salute',
      number: 3,
      title: 'Thân người ngay ngắn & Đứng thẳng',
      points: bodyPoints,
      maximum: bodyMax,
      statusLevel: card3Status,
      feedback: card3Feedback,
      mistakes: card3Mistakes,
      subCriteria: bodySub,
    };

    // Thẻ 4: Đầu ngay ngắn, mắt nhìn thẳng (5 điểm)
    const card4Status: CriterionStatusLevel = !head
      ? 'NOT_SCORABLE'
      : head.statusLevel ?? (head.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');
    const card4: RequirementCardResult = {
      id: 'card-head-salute',
      number: 4,
      title: 'Đầu ngay ngắn, mắt nhìn thẳng',
      points: head?.points ?? 0,
      maximum: head?.maximum ?? 5,
      statusLevel: card4Status,
      feedback: card4Status === 'PASS'
        ? 'Đầu ngay ngắn ở giữa hai vai, mắt nhìn thẳng về phía trước vào đối tượng chào.'
        : (head?.specificFeedback || head?.feedback || 'Cằm thu nhẹ, mắt nhìn thẳng.'),
      mistakes: head?.mistakes ?? [],
      subCriteria: head ? [head] : [],
    };

    return [card1, card2, card3, card4];
  }

  // ═══════════════════ BÀI TẬP: TƯ THẾ ĐỨNG NGHIÊM (MẶC ĐỊNH) ═══════════════════

  // Thẻ 1: Hai gót sát, mũi mở 45°
  const card1Mistakes = feet?.mistakes ?? [];
  const card1Status: CriterionStatusLevel = !feet
    ? 'NOT_SCORABLE'
    : feet.statusLevel ?? (feet.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');

  const card1: RequirementCardResult = {
    id: 'card-feet',
    number: 1,
    title: 'Hai gót sát, mũi mở 45°',
    points: feet?.points ?? 0,
    maximum: feet?.maximum ?? 20,
    statusLevel: card1Status,
    feedback: feet?.specificFeedback || feet?.feedback || 'Hai gót chân chạm sát nhau, mở mũi chân khoảng 45°.',
    mistakes: card1Mistakes,
    subCriteria: feet ? [feet] : [],
  };

  // Thẻ 2: Thân người thẳng, ngực nở (gồm Thân thẳng 25đ + Vai hông cân 15đ + Chân thẳng 20đ = 60đ)
  const bodySub = [torso, balance, legs].filter(Boolean) as CriterionResult[];
  const bodyPoints = Math.round(bodySub.reduce((sum, c) => sum + c.points, 0) * 10) / 10;
  const bodyMax = bodySub.reduce((sum, c) => sum + c.maximum, 0) || 60;
  const bodyRatio = bodyMax > 0 ? bodyPoints / bodyMax : 0;

  const card2Mistakes = [
    ...(torso?.mistakes ?? []),
    ...(balance?.mistakes ?? []),
    ...(legs?.mistakes ?? []),
  ];

  let card2Status: CriterionStatusLevel = 'PASS';
  if (bodySub.length < 3) card2Status = 'NOT_SCORABLE';
  else if (bodySub.some(c => c.required && c.statusLevel === 'NOT_ACHIEVED')) card2Status = 'NOT_ACHIEVED';
  else if (bodyRatio >= 0.9) card2Status = 'PASS';
  else if (bodyRatio >= 0.6) card2Status = 'NEEDS_ADJUSTMENT';
  else card2Status = 'NOT_ACHIEVED';

  const card2Feedback = card2Status === 'PASS'
    ? 'Thân người thẳng, ngực nở, vai hông cân đối và hai chân duỗi thẳng.'
    : card2Mistakes[0] || 'Cần chú ý giữ thân thẳng và thăng bằng hai vai.';

  const card2: RequirementCardResult = {
    id: 'card-body',
    number: 2,
    title: 'Thân người thẳng, ngực nở',
    points: bodyPoints,
    maximum: bodyMax,
    statusLevel: card2Status,
    feedback: card2Feedback,
    mistakes: card2Mistakes,
    subCriteria: bodySub,
  };

  // Thẻ 3: Hai tay buông thẳng dọc thân
  const card3Mistakes = arms?.mistakes ?? [];
  const card3Status: CriterionStatusLevel = !arms
    ? 'NOT_SCORABLE'
    : arms.statusLevel ?? (arms.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');

  const card3: RequirementCardResult = {
    id: 'card-arms',
    number: 3,
    title: 'Hai tay buông thẳng dọc thân',
    points: arms?.points ?? 0,
    maximum: arms?.maximum ?? 15,
    statusLevel: card3Status,
    feedback: arms?.specificFeedback || arms?.feedback || 'Các ngón tay khép tự nhiên, áp nhẹ cạnh đùi.',
    mistakes: card3Mistakes,
    subCriteria: arms ? [arms] : [],
  };

  // Thẻ 4: Đầu ngay ngắn, mắt nhìn thẳng
  const card4Mistakes = head?.mistakes ?? [];
  const card4Status: CriterionStatusLevel = !head
    ? 'NOT_SCORABLE'
    : head.statusLevel ?? (head.status === 'good' ? 'PASS' : 'NEEDS_ADJUSTMENT');

  const card4: RequirementCardResult = {
    id: 'card-head',
    number: 4,
    title: 'Đầu ngay ngắn, mắt nhìn thẳng',
    points: head?.points ?? 0,
    maximum: head?.maximum ?? 5,
    statusLevel: card4Status,
    feedback: head?.specificFeedback || head?.feedback || 'Cằm thu nhẹ, mắt nhìn thẳng ngang tầm.',
    mistakes: card4Mistakes,
    subCriteria: head ? [head] : [],
  };

  return [card1, card2, card3, card4];
}

/**
 * Trích xuất 1-2 điểm cần cải thiện nhất từ các tiêu chí bị trừ điểm nhiều nhất.
 */
export function extractTopCorrections(criteria: CriterionResult[]): string[] {
  // Lọc các tiêu chí bị trừ điểm, sắp xếp giảm dần theo số điểm bị mất
  const penalized = [...criteria]
    .filter(c => c.maximum - c.points > 0.2)
    .sort((a, b) => (b.maximum - b.points) - (a.maximum - a.points));

  const corrections: string[] = [];
  for (const c of penalized) {
    const mistake = (c.mistakes && c.mistakes.length > 0) ? c.mistakes[0] : c.specificFeedback || c.feedback;
    if (mistake && !corrections.includes(mistake)) {
      corrections.push(mistake);
    }
    if (corrections.length >= 2) break;
  }

  return corrections;
}
