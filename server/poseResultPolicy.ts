/** Per-process/isolate protection for anonymous, JSON-only learning-result submissions. */
export const POSE_RESULT_BODY_LIMIT = 262_144;
export const POSE_RESULT_LIST_LIMIT = 10_000;
export function createPoseSubmissionLimiter() {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()): boolean => {
    for (const [entry, value] of attempts) if (value.resetAt <= now) attempts.delete(entry);
    const current = attempts.get(key);
    if (!current) { attempts.set(key, { count: 1, resetAt: now + 600_000 }); return true; }
    if (current.count >= 120) return false;
    current.count++;
    return true;
  };
}
