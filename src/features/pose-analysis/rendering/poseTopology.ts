import type { LandmarkName } from '../types';
export const POSE_CONNECTIONS: [LandmarkName, LandmarkName][] = [
  ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'], ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'], ['leftHip', 'rightHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'], ['leftAnkle', 'leftHeel'], ['leftHeel', 'leftFootIndex'], ['leftFootIndex', 'leftAnkle'], ['rightAnkle', 'rightHeel'], ['rightHeel', 'rightFootIndex'], ['rightFootIndex', 'rightAnkle'], ['nose', 'leftEar'], ['nose', 'rightEar'],
];
