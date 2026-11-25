import { authFetch, isSessionExpiredError, SessionExpiredError } from '@yggdrasil-lab/ui';
import type {
  Commitment,
  CommitmentCreate,
  CommitmentUpdate,
  DaySchedule,
  FrictionNote,
  FrictionNoteCreate,
  GridBlock,
  GridBlockCreate,
  GridBlockUpdate,
  GridException,
  GridExceptionUpsert,
  HabitCue,
  HabitCueCreate,
  HabitCueUpdate,
  NowNextState,
  PassiveSignalsResponse,
  PushSubscriptionPayload,
  PushSubscriptionResponse,
  PushUnsubscribeResponse,
  ScheduleExtendRequest,
  ScheduleExtendResponse,
  VapidPublicKeyResponse,
  WeeklyReflection,
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

export interface FetchCuesQuery {
  active_only?: boolean;
  grid_block_id?: number;
  zone_chain?: string;
}

export function fetchCues(query: FetchCuesQuery = {}): Promise<HabitCue[]> {
  const params = new URLSearchParams();
  if (query.active_only !== undefined) params.set('active_only', String(query.active_only));
  if (query.grid_block_id !== undefined) params.set('grid_block_id', String(query.grid_block_id));
  if (query.zone_chain) params.set('zone_chain', query.zone_chain);
  const qs = params.toString();
  return requestJson<HabitCue[]>(qs ? `/cues?${qs}` : '/cues');
}

export function createCue(payload: HabitCueCreate): Promise<HabitCue> {
  return requestJson<HabitCue>('/cues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateCue(cueId: number, payload: HabitCueUpdate): Promise<HabitCue> {
  return requestJson<HabitCue>(`/cues/${cueId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteCue(cueId: number): Promise<void> {
  return requestJson<void>(`/cues/${cueId}`, { method: 'DELETE' });
}

export interface FetchFrictionNotesQuery {
  start_date?: string;
  end_date?: string;
  habit_cue_id?: number;
  grid_block_id?: number;
  limit?: number;
}

export function fetchFrictionNotes(query: FetchFrictionNotesQuery = {}): Promise<FrictionNote[]> {
  const params = new URLSearchParams();
  if (query.start_date) params.set('start_date', query.start_date);
  if (query.end_date) params.set('end_date', query.end_date);
  if (query.habit_cue_id !== undefined) params.set('habit_cue_id', String(query.habit_cue_id));
  if (query.grid_block_id !== undefined) params.set('grid_block_id', String(query.grid_block_id));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  const qs = params.toString();
  return requestJson<FrictionNote[]>(qs ? `/friction-notes?${qs}` : '/friction-notes');
}

export function createFrictionNote(payload: FrictionNoteCreate): Promise<FrictionNote> {
  return requestJson<FrictionNote>('/friction-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteFrictionNote(noteId: number): Promise<void> {
  return requestJson<void>(`/friction-notes/${noteId}`, { method: 'DELETE' });
}

export function fetchWeeklyReflection(weekStart?: string): Promise<WeeklyReflection> {
  const params = new URLSearchParams();
  if (weekStart) params.set('week_start', weekStart);
  const qs = params.toString();
  return requestJson<WeeklyReflection>(qs ? `/friction-notes/reflection?${qs}` : '/friction-notes/reflection');
}

export function getPassiveSignals(targetDate: string): Promise<PassiveSignalsResponse> {
  const params = new URLSearchParams({ target_date: targetDate });
  return requestJson<PassiveSignalsResponse>(`/cues/passive-signals?${params.toString()}`);
}

export function extendActiveBlock(payload: ScheduleExtendRequest): Promise<ScheduleExtendResponse> {
  return requestJson<ScheduleExtendResponse>('/schedule/extend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getVapidPublicKey(): Promise<VapidPublicKeyResponse> {
  return requestJson<VapidPublicKeyResponse>('/push/vapid-public-key');
}

export function subscribePush(payload: PushSubscriptionPayload): Promise<PushSubscriptionResponse> {
  return requestJson<PushSubscriptionResponse>('/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function unsubscribePush(endpoint: string): Promise<PushUnsubscribeResponse> {
  return requestJson<PushUnsubscribeResponse>('/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
}
