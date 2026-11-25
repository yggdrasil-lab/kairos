import { authFetch, isSessionExpiredError, SessionExpiredError } from '@yggdrasil-lab/ui';
import type {
  Commitment,
  CommitmentCreate,
  CommitmentUpdate,
  DaySchedule,
  GridBlock,
  GridBlockCreate,
  GridBlockUpdate,
  GridException,
  GridExceptionUpsert,
  NowNextState,
} from '../domain/types';

export { isSessionExpiredError, SessionExpiredError };

export class ApiRoutingError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(message: string, status: number, detail = '') {
    super(message);
    this.name = 'ApiRoutingError';
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isApiRoutingError(error: unknown): error is ApiRoutingError {
  return (
    error instanceof ApiRoutingError ||
    (error instanceof Error && error.name === 'ApiRoutingError')
  );
}

const API_BASE = '/api';

async function readErrorDetail(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) {
    return res.statusText || `HTTP ${res.status}`;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail: unknown }).detail;
      return typeof detail === 'string' ? detail : JSON.stringify(detail);
    }
  } catch {
    return text.slice(0, 200);
  }
  return text.slice(0, 200);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new ApiRoutingError(`Request failed (${res.status}): ${detail}`, res.status, detail);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    throw new ApiRoutingError(
      `Unexpected non-JSON response (${contentType || 'unknown'}) for ${path}`,
      res.status
    );
  }
  return (await res.json()) as T;
}

export function fetchNowNext(targetDate: string, nowMinute?: number): Promise<NowNextState> {
  const params = new URLSearchParams({ target_date: targetDate });
  if (nowMinute !== undefined) {
    params.set('now_minute', String(nowMinute));
  }
  return requestJson<NowNextState>(`/schedule/now-next?${params.toString()}`);
}

export function fetchDaySchedule(targetDate: string): Promise<DaySchedule> {
  const params = new URLSearchParams({ target_date: targetDate });
  return requestJson<DaySchedule>(`/schedule/day?${params.toString()}`);
}

export function fetchWeeklyGrid(dayOfWeek?: number): Promise<GridBlock[]> {
  const params = new URLSearchParams();
  if (dayOfWeek !== undefined) {
    params.set('day_of_week', String(dayOfWeek));
  }
  const query = params.toString();
  return requestJson<GridBlock[]>(query ? `/weekly-grid?${query}` : '/weekly-grid');
}

export function createGridBlock(payload: GridBlockCreate): Promise<GridBlock> {
  return requestJson<GridBlock>('/weekly-grid/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateGridBlock(blockId: number, payload: GridBlockUpdate): Promise<GridBlock> {
  return requestJson<GridBlock>(`/weekly-grid/blocks/${blockId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteGridBlock(blockId: number): Promise<void> {
  return requestJson<void>(`/weekly-grid/blocks/${blockId}`, { method: 'DELETE' });
}

export function fetchExceptions(targetDate: string): Promise<GridException[]> {
  const params = new URLSearchParams({ target_date: targetDate });
  return requestJson<GridException[]>(`/exceptions?${params.toString()}`);
}

export function upsertException(payload: GridExceptionUpsert): Promise<GridException> {
  return requestJson<GridException>('/exceptions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteException(exceptionId: number): Promise<void> {
  return requestJson<void>(`/exceptions/${exceptionId}`, { method: 'DELETE' });
}

export function fetchCommitments(startDate?: string, endDate?: string): Promise<Commitment[]> {
  const params = new URLSearchParams();
  if (startDate) {
    params.set('start_date', startDate);
  }
  if (endDate) {
    params.set('end_date', endDate);
  }
  const query = params.toString();
  return requestJson<Commitment[]>(query ? `/commitments?${query}` : '/commitments');
}

export function createCommitment(payload: CommitmentCreate): Promise<Commitment> {
  return requestJson<Commitment>('/commitments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateCommitment(
  commitmentId: number,
  payload: CommitmentUpdate
): Promise<Commitment> {
  return requestJson<Commitment>(`/commitments/${commitmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteCommitment(commitmentId: number): Promise<void> {
  return requestJson<void>(`/commitments/${commitmentId}`, { method: 'DELETE' });
}
