import type { OptionCardAccent, StatusBadgeVariant } from '@yggdrasil-lab/ui';
import type { FrictionNote, FrictionTag, GridBlock, HabitCue, PassiveSignalStatus } from './types';
import { getAucklandWeekdayIndex, WEEKDAYS } from './schedule';

export interface FrictionTagMeta {
  value: FrictionTag;
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
  cardAccent: OptionCardAccent;
}

export const FRICTION_TAG_META: Record<FrictionTag, FrictionTagMeta> = {
  tired: {
    value: 'tired',
    label: 'Tired',
    description: 'Low energy or sleep debt at transition',
    badgeVariant: 'purple',
    cardAccent: 'purple',
  },
  trigger_missed: {
    value: 'trigger_missed',
    label: 'Trigger missed',
    description: 'Physical cue or anchor did not fire',
    badgeVariant: 'info',
    cardAccent: 'blue',
  },
  schedule_overrun: {
    value: 'schedule_overrun',
    label: 'Schedule overrun',
    description: 'Earlier block or meeting ran long',
    badgeVariant: 'warning',
    cardAccent: 'amber',
  },
  environment_missing: {
    value: 'environment_missing',
    label: 'Environment missing',
    description: 'Space, gear, or setup was not ready',
    badgeVariant: 'idle',
    cardAccent: 'emerald',
  },
};

export const FRICTION_TAG_OPTIONS: readonly FrictionTagMeta[] = [
  FRICTION_TAG_META.tired,
  FRICTION_TAG_META.trigger_missed,
  FRICTION_TAG_META.schedule_overrun,
  FRICTION_TAG_META.environment_missing,
];

export const CANONICAL_PASSIVE_RULE_LABELS: Record<string, string> = {
  eir_morning_weigh_in: 'Morning Weigh-in (Eir)',
  eir_fasted_walk_40m: 'Fasted Walk 40m (Eir)',
  kratos_workout_completed: 'Workouts / Swimming (Kratos)',
  plutus_monthly_checkin: 'Monthly Financial Check-in (Plutus)',
};

export const LEGACY_PASSIVE_RULE_LABELS: Record<string, string> = {
  kratos_fast_completed: 'Auto: Kratos fast logged',
  kratos_workout_logged: 'Auto: Kratos workout logged',
  eir_sleep_logged: 'Auto: Eir sleep logged',
  eir_hydration_logged: 'Auto: Eir hydration logged',
};

export const PASSIVE_RULE_LABELS: Record<string, string> = {
  ...LEGACY_PASSIVE_RULE_LABELS,
  ...CANONICAL_PASSIVE_RULE_LABELS,
};

export const PASSIVE_RULE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'None (cue reminder only)' },
  { value: 'eir_morning_weigh_in', label: 'Morning Weigh-in (Eir)' },
  { value: 'eir_fasted_walk_40m', label: 'Fasted Walk 40m (Eir)' },
  { value: 'kratos_workout_completed', label: 'Workouts / Swimming (Kratos)' },
  { value: 'plutus_monthly_checkin', label: 'Monthly Financial Check-in (Plutus)' },
];

export function formatPassiveRuleLabel(rule: string | null): string | null {
  if (!rule) return null;
  return PASSIVE_RULE_LABELS[rule] ?? `Auto: ${rule}`;
}

export function getPassiveRuleSelectOptions(
  currentRule?: string | null
): { value: string; label: string }[] {
  const options = PASSIVE_RULE_OPTIONS.map((item) => ({ value: item.value, label: item.label }));
  if (currentRule && !options.some((item) => item.value === currentRule)) {
    options.push({
      value: currentRule,
      label: formatPassiveRuleLabel(currentRule) ?? currentRule,
    });
  }
  return options;
}

export interface PassiveBadgeState {
  label: string;
  variant: 'idle' | 'success';
  observed: boolean;
}

export function resolvePassiveBadgeState(
  passiveRule: string | null,
  passiveSignals?: Record<string, PassiveSignalStatus>
): PassiveBadgeState | null {
  const fallbackLabel = formatPassiveRuleLabel(passiveRule);
  if (!passiveRule || !fallbackLabel) return null;
  const signal = passiveSignals?.[passiveRule];
  if (signal?.observed) {
    return {
      label: signal.fact_label ?? fallbackLabel,
      variant: 'success',
      observed: true,
    };
  }
  return {
    label: signal?.label ?? fallbackLabel,
    variant: 'idle',
    observed: false,
  };
}

export interface ZoneChainGroup {
  zoneChain: string;
  cues: HabitCue[];
}

export function groupCuesByZoneChain(cues: readonly HabitCue[]): ZoneChainGroup[] {
  const byZone = new Map<string, HabitCue[]>();
  for (const cue of cues) {
    const key = cue.zone_chain.trim() || 'General Zone';
    const list = byZone.get(key);
    if (list) {
      list.push(cue);
    } else {
      byZone.set(key, [cue]);
    }
  }
  return Array.from(byZone.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zoneChain, items]) => ({
      zoneChain,
      cues: [...items].sort((a, b) => a.chain_order - b.chain_order || a.id - b.id),
    }));
}

export function getActiveCuesForGridBlock(
  cues: readonly HabitCue[],
  gridBlockId: number
): ZoneChainGroup[] {
  const anchored = cues.filter(
    (cue) => cue.active && cue.grid_block_ids.includes(gridBlockId)
  );
  return groupCuesByZoneChain(anchored);
}

export function getBlockFrictionNotes(
  cues: readonly HabitCue[],
  gridBlockId: number,
  recentNotes: readonly FrictionNote[]
): FrictionNote[] {
  const byId = new Map<number, FrictionNote>();
  for (const note of recentNotes) {
    if (note.grid_block_id === gridBlockId) {
      byId.set(note.id, note);
    }
  }
  for (const cue of cues) {
    if (!cue.grid_block_ids.includes(gridBlockId)) continue;
    for (const note of cue.recent_friction) {
      if (note.grid_block_id === null || note.grid_block_id === gridBlockId) {
        byId.set(note.id, note);
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.target_date.localeCompare(a.target_date) || b.id - a.id);
}

export function formatBlockChipLabel(block: GridBlock): string {
  const weekday = WEEKDAYS.find((d) => d.dayOfWeek === block.day_of_week)?.short ?? 'Day';
  return `${weekday} / ${block.title}`;
}

export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function getMondayOfWeek(isoDate: string): string {
  const weekdayIndex = getAucklandWeekdayIndex(isoDate);
  return shiftIsoDate(isoDate, -weekdayIndex);
}
