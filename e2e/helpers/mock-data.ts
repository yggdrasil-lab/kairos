import type { Page, Route } from '@playwright/test';
import type {
  Commitment,
  CompletedKratosSession,
  DaySchedule,
  DayWorkoutHydration,
  FrictionNote,
  FrictionTag,
  GridBlock,
  GridException,
  HabitCue,
  HydratedWorkout,
  NowNextState,
  PassiveSignalsResponse,
  ResolvedSlice,
  WeeklyReflection,
} from '../../src/domain/types';

export interface MockApiOptions {
  dayHeaderFallback?: boolean;
  activeWorkoutNow?: boolean;
}

const TARGET_DATE = '2026-11-25';
const NOW_MINUTE = 570; // 09:30

const INITIAL_WEEKLY_GRID: GridBlock[] = [
  { id: 1, title: 'Monday Deep Work', day_of_week: 0, start_minute: 540, end_minute: 720, category: 'deep_work', nudge_mode: 'two-stage', flexible: false, active: true, notes: 'Architecture sprint' },
  { id: 2, title: 'Tuesday Admin & Inbox', day_of_week: 1, start_minute: 540, end_minute: 630, category: 'admin', nudge_mode: 'boundary', flexible: true, active: true, notes: null },
  { id: 3, title: 'Wednesday Deep Work', day_of_week: 2, start_minute: 540, end_minute: 720, category: 'deep_work', nudge_mode: 'two-stage', flexible: false, active: true, notes: 'Core focus block' },
  { id: 4, title: 'Evening Mobility', day_of_week: 2, start_minute: 1050, end_minute: 1110, category: 'health', nudge_mode: 'boundary', flexible: true, active: true, notes: 'Stretch and zone 2 walk' },
  { id: 5, title: 'Thursday Systems Review', day_of_week: 3, start_minute: 600, end_minute: 720, category: 'deep_work', nudge_mode: 'two-stage', flexible: false, active: true, notes: null },
  { id: 6, title: 'Friday Weekly Retro', day_of_week: 4, start_minute: 900, end_minute: 960, category: 'admin', nudge_mode: 'boundary', flexible: true, active: true, notes: null },
  { id: 7, title: 'Saturday Trail Run', day_of_week: 5, start_minute: 480, end_minute: 570, category: 'health', nudge_mode: 'none', flexible: false, active: true, notes: null },
  { id: 8, title: 'Sunday Weekly Reset', day_of_week: 6, start_minute: 960, end_minute: 1050, category: 'personal', nudge_mode: 'boundary', flexible: true, active: true, notes: null },
];

const INITIAL_COMMITMENTS: Commitment[] = [
  { id: 101, title: 'Release Freeze Window', target_date: TARGET_DATE, start_minute: null, end_minute: null, all_day: true, source: 'iris', external_ref: 'cal-all-day-101', nudge_mode: 'none', urgent_quiet_bypass: false, notes: 'Production change window', has_conflict: false },
  { id: 102, title: 'Design Review Sync', target_date: TARGET_DATE, start_minute: 600, end_minute: 708, all_day: false, source: 'iris', external_ref: 'cal-102', nudge_mode: 'boundary', urgent_quiet_bypass: false, notes: 'Carves Wednesday Deep Work leaving <15m tail suppressed', has_conflict: true },
  { id: 103, title: 'Morning Swim (Kratos)', target_date: TARGET_DATE, start_minute: 420, end_minute: 465, all_day: false, source: 'kratos', external_ref: 'kratos-session-401', nudge_mode: 'none', urgent_quiet_bypass: false, notes: '1500m aerobic swim', has_conflict: false, read_only: true },
  { id: 104, title: 'Architecture Sync', target_date: TARGET_DATE, start_minute: 660, end_minute: 720, all_day: false, source: 'manual', external_ref: null, nudge_mode: 'two-stage', urgent_quiet_bypass: false, notes: 'Overlaps Design Review Sync', has_conflict: true },
];

const PLANNED_GRID_WORKOUT: HydratedWorkout = {
  title: 'Lower Strength & Mobility',
  workout_type: 'strength',
  emphasis: 'Squat + Hip Mobility',
  notes: 'RPE 7 steady',
  attached_grid_block_id: 4,
  placement: 'grid_block',
};

