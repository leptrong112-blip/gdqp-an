/** Persisted learning results only: camera images, videos and landmarks never enter this contract. */
export const POSE_RESULT_MOVEMENTS = ['attention', 'atEase', 'salute', 'turnLeft', 'turnRight', 'basicDrill'] as const;
export type PoseResultMovementId = typeof POSE_RESULT_MOVEMENTS[number];
export type PoseResultAssessment = 'pass' | 'fail' | 'incomplete';
export type PoseResultCriterionStatus = 'PASS' | 'NEEDS_ADJUSTMENT' | 'NOT_ACHIEVED' | 'NOT_SCORABLE';
export interface PoseResultCriterion {
  id: string;
  label: string;
  points: number;
  maximum: number;
  statusLevel: PoseResultCriterionStatus;
  required?: boolean;
  feedback: string;
}
export interface PoseResultFeedback {
  criterionId: string;
  label: string;
  type: 'MOTION_ERROR' | 'INSUFFICIENT_EVIDENCE';
  message: string;
  required?: boolean;
}
export interface PoseResultQuality { confidence?: number; unassessedPoints?: number }
export interface PoseResultStep {
  movementId: 'attention' | 'atEase' | 'salute';
  movementLabel: string;
  score: number;
  passed: boolean;
  assessment: PoseResultAssessment;
  requiredCriteriaPassed: boolean | null;
  criteria: PoseResultCriterion[];
  conciseFeedback: PoseResultFeedback[];
  quality?: PoseResultQuality;
}
export interface PoseResultRecord {
  /** Stable attempt ID. An explicit retry creates a different ID. */
  id: string;
  studentName: string;
  className: string;
  movementId: PoseResultMovementId;
  movementLabel: string;
  /** All movements, including Basic Drill, use a normalized 0–100 overall score. */
  score: number;
  passed: boolean;
  assessment: PoseResultAssessment;
  requiredCriteriaPassed: boolean | null;
  criteria: PoseResultCriterion[];
  conciseFeedback: PoseResultFeedback[];
  quality?: PoseResultQuality;
  stepResults?: PoseResultStep[];
  preconditionResult?: PoseResultStep;
  startedAt: string;
  finishedAt: string;
  /** Null until the UI has measured the rendered result. */
  processingLatencyMs: number | null;
  rubricVersion: string;
  createdAt: string;
}
export type PoseResultSubmission = Omit<PoseResultRecord, 'createdAt'>;
export interface PoseResultSaveResponse { ok: true; id: string; duplicate: boolean }
export interface PoseResultFilters {
  studentName?: string;
  className?: string;
  movementId?: PoseResultMovementId;
  assessment?: PoseResultAssessment;
  from?: string;
  to?: string;
  sort?: 'newest' | 'score';
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const boundedNumber = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const textValue = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max && !/[\u0000-\u001f\u007f]/.test(trimmed) ? trimmed : null;
};
const dateValue = (value: unknown): string | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const year = Number(value.slice(0, 4)), month = Number(value.slice(5, 7)), day = Number(value.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
      Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms >= 0 ? new Date(ms).toISOString() : null;
};
const assessmentValue = (value: unknown): value is PoseResultAssessment => ['pass', 'fail', 'incomplete'].includes(value as string);
const movementValue = (value: unknown): value is PoseResultMovementId => POSE_RESULT_MOVEMENTS.includes(value as PoseResultMovementId);

