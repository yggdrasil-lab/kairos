import type { StatusBadgeVariant } from '@yggdrasil-lab/ui';
import type { CommitmentSource, GridBlock, HydratedWorkout, NudgeMode } from './types';

export interface WeekdayOption {
  dayOfWeek: number;
  short: string;
  label: string;
}

export const WEEKDAYS: readonly WeekdayOption[] = [
  { dayOfWeek: 0, short: 'Mon', label: 'Monday' },
  { dayOfWeek: 1, short: 'Tue', label: 'Tuesday' },
  { dayOfWeek: 2, short: 'Wed', label: 'Wednesday' },
  { dayOfWeek: 3, short: 'Thu', label: 'Thursday' },
  { dayOfWeek: 4, short: 'Fri', label: 'Friday' },
  { dayOfWeek: 5, short: 'Sat', label: 'Saturday' },
  { dayOfWeek: 6, short: 'Sun', label: 'Sunday' },
];

export interface CategoryMeta {
  label: string;
  badgeVariant: StatusBadgeVariant;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  deep_work: { label: 'Deep Work', badgeVariant: 'info' },
  admin: { label: 'Admin', badgeVariant: 'warning' },
  health: { label: 'Health', badgeVariant: 'success' },
  personal: { label: 'Personal', badgeVariant: 'purple' },
  general: { label: 'General', badgeVariant: 'idle' },
};

export const CATEGORY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'deep_work', label: 'Deep Work' },
  { value: 'admin', label: 'Admin' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
  { value: 'general', label: 'General' },
];

export const SOURCE_META: Record<CommitmentSource, { label: string; badgeVariant: StatusBadgeVariant }> = {
  manual: { label: 'Manual', badgeVariant: 'idle' },
  iris: { label: 'Iris', badgeVariant: 'purple' },
  kratos: { label: 'Kratos', badgeVariant: 'success' },
};

export const NUDGE_LABELS: Record<NudgeMode, string> = {
  none: 'Silent',
  boundary: 'Boundary Nudge',
  'two-stage': 'Two-Stage Nudge',
};

export const NUDGE_OPTIONS: readonly { value: NudgeMode; label: string }[] = [
  { value: 'none', label: 'Silent' },
  { value: 'boundary', label: 'Boundary Nudge' },
  { value: 'two-stage', label: 'Two-Stage Nudge' },
];

export function resolveCategoryMeta(category: string | null): CategoryMeta {
  if (!category) {
    return CATEGORY_META.general;
  }
  return CATEGORY_META[category] ?? { label: category, badgeVariant: 'idle' };
}

export function isReadOnlyKratos(
  source: CommitmentSource | null | undefined,
  readOnly?: boolean
): boolean {
  return source === 'kratos' || Boolean(readOnly);
}

export function formatHydratedWorkoutDetail(
  workout: HydratedWorkout | null | undefined,
  includeNotes = false
): string {
  if (!workout) return '';
  const parts = [workout.emphasis, workout.workout_type];
  if (includeNotes) {
    parts.push(workout.notes);
  }
  return parts.filter(Boolean).join(' - ');
}

export function formatMinute(minute: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.round(minute)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatMinuteRange(startMinute: number, endMinute: number): string {
  return `${formatMinute(startMinute)} - ${formatMinute(endMinute)}`;
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins}m`;
}

export function parseTimeToMinute(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours === 24 && mins === 0) {
    return 1440;
  }
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
    return null;
  }
  return hours * 60 + mins;
}

export function minuteToTimeInput(minute: number): string {
  const safe = Math.max(0, Math.min(1439, Math.round(minute)));
  return formatMinute(safe);
}

export interface SliceProgress {
  elapsedMinutes: number;
  remainingMinutes: number;
  percent: number;
}

export function computeSliceProgress(
  startMinute: number,
  endMinute: number,
  nowMinute: number
): SliceProgress {
  const duration = Math.max(1, endMinute - startMinute);
  const elapsed = Math.max(0, Math.min(duration, nowMinute - startMinute));
  const remaining = Math.max(0, endMinute - nowMinute);
  const percent = Math.round((elapsed / duration) * 100);
  return { elapsedMinutes: elapsed, remainingMinutes: remaining, percent };
}

export function groupBlocksByWeekday(blocks: readonly GridBlock[]): Record<number, GridBlock[]> {
  const grouped: Record<number, GridBlock[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  for (const block of blocks) {
    const bucket = grouped[block.day_of_week];
    if (bucket) {
      bucket.push(block);
    }
  }
  for (const dayKey of Object.keys(grouped)) {
    grouped[Number(dayKey)].sort((a, b) => a.start_minute - b.start_minute);
  }
  return grouped;
}

export interface AucklandClockSnapshot {
  isoDate: string;
  minuteOfDay: number;
  weekdayIndex: number;
}

export function getAucklandWeekdayIndex(isoDate: string): number {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return 0;
  }
  const utcDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
  return (utcDay + 6) % 7;
}

export function getAucklandClockSnapshot(now: Date = new Date()): AucklandClockSnapshot {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const partMap: Record<string, string> = {};
  for (const part of formatter.formatToParts(now)) {
    partMap[part.type] = part.value;
  }
  const isoDate = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const rawHour = Number(partMap.hour);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(partMap.minute);
  return {
    isoDate,
    minuteOfDay: hour * 60 + minute,
    weekdayIndex: getAucklandWeekdayIndex(isoDate),
  };
}
