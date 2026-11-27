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
  flexible: boolean;
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
  flexible?: boolean;
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
  flexible?: boolean;
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
  urgent_quiet_bypass: boolean;
  notes: string | null;
  has_conflict: boolean;
  tentative: boolean;
  read_only?: boolean;
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
  urgent_quiet_bypass?: boolean;
  tentative?: boolean;
  notes?: string | null;
}

export interface CommitmentUpdate {
  title?: string;
  target_date?: string;
  start_minute?: number | null;
  end_minute?: number | null;
  all_day?: boolean;
  nudge_mode?: NudgeMode;
  urgent_quiet_bypass?: boolean;
  tentative?: boolean;
  notes?: string | null;
}

export type HydratedWorkoutPlacement = 'grid_block' | 'day_header';

export interface HydratedWorkout {
  title: string;
  workout_type: string | null;
  emphasis: string | null;
  notes: string | null;
  attached_grid_block_id: number | null;
  placement: HydratedWorkoutPlacement;
}

export interface CompletedKratosSession {
  external_ref: string;
  title: string;
  activity_type: string | null;
  start_minute: number;
  end_minute: number;
  started_at: string;
  ended_at: string;
}

export interface DayWorkoutHydration {
  planned_workout: HydratedWorkout | null;
  completed_sessions: CompletedKratosSession[];
  peer_degraded: boolean;
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
  flexible: boolean;
  urgent_quiet_bypass: boolean;
  has_conflict: boolean;
  suppressed_tail: boolean;
  extension_count: number;
  notes: string | null;
  hydrated_workout?: HydratedWorkout | null;
  tentative: boolean;
  read_only?: boolean;
}

export interface DaySchedule {
  target_date: string;
  slices: ResolvedSlice[];
  all_day_commitments: Commitment[];
  timed_commitments: Commitment[];
  has_conflicts: boolean;
  workout_hydration?: DayWorkoutHydration | null;
  fasting_suggestion?: FastingSuggestion | null;
  naps?: NapRecoveryBlock[];
  sleep_pressure_nudge?: SleepPressureNudge | null;
}

export interface NapRecoveryBlock {
  start_at: string;
  end_at: string;
  start_minute: number;
  end_minute: number;
  duration_hours: number;
}

export interface SleepPressureNudge {
  triggered: boolean;
  reason: string;
  suggestion: string;
  latest_nap_end: string;
  total_nap_hours: number;
  nap_count: number;
}

export type FastingProtocol = '14:10' | '18:6';

export type FastingPhase = 'fasting' | 'eating' | 'closed';

export interface FastingSuggestion {
  protocol: FastingProtocol;
  window_start: string;
  window_end: string;
  phase: FastingPhase;
  is_optional_reset: boolean;
  reason: string;
}

export interface NowNextState {
  target_date: string;
  now_minute: number;
  active_slice: ResolvedSlice | null;
  active_items: ResolvedSlice[];
  upcoming: ResolvedSlice[];
  open_time_minutes: number | null;
  is_quiet_hours: boolean;
  workout_hydration?: DayWorkoutHydration | null;
  fasting_suggestion?: FastingSuggestion | null;
  sleep_pressure_nudge?: SleepPressureNudge | null;
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

export type PushSourceKind = 'grid_block' | 'commitment' | 'quiet_hours';

export type PushStage = 'pre_end_10m' | 'boundary' | 'screens_off';

export interface VapidPublicKeyResponse {
  public_key: string;
  enabled: boolean;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  user_agent?: string | null;
}

export interface PushSubscriptionResponse {
  id: number | string;
  endpoint: string;
  active: boolean;
}

export interface PushUnsubscribeResponse {
  endpoint: string;
  removed: boolean;
}

export type ExtendMinutes = 15 | 30;

export interface ScheduleExtendRequest {
  target_date: string;
  grid_block_id: number;
  minutes: ExtendMinutes;
}

export interface ScheduleExtendResponse {
  extended_exception: GridException;
  trimmed_exceptions: GridException[];
}

export type PassiveSignalSource = 'eir' | 'kratos' | 'plutus';

export interface PassiveSignalStatus {
  rule_key: string;
  label: string;
  observed: boolean;
  fact_label: string | null;
  observed_at: string | null;
  source: PassiveSignalSource;
  peer_available: boolean;
}

export interface PassiveSignalsResponse {
  target_date: string;
  signals: Record<string, PassiveSignalStatus>;
  degraded_peers: string[];
}
