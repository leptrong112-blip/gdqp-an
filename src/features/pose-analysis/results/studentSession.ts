export interface PoseStudentSession {
  studentName: string;
  className: string;
  startedAt: string;
}

export function createPoseStudentSession(studentName: string, className: string, now = new Date().toISOString()): PoseStudentSession | null {
  const identity = validatePoseStudentInfo(studentName, className);
  return identity ? Object.freeze({ ...identity, startedAt: now }) : null;
}
import { validatePoseStudentInfo } from './poseResultTypes';

