import type { PoseResultSubmission } from './poseResultTypes';
import { freezeSnapshot } from '../runtime/attemptTiming';

export type PoseSaveStatus = 'saving' | 'saved' | 'error';
export interface PoseSaveState { id: string; status: PoseSaveStatus; error?: string }

/** Retains each immutable payload across retry, rerender and student changes. */
export class PoseResultSaver {
  private entries = new Map<string, { record: PoseResultSubmission; state: PoseSaveState; pending?: Promise<void>; presentationTimer?: ReturnType<typeof setTimeout> }>();
  private listeners = new Set<() => void>();
  constructor(private save: (record: PoseResultSubmission) => Promise<unknown>) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState(id: string): PoseSaveState | null { return this.entries.get(id)?.state ?? null; }
  /** Queue at finalization, independently of dialog lifetime. The first paint may supply T7. */
  prepare(record: PoseResultSubmission, renderWaitMs = 100): void {
    if (this.entries.has(record.id)) return;
    const entry = { record: freezeSnapshot(record), state: Object.freeze({ id: record.id, status: 'saving' as const }), presentationTimer: undefined as ReturnType<typeof setTimeout> | undefined };
    this.entries.set(record.id, entry);
    entry.presentationTimer = setTimeout(() => { void this.run(record.id); }, renderWaitMs);
    this.notify();
  }
  presented(id: string, processingLatencyMs: number): void {
    const entry = this.entries.get(id);
    if (!entry?.presentationTimer || !Number.isFinite(processingLatencyMs) || processingLatencyMs < 0 || processingLatencyMs > 3_600_000) return;
    entry.record = freezeSnapshot({ ...entry.record, processingLatencyMs });
    void this.run(id);
  }
  submit(record: PoseResultSubmission): Promise<void> {
    const existing = this.entries.get(record.id);
    if (existing) return existing.pending ?? Promise.resolve();
    this.entries.set(record.id, { record: freezeSnapshot(record), state: { id: record.id, status: 'saving' } });
    return this.run(record.id);
  }
  retry(id: string): Promise<void> {
    const entry = this.entries.get(id);
    if (!entry || entry.state.status === 'saved') return Promise.resolve();
    return entry.pending ?? this.run(id);
  }
  private run(id: string): Promise<void> {
    const entry = this.entries.get(id)!;
    if (entry.presentationTimer) { clearTimeout(entry.presentationTimer); entry.presentationTimer = undefined; }
    entry.state = Object.freeze({ id, status: 'saving' });
    // Assign pending before calling the API, including APIs that throw synchronously.
    entry.pending = Promise.resolve().then(() => this.save(entry.record)).then(() => {
      entry.state = Object.freeze({ id, status: 'saved' });
    }, error => {
      entry.state = Object.freeze({ id, status: 'error', error: error instanceof Error ? error.message : 'Chưa lưu được kết quả.' });
    }).finally(() => { entry.pending = undefined; this.notify(); });
    this.notify();
    return entry.pending;
  }
  private notify() { this.listeners.forEach(listener => listener()); }
}