const PLANNED_DAY_HEADER_WORKOUT: HydratedWorkout = {
  title: 'Upper Push Focus',
  workout_type: 'strength',
  emphasis: 'Press + Core',
  notes: 'Warm up shoulders first',
  attached_grid_block_id: null,
  placement: 'day_header',
};

const COMPLETED_KRATOS_SESSIONS: CompletedKratosSession[] = [
  {
    external_ref: 'kratos-session-401',
    title: 'Morning Swim (Kratos)',
    activity_type: 'swim',
    start_minute: 420,
    end_minute: 465,
    started_at: '2026-11-25T07:00:00+13:00',
    ended_at: '2026-11-25T07:45:00+13:00',
  },
];

const INITIAL_GRID_SLICES: ResolvedSlice[] = [
  { slice_id: 'grid-3-0', kind: 'grid_block', source_id: 3, title: 'Wednesday Deep Work', start_minute: 540, end_minute: 600, category: 'deep_work', source: null, nudge_mode: 'two-stage', flexible: false, urgent_quiet_bypass: false, has_conflict: false, suppressed_tail: true, extension_count: 0, notes: 'Carved before 10:00 sync (<15m tail after 11:48 suppressed)' },
  { slice_id: 'grid-4-0', kind: 'grid_block', source_id: 4, title: 'Evening Mobility', start_minute: 1050, end_minute: 1110, category: 'health', source: null, nudge_mode: 'boundary', flexible: true, urgent_quiet_bypass: false, has_conflict: false, suppressed_tail: false, extension_count: 0, notes: 'Stretch and zone 2 walk', hydrated_workout: PLANNED_GRID_WORKOUT },
];

const INITIAL_CUES: Omit<HabitCue, 'recent_friction'>[] = [
  { id: 1, title: 'Step on scale beside bathroom door', zone_chain: 'Kitchen -> Desk', chain_order: 1, passive_rule: 'eir_morning_weigh_in', active: true, notes: 'Keep bottle beside kettle', grid_block_ids: [1, 3] },
  { id: 2, title: 'Lace up walking shoes before coffee', zone_chain: 'Kitchen -> Desk', chain_order: 2, passive_rule: 'eir_fasted_walk_40m', active: true, notes: 'No browser tabs before sprint notes', grid_block_ids: [1, 3] },
  { id: 3, title: 'Roll out mat beside desk', zone_chain: 'Desk -> Living Room', chain_order: 1, passive_rule: 'kratos_workout_completed', active: true, notes: 'Leave foam roller visible', grid_block_ids: [4] },
  { id: 4, title: 'Review monthly cashflow sheet', zone_chain: 'Weekly Finance', chain_order: 1, passive_rule: 'plutus_monthly_checkin', active: true, notes: 'Open Plutus summary tab', grid_block_ids: [6] },
];

const INITIAL_PASSIVE_SIGNALS: PassiveSignalsResponse = {
  target_date: TARGET_DATE,
  signals: {
    eir_morning_weigh_in: {
      rule_key: 'eir_morning_weigh_in',
      label: 'Morning Weigh-in (Eir)',
      observed: true,
      fact_label: 'Weighed in 07:15 (72.4 kg)',
      observed_at: '2026-11-25T07:15:00+13:00',
      source: 'eir',
      peer_available: true,
    },
    eir_fasted_walk_40m: {
      rule_key: 'eir_fasted_walk_40m',
      label: 'Fasted Walk 40m (Eir)',
      observed: false,
      fact_label: null,
      observed_at: null,
      source: 'eir',
      peer_available: true,
    },
    kratos_workout_completed: {
      rule_key: 'kratos_workout_completed',
      label: 'Workouts / Swimming (Kratos)',
      observed: true,
      fact_label: 'Swim 1500m logged',
      observed_at: '2026-11-25T07:45:00+13:00',
      source: 'kratos',
      peer_available: true,
    },
    plutus_monthly_checkin: {
      rule_key: 'plutus_monthly_checkin',
      label: 'Monthly Financial Check-in (Plutus)',
      observed: false,
      fact_label: null,
      observed_at: null,
      source: 'plutus',
      peer_available: true,
    },
  },
  degraded_peers: [],
};

