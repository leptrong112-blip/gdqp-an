import type { PoseResultFilters, PoseResultRecord, PoseResultSaveResponse, PoseResultSubmission } from './poseResultTypes';

export class PoseResultsApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'PoseResultsApiError'; }
}

async function request<T>(path = '', options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/pose-results${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({ error: 'Máy chủ chưa trả về kết quả hợp lệ. Vui lòng thử lại.' }));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('gdqp-session-expired'));
    throw new PoseResultsApiError(data.error || 'Không thể kết nối dữ liệu AI Pose. Vui lòng thử lại.', response.status);
  }
  return data as T;
}

export function poseResultQuery(filters: Partial<PoseResultFilters> = {}): string {
  const query = new URLSearchParams();
  for (const key of ['studentName', 'className', 'movementId', 'assessment', 'from', 'to', 'sort'] as const) {
    const value = filters[key];
    if (value) {
      const date = (key === 'from' || key === 'to') && /^\d{4}-\d{2}-\d{2}$/.test(value);
      query.set(key, date ? `${value}T${key === 'to' ? '23:59:59.999' : '00:00:00.000'}+07:00` : value);
    }
  }
  return query.size ? `?${query}` : '';
}

export async function savePoseResult(result: PoseResultSubmission): Promise<PoseResultSaveResponse> {
  const data = await request<Partial<PoseResultSaveResponse> | null>('', { method: 'POST', body: JSON.stringify(result) });
  if (data?.ok !== true || data.id !== result.id || typeof data.duplicate !== 'boolean') {
    throw new PoseResultsApiError('Máy chủ chưa xác nhận đã lưu đúng lượt AI Pose. Vui lòng thử lưu lại.', 502);
  }
  return data as PoseResultSaveResponse;
}

export async function listPoseResults(filters: Partial<PoseResultFilters> = {}, signal?: AbortSignal): Promise<PoseResultRecord[]> {
  const data = await request<{ results: PoseResultRecord[] }>(poseResultQuery(filters), { signal });
  if (!Array.isArray(data.results)) throw new PoseResultsApiError('Danh sách kết quả AI Pose chưa hợp lệ.', 502);
  return data.results;
}

export async function getPoseResult(id: string, signal?: AbortSignal): Promise<PoseResultRecord> {
  const data = await request<{ result: PoseResultRecord }>(`/${encodeURIComponent(id)}`, { signal });
  if (!data.result) throw new PoseResultsApiError('Kết quả AI Pose chưa hợp lệ.', 502);
  return data.result;
}

export async function deletePoseResult(id: string): Promise<void> {
  const data = await request<{ ok?: unknown } | null>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (data?.ok !== true) throw new PoseResultsApiError('Máy chủ chưa xác nhận đã xóa kết quả AI Pose.', 502);
}

/** The server verifies the current session's Admin role before returning export data. */
export async function getPoseExportResults(filters: Partial<PoseResultFilters> = {}, signal?: AbortSignal): Promise<PoseResultRecord[]> {
  const data = await request<{ results: PoseResultRecord[] }>(`/export${poseResultQuery(filters)}`, { signal });
  if (!Array.isArray(data.results)) throw new PoseResultsApiError('Dữ liệu xuất AI Pose chưa hợp lệ.', 502);
  return data.results;
}
