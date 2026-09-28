import { LEGACY_ROUND_ID, surveyQuestions, type SurveyResponse, type SurveyRole, type SurveyPhase } from './survey';

export const responseRound = (row: SurveyResponse) => row.roundId || LEGACY_ROUND_ID;
export const filterRound = (rows: SurveyResponse[], roundId: string) => roundId === 'all' ? rows : rows.filter(row => responseRound(row) === roundId);

export function validSurveyAnswers(role: SurveyRole, phase: SurveyPhase, answers: unknown): answers is Record<string, number[]> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false;
  const valuesById = answers as Record<string, unknown>;
  const questions = surveyQuestions(role, phase);
  return Object.keys(answers).length === questions.length && questions.every(q => {
    const values = valuesById[q.id];
    return Array.isArray(values) && values.length > 0 && (q.multiple || values.length === 1)
      && new Set(values).size === values.length
      && values.every(v => Number.isInteger(v) && v >= 0 && v < q.options.length)
      && !(q.multiple && q.exclusiveLast && values.includes(q.options.length - 1) && values.length > 1);
  });
}

// Compare like-for-like questions, roles and experience phases, never mixed cohorts.
export function roundComparison(rows: SurveyResponse[], left: string, right: string, role: SurveyRole, phase: SurveyPhase, grade = 'all') {
  const eligible = rows.filter(r => r.role === role && r.phase === phase &&
    (role !== 'student' || grade === 'all' || r.className?.startsWith(grade)));
  const a = filterRound(eligible, left);
  const b = filterRound(eligible, right);
  type Metric = { n: number; value: number | null };
  type Comparison = { key: string; label: string; unit: string; left: Metric; right: Metric };
  return surveyQuestions(role, phase).flatMap<Comparison>(q => q.multiple ? q.options.map((label, index) => {
    const counts = [a, b].map(group => {
      const answered = group.filter(r => r.answers[q.id]?.length);
      return { n: answered.length, value: answered.length ? answered.filter(r => r.answers[q.id].includes(index)).length / answered.length * 100 : null };
    });
    return { key: `${q.id}-${index}`, label: `${q.text} — ${label}`, unit: '%' as const, left: counts[0], right: counts[1] };
  }) : (() => {
    const scoresFor = (group: SurveyResponse[]): Metric => {
      const scores = group.flatMap(r => r.answers[q.id]?.length === 1 ? [r.answers[q.id][0] + 1] : []);
      return { n: scores.length, value: scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null };
    };
    return [{ key: q.id, label: q.text, unit: '/5', left: scoresFor(a), right: scoresFor(b) }];
  })());
}
