export type NudgeMode = 'none' | 'boundary' | 'two-stage';

export type CommitmentSource = 'manual' | 'iris' | 'kratos';

export type SliceKind = 'grid_block' | 'commitment';

export type CockpitMobileTab = 'now' | 'today' | 'week' | 'cues';

export type DesktopWorkspaceTab = 'today' | 'week' | 'cues';

export type CuesSubTab = 'catalog' | 'reflection';

export type FrictionTag =
  | 'tired'
  | 'trigger_missed'
  | 'schedule_overrun'
  | 'environment_missing';

export interface GridBlock {
  id: number;
  title: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  category: string;
  nudge_mode: NudgeMode;
  active: boolean;
  notes: string | null;
}

export interface GridBlockCreate {
  title: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  category: string;
  nudge_mode: NudgeMode;
  active?: boolean;
  notes?: string | null;
}

export interface GridBlockUpdate {
  title?: string;
  day_of_week?: number;
  start_minute?: number;
  end_minute?: number;
  category?: string;
  nudge_mode?: NudgeMode;
  active?: boolean;
  notes?: string | null;
}

export interface GridException {
  id: number;
  grid_block_id: number;
  target_date: string;
  skipped: boolean;
  start_minute: number | null;
  end_minute: number | null;
  extension_count: number;
  notes: string | null;
}

export interface GridExceptionUpsert {
  grid_block_id: number;
  target_date: string;
  skipped: boolean;
  start_minute?: number | null;
  end_minute?: number | null;
  extension_count?: number;
  notes?: string | null;
}

export interface Commitment {
  id: number;
  title: string;
  target_date: string;
  start_minute: number | null;
  end_minute: number | null;
  all_day: boolean;
  source: CommitmentSource;
  external_ref: string | null;
  nudge_mode: NudgeMode;
  notes: string | null;
  has_conflict: boolean;
}

export interface CommitmentCreate {
  title: string;
  target_date: string;
  start_minute: number | null;
  end_minute: number | null;
  all_day: boolean;
  source?: CommitmentSource;
  external_ref?: string | null;
  nudge_mode: NudgeMode;
  notes?: string | null;
}

export interface CommitmentUpdate {
  title?: string;
  target_date?: string;
  start_minute?: number | null;
  end_minute?: number | null;
  all_day?: boolean;
  nudge_mode?: NudgeMode;
  notes?: string | null;
}

export interface ResolvedSlice {
  slice_id: string;
  kind: SliceKind;
  source_id: number;
  title: string;
  start_minute: number;
  end_minute: number;
  category: string | null;
  source: CommitmentSource | null;
  nudge_mode: NudgeMode;
  has_conflict: boolean;
  suppressed_tail: boolean;
  extension_count: number;
  notes: string | null;
}

export interface DaySchedule {
  target_date: string;
  slices: ResolvedSlice[];
  all_day_commitments: Commitment[];
  timed_commitments: Commitment[];
  has_conflicts: boolean;
}

export interface NowNextState {
  target_date: string;
  now_minute: number;
  active_slice: ResolvedSlice | null;
  active_items: ResolvedSlice[];
  upcoming: ResolvedSlice[];
  open_time_minutes: number | null;
  is_quiet_hours: boolean;
}

export interface KairosCockpitData {
  nowNext: NowNextState;
  daySchedule: DaySchedule;
  weeklyGrid: GridBlock[];
  exceptions: GridException[];
}

export interface FrictionNote {
  id: number;
  target_date: string;
  tag: FrictionTag;
  note: string;
  habit_cue_id: number | null;
  grid_block_id: number | null;
  cue_title: string | null;
  block_title: string | null;
  created_at: string;
}

export interface FrictionNoteCreate {
  target_date: string;
  tag: FrictionTag;
  note: string;
  habit_cue_id?: number | null;
  grid_block_id?: number | null;
}

export interface HabitCue {
  id: number;
  title: string;
  zone_chain: string;
  chain_order: number;
  passive_rule: string | null;
  active: boolean;
  notes: string | null;
  grid_block_ids: number[];
  recent_friction: FrictionNote[];
}

export interface HabitCueCreate {
  title: string;
  zone_chain: string;
  chain_order?: number;
  passive_rule?: string | null;
  active?: boolean;
  notes?: string | null;
  grid_block_ids?: number[];
}

export type HabitCueUpdate = Partial<HabitCueCreate>;

export interface WeeklyReflectionByTag {
  tag: FrictionTag;
  count: number;
  notes: FrictionNote[];
}

export interface WeeklyReflectionByCue {
  habit_cue_id: number;
  cue_title: string;
  zone_chain: string;
  count: number;
  notes: FrictionNote[];
}

export interface WeeklyReflection {
  week_start: string;
  week_end: string;
  total_notes: number;
  by_tag: WeeklyReflectionByTag[];
  by_cue: WeeklyReflectionByCue[];
  unlinked_notes: FrictionNote[];
}

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; isSessionExpired: boolean }
  | { status: 'ready'; data: T };
