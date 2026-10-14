import type { FeatureId } from '../types';

const labels: Partial<Record<FeatureId,string>> = {
  torsoTilt:'Độ nghiêng thân', shoulderTilt:'Độ nghiêng vai', hipTilt:'Độ nghiêng hông',
  leftKneeAngle:'Góc gối trái', rightKneeAngle:'Góc gối phải',
  minKneeAngle:'Gối chùng', maxKneeAngle:'Gối chân trụ', kneeAngleDiff:'Chênh lệch hai gối',
  leftElbowAngle:'Góc khuỷu trái', rightElbowAngle:'Góc khuỷu phải',
  leftWristHipDistance:'Khoảng cách cổ tay trái–hông', rightWristHipDistance:'Khoảng cách cổ tay phải–hông',
};
export const featureLabel = (id: FeatureId) => labels[id] ?? id;
