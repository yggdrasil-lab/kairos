import type { Page } from '@playwright/test';
import type {
  Commitment,
  DaySchedule,
  GridBlock,
  GridException,
  NowNextState,
  ResolvedSlice,
} from '../../src/domain/types';

const TARGET_DATE = '2026-11-25';
const NOW_MINUTE = 570; // 09:30

function buildInitialWeeklyGrid(): GridBlock[] {
  return [
    {
      id: 1,
      title: 'Monday Deep Work',
      day_of_week: 0,
      start_minute: 540,
      end_minute: 720,
      category: 'deep_work',
      nudge_mode: 'two-stage',
      active: true,
      notes: 'Architecture sprint',
    },
    {
      id: 2,
      title: 'Tuesday Admin & Inbox',
      day_of_week: 1,
      start_minute: 540,
      end_minute: 630,
      category: 'admin',
      nudge_mode: 'boundary',
      active: true,
      notes: null,
    },
    {
      id: 3,
      title: 'Wednesday Deep Work',
      day_of_week: 2,
      start_minute: 540,
      end_minute: 720,
      category: 'deep_work',
      nudge_mode: 'two-stage',
      active: true,
      notes: 'Core focus block',
    },
    {
      id: 4,
      title: 'Evening Mobility',
      day_of_week: 2,
      start_minute: 1050,
      end_minute: 1110,
      category: 'health',
      nudge_mode: 'boundary',
      active: true,
      notes: 'Stretch and zone 2 walk',
    },
    {
      id: 5,
      title: 'Thursday Systems Review',
      day_of_week: 3,
      start_minute: 600,
      end_minute: 720,
      category: 'deep_work',
      nudge_mode: 'two-stage',
      active: true,
      notes: null,
    },
    {
      id: 6,
      title: 'Friday Weekly Retro',
      day_of_week: 4,
      start_minute: 900,
      end_minute: 960,
      category: 'admin',
      nudge_mode: 'boundary',
      active: true,
      notes: null,
    },
    {
      id: 7,
      title: 'Saturday Trail Run',
      day_of_week: 5,
      start_minute: 480,
      end_minute: 570,
      category: 'health',
      nudge_mode: 'none',
      active: true,
      notes: null,
    },
    {
      id: 8,
      title: 'Sunday Weekly Reset',
      day_of_week: 6,
      start_minute: 960,
      end_minute: 1050,
      category: 'personal',
      nudge_mode: 'boundary',
      active: true,
      notes: null,
    },
  ];
}

function buildInitialCommitments(): Commitment[] {
  return [
    {
      id: 101,
      title: 'Release Freeze Window',
      target_date: TARGET_DATE,
      start_minute: null,
      end_minute: null,
      all_day: true,
      source: 'iris',
      external_ref: 'cal-all-day-101',
      nudge_mode: 'none',
      notes: 'Production change window',
      has_conflict: false,
    },
    {
      id: 102,
      title: 'Design Review Sync',
      target_date: TARGET_DATE,
      start_minute: 600,
      end_minute: 708,
      all_day: false,
      source: 'iris',
      external_ref: 'cal-102',
      nudge_mode: 'boundary',
      notes: 'Carves Wednesday Deep Work leaving <15m tail suppressed',
      has_conflict: true,
    },
    {
      id: 103,
      title: 'Physio Check-In',
      target_date: TARGET_DATE,
      start_minute: 660,
      end_minute: 720,
      all_day: false,
      source: 'kratos',
      external_ref: 'kratos-103',
      nudge_mode: 'two-stage',
      notes: 'Overlaps Design Review Sync',
      has_conflict: true,
    },
  ];
}