const INITIAL_FRICTION_NOTES: FrictionNote[] = [
  { id: 501, target_date: '2026-11-24', tag: 'environment_missing', note: 'Running shoes were left in boot of car', habit_cue_id: 1, grid_block_id: 3, cue_title: 'Step on scale beside bathroom door', block_title: 'Wednesday Deep Work', created_at: '2026-11-24T09:05:00+13:00' },
  { id: 502, target_date: '2026-11-23', tag: 'schedule_overrun', note: 'Morning standup ran 20m past anchor start', habit_cue_id: 2, grid_block_id: 1, cue_title: 'Lace up walking shoes before coffee', block_title: 'Monday Deep Work', created_at: '2026-11-23T09:25:00+13:00' },
];

interface MockStore {
  weeklyGrid: GridBlock[];
  gridSlices: ResolvedSlice[];
  commitments: Commitment[];
  exceptions: GridException[];
  cues: Omit<HabitCue, 'recent_friction'>[];
  frictionNotes: FrictionNote[];
  pushSubscriptions: string[];
  workoutHydration: DayWorkoutHydration;
  nextId: number;
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function buildCueResponse(cue: Omit<HabitCue, 'recent_friction'>, notes: FrictionNote[]): HabitCue {
  return {
    ...cue,
    recent_friction: notes.filter((n) => n.habit_cue_id === cue.id).slice(0, 5),
  };
}

function buildWeeklyReflection(weekStart: string, store: MockStore): WeeklyReflection {
  const weekEnd = addDaysIso(weekStart, 6);
  const inWeek = store.frictionNotes.filter((n) => n.target_date >= weekStart && n.target_date <= weekEnd);
  const tagMap = new Map<FrictionTag, FrictionNote[]>();
  const cueMap = new Map<number, FrictionNote[]>();
  const unlinked: FrictionNote[] = [];

  for (const note of inWeek) {
    const tList = tagMap.get(note.tag) ?? [];
    tList.push(note);
    tagMap.set(note.tag, tList);
    if (note.habit_cue_id !== null) {
      const cList = cueMap.get(note.habit_cue_id) ?? [];
      cList.push(note);
      cueMap.set(note.habit_cue_id, cList);
    } else {
      unlinked.push(note);
    }
  }

  return {
    week_start: weekStart,
    week_end: weekEnd,
    total_notes: inWeek.length,
    by_tag: Array.from(tagMap.entries()).map(([tag, notes]) => ({ tag, count: notes.length, notes })),
    by_cue: Array.from(cueMap.entries()).map(([cueId, notes]) => {
      const cue = store.cues.find((c) => c.id === cueId);
      return {
        habit_cue_id: cueId,
        cue_title: cue?.title ?? notes[0]?.cue_title ?? `Cue #${cueId}`,
        zone_chain: cue?.zone_chain ?? 'General Zone',
        count: notes.length,
        notes,
      };
    }),
    unlinked_notes: unlinked,
  };
}

function toCommitmentSlice(item: Commitment): ResolvedSlice {
  return {
    slice_id: `commitment-${item.id}`,
    kind: 'commitment',
    source_id: item.id,
    title: item.title,
    start_minute: item.start_minute ?? 0,
    end_minute: item.end_minute ?? 0,
    category: null,
    source: item.source,
    nudge_mode: item.nudge_mode,
    flexible: false,
    urgent_quiet_bypass: item.urgent_quiet_bypass,
    has_conflict: item.has_conflict,
    suppressed_tail: false,
    extension_count: 0,
    notes: item.notes,
    read_only: item.read_only,
  };
}

function buildSlices(store: MockStore): ResolvedSlice[] {
  const timed = store.commitments
    .filter((c) => !c.all_day && c.start_minute !== null && c.end_minute !== null)
    .map(toCommitmentSlice);
  return [...store.gridSlices, ...timed].sort((a, b) => a.start_minute - b.start_minute);
}

function buildNowNextPayload(store: MockStore): NowNextState {
  const slices = buildSlices(store);
  const activeItems = slices.filter((s) => s.start_minute <= NOW_MINUTE && NOW_MINUTE < s.end_minute);
  const upcoming = slices.filter((s) => s.start_minute > NOW_MINUTE);
  const openTime = activeItems.length === 0 && upcoming[0] ? upcoming[0].start_minute - NOW_MINUTE : null;
  return {
    target_date: TARGET_DATE,
    now_minute: NOW_MINUTE,
    active_slice: activeItems[0] ?? null,
    active_items: activeItems,
    upcoming,
    open_time_minutes: openTime,
    is_quiet_hours: false,
    workout_hydration: store.workoutHydration,
  };
}

function buildDayPayload(store: MockStore): DaySchedule {
  const slices = buildSlices(store);
  return {
    target_date: TARGET_DATE,
    slices,
    all_day_commitments: store.commitments.filter((c) => c.all_day),
    timed_commitments: store.commitments.filter((c) => !c.all_day),
    has_conflicts: slices.some((s) => s.has_conflict),
    workout_hydration: store.workoutHydration,
  };
}

async function handleCueRoutes(route: Route, store: MockStore, path: string, method: string, url: URL): Promise<boolean> {
  if (path === '/cues/passive-signals' && method === 'GET') {
    await route.fulfill({ json: INITIAL_PASSIVE_SIGNALS });
    return true;
  }
  if (path === '/cues' && method === 'GET') {
    const activeOnly = url.searchParams.get('active_only') === 'true';
    const blockIdParam = url.searchParams.get('grid_block_id');
    const zoneParam = url.searchParams.get('zone_chain');
    const filtered = store.cues.filter((c) => {
      if (activeOnly && !c.active) return false;
      if (blockIdParam && !c.grid_block_ids.includes(Number(blockIdParam))) return false;
      if (zoneParam && c.zone_chain !== zoneParam) return false;
      return true;
    });
    await route.fulfill({ json: filtered.map((c) => buildCueResponse(c, store.frictionNotes)) });
    return true;
  }
  if (path === '/cues' && method === 'POST') {
    const body = route.request().postDataJSON() as Partial<HabitCue>;
    const created: Omit<HabitCue, 'recent_friction'> = {
      id: store.nextId++,
      title: body.title ?? 'Untitled Cue',
      zone_chain: body.zone_chain ?? 'General Zone',
      chain_order: body.chain_order ?? 1,
      passive_rule: body.passive_rule ?? null,
      active: body.active ?? true,
      notes: body.notes ?? null,
      grid_block_ids: body.grid_block_ids ?? [],
    };
    store.cues.push(created);
    await route.fulfill({ status: 201, json: buildCueResponse(created, store.frictionNotes) });
    return true;
  }
  if (path.startsWith('/cues/') && method === 'PATCH') {
    const id = Number(path.split('/').pop());
    const idx = store.cues.findIndex((c) => c.id === id);
    if (idx < 0) {
      await route.fulfill({ status: 404, json: { detail: 'Cue not found' } });
      return true;
    }
    const patch = route.request().postDataJSON() as Partial<HabitCue>;
    store.cues[idx] = { ...store.cues[idx], ...patch };
    await route.fulfill({ json: buildCueResponse(store.cues[idx], store.frictionNotes) });
    return true;
  }
  if (path.startsWith('/cues/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    const idx = store.cues.findIndex((c) => c.id === id);
    if (idx >= 0) store.cues.splice(idx, 1);
    await route.fulfill({ status: 204, body: '' });
    return true;
  }
  return false;
}

async function handleFrictionRoutes(route: Route, store: MockStore, path: string, method: string, url: URL): Promise<boolean> {
  if (path === '/friction-notes/reflection' && method === 'GET') {
    const weekStart = url.searchParams.get('week_start') ?? '2026-11-23';
    await route.fulfill({ json: buildWeeklyReflection(weekStart, store) });
    return true;
  }
  if (path === '/friction-notes' && method === 'GET') {
    const cueId = url.searchParams.get('habit_cue_id');
    const blockId = url.searchParams.get('grid_block_id');
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const filtered = store.frictionNotes.filter((n) => {
      if (cueId && n.habit_cue_id !== Number(cueId)) return false;
      if (blockId && n.grid_block_id !== Number(blockId)) return false;
      return true;
    });
    await route.fulfill({ json: filtered.slice(0, limit) });
    return true;
  }
  if (path === '/friction-notes' && method === 'POST') {
    const body = route.request().postDataJSON() as Partial<FrictionNote>;
    const cue = body.habit_cue_id ? store.cues.find((c) => c.id === body.habit_cue_id) : undefined;
    const block = body.grid_block_id ? store.weeklyGrid.find((b) => b.id === body.grid_block_id) : undefined;
    const created: FrictionNote = {
      id: store.nextId++,
      target_date: body.target_date ?? TARGET_DATE,
      tag: body.tag ?? 'trigger_missed',
      note: body.note ?? '',
      habit_cue_id: body.habit_cue_id ?? null,
      grid_block_id: body.grid_block_id ?? null,
      cue_title: cue?.title ?? null,
      block_title: block?.title ?? null,
      created_at: '2026-11-25T09:30:00+13:00',
    };
    store.frictionNotes.unshift(created);
    await route.fulfill({ status: 201, json: created });
    return true;
  }
  if (path.startsWith('/friction-notes/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    const idx = store.frictionNotes.findIndex((n) => n.id === id);
    if (idx >= 0) store.frictionNotes.splice(idx, 1);
    await route.fulfill({ status: 204, body: '' });
    return true;
  }
  return false;
}

async function handlePushRoutes(route: Route, store: MockStore, path: string, method: string): Promise<boolean> {
  if (path === '/push/vapid-public-key' && method === 'GET') {
    await route.fulfill({ json: { public_key: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8', enabled: true } });
    return true;
  }
  if (path === '/push/subscribe' && method === 'POST') {
    const body = route.request().postDataJSON() as { endpoint: string };
    if (!store.pushSubscriptions.includes(body.endpoint)) store.pushSubscriptions.push(body.endpoint);
    await route.fulfill({ json: { id: 1, endpoint: body.endpoint, active: true } });
    return true;
  }
  if (path === '/push/unsubscribe' && method === 'POST') {
    const body = route.request().postDataJSON() as { endpoint: string };
    const idx = store.pushSubscriptions.indexOf(body.endpoint);
    if (idx >= 0) store.pushSubscriptions.splice(idx, 1);
    await route.fulfill({ json: { endpoint: body.endpoint, removed: idx >= 0 } });
    return true;
  }
  return false;
}

function trimFlexibleFollowers(store: MockStore, slice: ResolvedSlice, nextEnd: number, targetDate: string): GridException[] {
  const trimmedExceptions: GridException[] = [];
  for (const candidate of store.gridSlices) {
    if (candidate.source_id !== slice.source_id && candidate.flexible && candidate.start_minute >= slice.start_minute && candidate.start_minute < nextEnd) {
      candidate.start_minute = nextEnd;
      const trimmed: GridException = { id: store.nextId++, grid_block_id: candidate.source_id, target_date: targetDate, skipped: false, start_minute: nextEnd, end_minute: candidate.end_minute, extension_count: 0, notes: 'Trimmed by extend' };
      store.exceptions.push(trimmed);
      trimmedExceptions.push(trimmed);
    }
  }
  return trimmedExceptions;
}

async function handleExtendRoute(route: Route, store: MockStore, path: string, method: string): Promise<boolean> {
  if (path !== '/schedule/extend' || method !== 'POST') return false;
  const body = route.request().postDataJSON() as { target_date: string; grid_block_id: number; minutes: number };
  const slice = store.gridSlices.find((s) => s.source_id === body.grid_block_id);
  if (!slice) {
    await route.fulfill({ status: 404, json: { detail: 'Grid block not found' } });
    return true;
  }
  let exc = store.exceptions.find((e) => e.grid_block_id === body.grid_block_id && e.target_date === body.target_date);
  if ((exc && (exc.skipped || exc.extension_count >= 2)) || slice.end_minute >= 1440) {
    await route.fulfill({ status: 409, json: { detail: 'Cannot extend block further' } });
    return true;
  }
  const nextEnd = Math.min(1440, slice.end_minute + body.minutes);
  slice.end_minute = nextEnd;
  slice.extension_count += 1;
  if (!exc) {
    exc = { id: store.nextId++, grid_block_id: body.grid_block_id, target_date: body.target_date, skipped: false, start_minute: slice.start_minute, end_minute: nextEnd, extension_count: slice.extension_count, notes: 'Extended' };
    store.exceptions.push(exc);
  } else {
    exc.end_minute = nextEnd;
    exc.extension_count = slice.extension_count;
  }
  const trimmedExceptions = trimFlexibleFollowers(store, slice, nextEnd, body.target_date);
  await route.fulfill({ json: { extended_exception: exc, trimmed_exceptions: trimmedExceptions } });
  return true;
}

async function handleApiRoute(route: Route, store: MockStore): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method();

  if (path === '/schedule/now-next' && method === 'GET') {
    await route.fulfill({ json: buildNowNextPayload(store) });
    return;
  }
  if (path === '/schedule/day' && method === 'GET') {
    await route.fulfill({ json: buildDayPayload(store) });
    return;
  }
  if (path === '/weekly-grid' && method === 'GET') {
    await route.fulfill({ json: store.weeklyGrid });
    return;
  }
  if (path === '/exceptions' && method === 'GET') {
    await route.fulfill({ json: store.exceptions });
    return;
  }
  if (path === '/weekly-grid/blocks' && method === 'POST') {
    const body = request.postDataJSON() as Omit<GridBlock, 'id'>;
    const created: GridBlock = { id: store.nextId++, ...body, flexible: Boolean(body.flexible), active: body.active ?? true };
    store.weeklyGrid.push(created);
    await route.fulfill({ status: 201, json: created });
    return;
  }
  if (await handlePushRoutes(route, store, path, method)) return;
  if (await handleExtendRoute(route, store, path, method)) return;
  if (await handleCueRoutes(route, store, path, method, url)) return;
  if (await handleFrictionRoutes(route, store, path, method, url)) return;
  await handleCommitmentMutation(route, store, path, method);
}

async function handleCommitmentMutation(route: Route, store: MockStore, path: string, method: string): Promise<void> {
  if (path === '/commitments' && method === 'POST') {
    const body = route.request().postDataJSON() as Partial<Commitment>;
    const created: Commitment = {
      id: store.nextId++,
      title: body.title ?? 'Untitled',
      target_date: body.target_date ?? TARGET_DATE,
      start_minute: body.start_minute ?? null,
      end_minute: body.end_minute ?? null,
      all_day: Boolean(body.all_day),
      source: body.source ?? 'manual',
      external_ref: null,
      nudge_mode: body.nudge_mode ?? 'two-stage',
      urgent_quiet_bypass: Boolean(body.urgent_quiet_bypass),
      notes: body.notes ?? null,
      has_conflict: false,
    };
    store.commitments.push(created);
    await route.fulfill({ status: 201, json: created });
    return;
  }
  if (path.startsWith('/commitments/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    const idx = store.commitments.findIndex((c) => c.id === id);
    if (idx >= 0) store.commitments.splice(idx, 1);
    await route.fulfill({ status: 204, body: '' });
    return;
  }
  await route.fulfill({ status: 404, json: { detail: `Unhandled mock route: ${method} ${path}` } });
}

export async function setupKairosMockApi(
  page: Page,
  options: MockApiOptions = {}
): Promise<void> {
  const gridSlices = INITIAL_GRID_SLICES.map((s) => ({ ...s }));
  if (options.activeWorkoutNow) {
    gridSlices[0] = {
      ...gridSlices[0],
      title: 'Morning Workout',
      category: 'health',
      hydrated_workout: { ...PLANNED_GRID_WORKOUT, attached_grid_block_id: 3 },
    };
  }
  const plannedWorkout = options.dayHeaderFallback
    ? { ...PLANNED_DAY_HEADER_WORKOUT }
    : { ...PLANNED_GRID_WORKOUT };

  const store: MockStore = {
    weeklyGrid: INITIAL_WEEKLY_GRID.map((b) => ({ ...b })),
    gridSlices,
    commitments: INITIAL_COMMITMENTS.map((c) => ({ ...c })),
    exceptions: [],
    cues: INITIAL_CUES.map((c) => ({ ...c, grid_block_ids: [...c.grid_block_ids] })),
    frictionNotes: INITIAL_FRICTION_NOTES.map((n) => ({ ...n })),
    pushSubscriptions: [],
    workoutHydration: {
      planned_workout: plannedWorkout,
      completed_sessions: COMPLETED_KRATOS_SESSIONS.map((s) => ({ ...s })),
      peer_degraded: false,
    },
    nextId: 600,
  };
  await page.route('**/api/**', (route) => handleApiRoute(route, store));
}