function criteriaValue(value: unknown): PoseResultCriterion[] | null {
  if (!Array.isArray(value) || !value.length || value.length > 48) return null;
  const result: PoseResultCriterion[] = [];
  for (const criterion of value) {
    if (!object(criterion)) return null;
    const id = textValue(criterion.id, 100), label = textValue(criterion.label, 160), feedback = textValue(criterion.feedback, 600);
    if (!id || !label || !feedback || result.some(item => item.id === id) || !boundedNumber(criterion.maximum, 0.01, 100) ||
        !boundedNumber(criterion.points, 0, criterion.maximum) || !['PASS', 'NEEDS_ADJUSTMENT', 'NOT_ACHIEVED', 'NOT_SCORABLE'].includes(criterion.statusLevel as string) ||
        (criterion.required !== undefined && typeof criterion.required !== 'boolean') || (criterion.statusLevel === 'NOT_SCORABLE' && criterion.points !== 0)) return null;
    result.push({ id, label, points: criterion.points, maximum: criterion.maximum, statusLevel: criterion.statusLevel as PoseResultCriterionStatus,
      ...(criterion.required !== undefined ? { required: criterion.required as boolean } : {}), feedback });
  }
  return result;
}
function feedbackValue(value: unknown): PoseResultFeedback[] | null {
  if (!Array.isArray(value) || value.length > 48) return null;
  const result: PoseResultFeedback[] = [];
  for (const item of value) {
    if (!object(item)) return null;
    const criterionId = textValue(item.criterionId, 100), label = textValue(item.label, 160), message = textValue(item.message, 600);
    if (!criterionId || !label || !message || !['MOTION_ERROR', 'INSUFFICIENT_EVIDENCE'].includes(item.type as string) ||
        (item.required !== undefined && typeof item.required !== 'boolean')) return null;
    result.push({ criterionId, label, message, type: item.type as PoseResultFeedback['type'], ...(item.required !== undefined ? { required: item.required as boolean } : {}) });
  }
  return result;
}
function qualityValue(value: unknown): PoseResultQuality | null {
  if (!object(value) || (value.confidence !== undefined && !boundedNumber(value.confidence, 0, 1)) ||
      (value.unassessedPoints !== undefined && !boundedNumber(value.unassessedPoints, 0, 100))) return null;
  return { ...(value.confidence !== undefined ? { confidence: value.confidence as number } : {}),
    ...(value.unassessedPoints !== undefined ? { unassessedPoints: value.unassessedPoints as number } : {}) };
}
function scoredValue(value: Record<string, unknown>): Omit<PoseResultStep, 'movementId' | 'movementLabel'> | null {
  const criteria = criteriaValue(value.criteria), conciseFeedback = feedbackValue(value.conciseFeedback);
  const quality = value.quality === undefined ? undefined : qualityValue(value.quality);
  if (!boundedNumber(value.score, 0, 100) || typeof value.passed !== 'boolean' || !assessmentValue(value.assessment) ||
      value.passed !== (value.assessment === 'pass') || ![true, false, null].includes(value.requiredCriteriaPassed as boolean | null) ||
      !criteria || !conciseFeedback || quality === null) return null;
  if (value.assessment === 'pass' && (criteria.some(item => item.statusLevel === 'NOT_SCORABLE') || value.score < 65)) return null;
  if (value.assessment === 'incomplete' && !criteria.some(item => item.statusLevel === 'NOT_SCORABLE')) return null;
  for (const item of conciseFeedback) {
    const criterion = criteria.find(candidate => candidate.id === item.criterionId);
    if (!criterion || (item.type === 'INSUFFICIENT_EVIDENCE') !== (criterion.statusLevel === 'NOT_SCORABLE') || criterion.statusLevel === 'PASS') return null;
  }
  return { score: value.score, passed: value.passed, assessment: value.assessment, requiredCriteriaPassed: value.requiredCriteriaPassed as boolean | null,
    criteria, conciseFeedback, ...(quality ? { quality } : {}) };
}

