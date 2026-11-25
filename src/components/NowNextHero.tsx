import React from 'react';
import { Clock, Plus, Sparkles } from 'lucide-react';
import { Button, GlassCard, ProgressBar, StatusBadge } from '@yggdrasil-lab/ui';
import {
  computeSliceProgress,
  formatDuration,
  formatMinuteRange,
  NUDGE_LABELS,
  resolveCategoryMeta,
  SOURCE_META,
} from '../domain/schedule';
import type { NowNextState, ResolvedSlice } from '../domain/types';

export interface NowNextHeroProps {
  nowNext: NowNextState;
  onAddCommitment: () => void;
}

const HeroBadgeRow: React.FC<{
  hasActive: boolean;
  isQuietHours: boolean;
  hasConflict: boolean;
  suppressedTail: boolean;
  targetDate: string;
}> = ({ hasActive, isQuietHours, hasConflict, suppressedTail, targetDate }) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge label={hasActive ? 'Now Active' : 'Now Open'} variant={hasActive ? 'info' : 'success'} isPulsing={hasActive} />
      {isQuietHours && <StatusBadge label="Quiet Hours" variant="purple" size="xs" />}
      {hasConflict && <StatusBadge label="Conflict" variant="error" size="xs" />}
      {suppressedTail && <StatusBadge label="<15m Tail Suppressed" variant="warning" size="xs" />}
    </div>
    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
      <Clock className="w-3.5 h-3.5 text-accent" />
      <span>{targetDate}</span>
    </div>
  </div>
);

const ActiveSliceContent: React.FC<{ slice: ResolvedSlice; nowMinute: number }> = ({ slice, nowMinute }) => {
  const progress = computeSliceProgress(slice.start_minute, slice.end_minute, nowMinute);
  const categoryMeta = resolveCategoryMeta(slice.category);
  const sourceMeta = slice.source ? SOURCE_META[slice.source] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight break-words">{slice.title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{formatMinuteRange(slice.start_minute, slice.end_minute)}</span>
            <span className="text-slate-600">/</span>
            <span>{NUDGE_LABELS[slice.nudge_mode]}</span>
          </div>
        </div>
        {sourceMeta ? (
          <StatusBadge label={`Carve-Out: ${sourceMeta.label}`} variant={sourceMeta.badgeVariant} size="xs" />
        ) : (
          <StatusBadge label={categoryMeta.label} variant={categoryMeta.badgeVariant} size="xs" />
        )}
      </div>
      <ProgressBar value={progress.percent} tone={slice.has_conflict ? 'rose' : 'brand'} size="md" label="Active slice progress" />
      <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
        <span>{formatDuration(progress.elapsedMinutes)} elapsed</span>
        <span className="text-accent font-semibold">{formatDuration(progress.remainingMinutes)} remaining</span>
      </div>
    </div>
  );
};

const OpenTimeContent: React.FC<{ openMinutes: number | null; onAddCommitment: () => void }> = ({
  openMinutes,
  onAddCommitment,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-1">
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-slate-100">
        <Sparkles className="w-5 h-5 text-accent shrink-0" />
        <h2 className="text-xl sm:text-2xl font-bold">Open Time</h2>
      </div>
      <p className="text-xs sm:text-sm text-slate-400">
        {openMinutes !== null
          ? `${formatDuration(openMinutes)} open until your next scheduled block.`
          : 'No remaining scheduled blocks for today.'}
      </p>
    </div>
    <Button
      variant="brand"
      size="sm"
      icon={<Plus className="w-4 h-4" />}
      onClick={onAddCommitment}
      className="min-h-[44px] sm:min-h-[36px] self-start sm:self-auto"
    >
      Add Commitment
    </Button>
  </div>
);

const HeroAlerts: React.FC<{ activeItems: ResolvedSlice[]; suppressedTail: boolean }> = ({
  activeItems,
  suppressedTail,
}) => (
  <>
    {activeItems.length > 1 && (
      <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
        Overlapping commitments active now: {activeItems.map((item) => item.title).join(', ')}
      </p>
    )}
    {suppressedTail && (
      <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
        A trailing grid fragment shorter than 15 minutes was suppressed after carve-out.
      </p>
    )}
  </>
);

const UpcomingPreview: React.FC<{ nextSlice: ResolvedSlice | undefined; nowMinute: number }> = ({
  nextSlice,
  nowMinute,
}) => {
  if (!nextSlice) {
    return (
      <div data-testid="now-next-upcoming" className="pt-3 border-t border-border/70 flex items-center justify-between text-xs text-slate-400">
        <span className="uppercase tracking-wider font-semibold text-slate-500">Next</span>
        <span>Clear schedule ahead</span>
      </div>
    );
  }
  const startsIn = Math.max(0, nextSlice.start_minute - nowMinute);
  return (
    <div data-testid="now-next-upcoming" className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">Next</span>
        <span className="font-semibold text-slate-200 truncate">{nextSlice.title}</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-slate-400">
        <span>{formatMinuteRange(nextSlice.start_minute, nextSlice.end_minute)}</span>
        <span className="text-secondary font-semibold">in {formatDuration(startsIn)}</span>
      </div>
    </div>
  );
};

export const NowNextHero: React.FC<NowNextHeroProps> = ({ nowNext, onAddCommitment }) => {
  const active = nowNext.active_slice;
  const hasConflict = Boolean(active?.has_conflict) || nowNext.active_items.length > 1;
  const suppressedTail = Boolean(active?.suppressed_tail);

  return (
    <GlassCard data-testid="now-next-hero" className="space-y-4 border-accent/25">
      <HeroBadgeRow
        hasActive={Boolean(active)}
        isQuietHours={nowNext.is_quiet_hours}
        hasConflict={hasConflict}
        suppressedTail={suppressedTail}
        targetDate={nowNext.target_date}
      />
      {active ? (
        <ActiveSliceContent slice={active} nowMinute={nowNext.now_minute} />
      ) : (
        <OpenTimeContent openMinutes={nowNext.open_time_minutes} onAddCommitment={onAddCommitment} />
      )}
      <HeroAlerts activeItems={nowNext.active_items} suppressedTail={suppressedTail} />
      <UpcomingPreview nextSlice={nowNext.upcoming[0]} nowMinute={nowNext.now_minute} />
    </GlassCard>
  );
};