function buildSlices(commitments: Commitment[]): ResolvedSlice[] {
  const baseSlices: ResolvedSlice[] = [
    {
      slice_id: 'grid-3-0',
      kind: 'grid_block',
      source_id: 3,
      title: 'Wednesday Deep Work',
      start_minute: 540,
      end_minute: 600,
      category: 'deep_work',
      source: null,
      nudge_mode: 'two-stage',
      has_conflict: false,
      suppressed_tail: true,
      extension_count: 0,
      notes: 'Carved before 10:00 sync (<15m tail after 11:48 suppressed)',
    },
    ...commitments
      .filter((c) => !c.all_day && c.start_minute !== null && c.end_minute !== null)
      .map((c) => ({
        slice_id: `commitment-${c.id}`,
        kind: 'commitment' as const,
        source_id: c.id,
        title: c.title,
        start_minute: c.start_minute!,
        end_minute: c.end_minute!,
        category: null,
        source: c.source,
        nudge_mode: c.nudge_mode,
        has_conflict: c.has_conflict,
        suppressed_tail: false,
        extension_count: 0,
        notes: c.notes,
      })),
    {
      slice_id: 'grid-4-0',
      kind: 'grid_block',
      source_id: 4,
      title: 'Evening Mobility',
      start_minute: 1050,
      end_minute: 1110,
      category: 'health',
      source: null,
      nudge_mode: 'boundary',
      has_conflict: false,
      suppressed_tail: false,
      extension_count: 0,
      notes: 'Stretch and zone 2 walk',
    },
  ];
  return baseSlices.sort((a, b) => a.start_minute - b.start_minute);
}

export async function setupKairosMockApi(page: Page): Promise<void> {
  const weeklyGrid = buildInitialWeeklyGrid();
  const commitments = buildInitialCommitments();
  const exceptions: GridException[] = [];
  let nextId = 200;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (path === '/schedule/now-next' && method === 'GET') {
      const slices = buildSlices(commitments);
      const activeItems = slices.filter((s) => s.start_minute <= NOW_MINUTE && NOW_MINUTE < s.end_minute);
      const upcoming = slices.filter((s) => s.start_minute > NOW_MINUTE);
      const payload: NowNextState = {
        target_date: TARGET_DATE,
        now_minute: NOW_MINUTE,
        active_slice: activeItems[0] ?? null,
        active_items: activeItems,
        upcoming,
        open_time_minutes: activeItems.length === 0 && upcoming[0] ? upcoming[0].start_minute - NOW_MINUTE : null,
        is_quiet_hours: false,
      };
      await route.fulfill({ json: payload });
      return;
    }

    if (path === '/schedule/day' && method === 'GET') {
      const slices = buildSlices(commitments);
      const payload: DaySchedule = {
        target_date: TARGET_DATE,
        slices,
        all_day_commitments: commitments.filter((c) => c.all_day),
        timed_commitments: commitments.filter((c) => !c.all_day),
        has_conflicts: slices.some((s) => s.has_conflict),
      };
      await route.fulfill({ json: payload });
      return;
    }

    if (path === '/weekly-grid' && method === 'GET') {
      await route.fulfill({ json: weeklyGrid });
      return;
    }

    if (path === '/weekly-grid/blocks' && method === 'POST') {
      const body = request.postDataJSON() as Omit<GridBlock, 'id'>;
      const created: GridBlock = { id: nextId++, ...body, active: body.active ?? true };
      weeklyGrid.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (path === '/exceptions' && method === 'GET') {
      await route.fulfill({ json: exceptions });
      return;
    }

    if (path === '/commitments' && method === 'POST') {
      const body = request.postDataJSON() as Partial<Commitment>;
      const created: Commitment = {
        id: nextId++,
        title: body.title ?? 'Untitled',
        target_date: body.target_date ?? TARGET_DATE,
        start_minute: body.start_minute ?? null,
        end_minute: body.end_minute ?? null,
        all_day: Boolean(body.all_day),
        source: body.source ?? 'manual',
        external_ref: null,
        nudge_mode: body.nudge_mode ?? 'boundary',
        notes: body.notes ?? null,
        has_conflict: false,
      };
      commitments.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (path.startsWith('/commitments/') && method === 'DELETE') {
      const id = Number(path.split('/').pop());
      const idx = commitments.findIndex((c) => c.id === id);
      if (idx >= 0) {
        commitments.splice(idx, 1);
      }
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({ status: 404, json: { detail: `Unhandled mock route: ${method} ${path}` } });
  });
}