/** Strict shape/range validation followed by explicit whitelisting. Extra fields are never persisted. */
export function parsePoseResultSubmission(input: unknown): PoseResultSubmission | null {
  if (!object(input)) return null;
  const id = textValue(input.id, 100), studentName = textValue(input.studentName, 120), className = textValue(input.className, 40);
  const movementLabel = textValue(input.movementLabel, 160), rubricVersion = textValue(input.rubricVersion, 100);
  const startedAt = dateValue(input.startedAt), finishedAt = dateValue(input.finishedAt), scored = scoredValue(input);
  if (!id || !/^[a-zA-Z0-9_-]{8,100}$/.test(id) || !studentName || !className || !movementValue(input.movementId) || !movementLabel || !rubricVersion ||
      !startedAt || !finishedAt || Date.parse(finishedAt) < Date.parse(startedAt) || !scored ||
      (input.processingLatencyMs !== null && !boundedNumber(input.processingLatencyMs, 0, 3_600_000))) return null;
  let stepResults: PoseResultStep[] | undefined;
  if (input.movementId === 'basicDrill') {
    if (!Array.isArray(input.stepResults) || input.stepResults.length !== 3) return null;
    stepResults = [];
    for (const [index, movementId] of (['attention', 'atEase', 'salute'] as const).entries()) {
      const step = input.stepResults[index];
      if (!object(step) || step.movementId !== movementId) return null;
      const label = textValue(step.movementLabel, 160), score = scoredValue(step);
      if (!label || !score) return null;
      stepResults.push({ movementId, movementLabel: label, ...score });
    }
  } else if (input.stepResults !== undefined) return null;
  let preconditionResult: PoseResultStep | undefined;
  if (input.preconditionResult !== undefined) {
    const pre = input.preconditionResult;
    if (input.movementId === 'attention' || input.movementId === 'basicDrill' || !object(pre) || pre.movementId !== 'attention') return null;
    const fields = scoredValue(pre), label = textValue(pre.movementLabel, 160);
    if (!fields || !label || !fields.passed) return null;
    preconditionResult = { movementId: 'attention', movementLabel: label, ...fields };
  }
  return { id, studentName, className, movementId: input.movementId, movementLabel, ...scored,
    ...(stepResults ? { stepResults } : {}), ...(preconditionResult ? { preconditionResult } : {}), startedAt, finishedAt, processingLatencyMs: input.processingLatencyMs as number | null, rubricVersion };
}

export function validatePoseStudentInfo(studentName: string, className: string): { studentName: string; className: string } | null {
  const name = textValue(studentName, 120), classValue = textValue(className, 40);
  return name && classValue ? { studentName: name, className: classValue } : null;
}

const filterDate = (value: string | null, end: boolean): string | undefined => {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const iso = `${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z`;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? iso : undefined;
  }
  return dateValue(value) || undefined;
};
export function parsePoseResultFilters(params: URLSearchParams): PoseResultFilters {
  const studentName = params.get('studentName')?.trim().slice(0, 120), className = params.get('className')?.trim().slice(0, 40);
  const movementId = params.get('movementId'), assessment = params.get('assessment');
  return { ...(studentName ? { studentName } : {}), ...(className ? { className } : {}),
    ...(movementValue(movementId) ? { movementId } : {}), ...(assessmentValue(assessment) ? { assessment } : {}),
    from: filterDate(params.get('from'), false), to: filterDate(params.get('to'), true), sort: params.get('sort') === 'score' ? 'score' : 'newest' };
}
export function poseResultFilterParams(filters: PoseResultFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return params;
}
export function filterPoseResults(records: readonly PoseResultRecord[], filters: PoseResultFilters): PoseResultRecord[] {
  const fold = (value: string) => value.toLocaleLowerCase('vi').normalize('NFC');
  return records.filter(record => (!filters.studentName || fold(record.studentName).includes(fold(filters.studentName))) &&
    (!filters.className || fold(record.className).includes(fold(filters.className))) && (!filters.movementId || record.movementId === filters.movementId) &&
    (!filters.assessment || record.assessment === filters.assessment) && (!filters.from || Date.parse(record.finishedAt) >= Date.parse(filters.from)) && (!filters.to || Date.parse(record.finishedAt) <= Date.parse(filters.to)))
    .sort((a, b) => (filters.sort === 'score' ? b.score - a.score : 0) || Date.parse(b.finishedAt) - Date.parse(a.finishedAt) || Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
}
