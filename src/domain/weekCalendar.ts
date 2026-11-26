import type { GridBlock } from './types';

export const DESKTOP_PX_PER_HOUR = 60;
export const MOBILE_PX_PER_HOUR = 64;
export const MIN_VISUAL_BLOCK_PX = 20;
export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 23;
export const DEFAULT_WAKING_START_MINUTE = 420;
export const DEFAULT_WAKING_END_MINUTE = 1320;
export const DEFAULT_MIN_GAP_MINUTES = 45;

export interface CalendarBounds {
  startHour: number;
  endHour: number;
}

export type BlockDensity = 'micro' | 'compact' | 'regular';

export interface BlockLayout {
  topPx: number;
  heightPx: number;
  durationMinutes: number;
  density: BlockDensity;
}

export interface OpenGap {
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
}

export const CATEGORY_CALENDAR_STYLES: Record<string, string> = {
  deep_work: 'border-sky-400/25 border-l-sky-400/80 bg-sky-500/[0.11] hover:bg-sky-500/[0.17]',
  health: 'border-emerald-400/25 border-l-emerald-400/80 bg-emerald-500/[0.11] hover:bg-emerald-500/[0.17]',
  personal: 'border-violet-400/25 border-l-violet-400/80 bg-violet-500/[0.11] hover:bg-violet-500/[0.17]',
  admin: 'border-amber-400/25 border-l-amber-400/80 bg-amber-500/[0.11] hover:bg-amber-500/[0.17]',
  general: 'border-slate-400/25 border-l-slate-400/80 bg-slate-500/[0.11] hover:bg-slate-500/[0.17]',
};

export function resolveCategoryCalendarStyle(category: string | null): string {
  if (!category) {
    return CATEGORY_CALENDAR_STYLES.general;
  }
  return CATEGORY_CALENDAR_STYLES[category] ?? CATEGORY_CALENDAR_STYLES.general;
}

export function computeCalendarBounds(blocks: readonly GridBlock[]): CalendarBounds {
  if (blocks.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }
  let minStart = DEFAULT_START_HOUR * 60;
  let maxEnd = DEFAULT_END_HOUR * 60;
  for (const block of blocks) {
    if (block.start_minute < minStart) minStart = block.start_minute;
    if (block.end_minute > maxEnd) maxEnd = block.end_minute;
  }
  const startHour = Math.max(0, Math.min(DEFAULT_START_HOUR, Math.floor(minStart / 60)));
  const endHour = Math.min(24, Math.max(DEFAULT_END_HOUR, Math.ceil(maxEnd / 60)));
  return { startHour, endHour };
}

export function computeTimeOffsetPx(minute: number, startHour: number, pxPerHour: number): number {
  return ((minute - startHour * 60) / 60) * pxPerHour;
}

function resolveBlockDensity(durationMinutes: number): BlockDensity {
  if (durationMinutes < 30) return 'micro';
  if (durationMinutes < 60) return 'compact';
  return 'regular';
}

export function computeBlockLayout(
  block: GridBlock,
  startHour: number,
  pxPerHour: number,
  nextBlockStartMinute?: number
): BlockLayout {
  const durationMinutes = Math.max(0, block.end_minute - block.start_minute);
  const topPx = computeTimeOffsetPx(block.start_minute, startHour, pxPerHour);
  const rawHeightPx = (durationMinutes / 60) * pxPerHour;
  let heightPx = Math.max(MIN_VISUAL_BLOCK_PX, rawHeightPx);

  if (nextBlockStartMinute !== undefined && nextBlockStartMinute >= block.end_minute) {
    const maxHeightBeforeNext = ((nextBlockStartMinute - block.start_minute) / 60) * pxPerHour;
    heightPx = Math.min(heightPx, maxHeightBeforeNext);
  }

  return {
    topPx,
    heightPx,
    durationMinutes,
    density: resolveBlockDensity(durationMinutes),
  };
}

export function computeOpenGaps(
  dayBlocks: readonly GridBlock[],
  startHour: number,
  endHour: number,
  minGapMinutes = DEFAULT_MIN_GAP_MINUTES
): OpenGap[] {
  const windowStart = Math.max(startHour * 60, DEFAULT_WAKING_START_MINUTE);
  const windowEnd = Math.min(endHour * 60, DEFAULT_WAKING_END_MINUTE);
  if (windowEnd <= windowStart) return [];

  const activeSorted = dayBlocks
    .filter((block) => block.active)
    .slice()
    .sort((a, b) => a.start_minute - b.start_minute || a.end_minute - b.end_minute);

  const gaps: OpenGap[] = [];
  let cursor = windowStart;

  for (const block of activeSorted) {
    const clampedStart = Math.max(windowStart, block.start_minute);
    const clampedEnd = Math.min(windowEnd, block.end_minute);
    if (clampedEnd <= clampedStart) continue;

    if (clampedStart > cursor) {
      const durationMinutes = clampedStart - cursor;
      if (durationMinutes >= minGapMinutes) {
        gaps.push({ startMinute: cursor, endMinute: clampedStart, durationMinutes });
      }
    }
    cursor = Math.max(cursor, clampedEnd);
  }

  if (windowEnd > cursor) {
    const durationMinutes = windowEnd - cursor;
    if (durationMinutes >= minGapMinutes) {
      gaps.push({ startMinute: cursor, endMinute: windowEnd, durationMinutes });
    }
  }

  return gaps;
}

export function buildHourTicks(startHour: number, endHour: number): number[] {
  const ticks: number[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    ticks.push(hour);
  }
  return ticks;
}
