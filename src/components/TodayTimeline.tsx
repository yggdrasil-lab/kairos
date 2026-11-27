import React from 'react';
import { Calendar, Edit2, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button, EmptyState, GlassCard, SectionHeader, StatusBadge } from '@yggdrasil-lab/ui';
import {
  formatDuration,
  formatHydratedWorkoutDetail,
  formatMinuteRange,
  isReadOnlyKratos,
  resolveCategoryMeta,
  SOURCE_META,
} from '../domain/schedule';
import type {
  Commitment,
  DaySchedule,
  DayWorkoutHydration,
  FastingSuggestion,
  GridException,
  ResolvedSlice,
} from '../domain/types';
import { FastingSuggestionPill } from './FastingSuggestionPill';
import { HydratedWorkoutBadge, KratosDayHeaderPill } from './HydratedWorkoutBadge';
import {
  TENTATIVE_SURFACE_CLASS,
  TentativeActionButtons,
  TentativeBadge,
} from './TentativeControls';

export interface TodayTimelineProps {
  schedule: DaySchedule;
  exceptions: GridException[];
  nowMinute: number;
  workoutHydration?: DayWorkoutHydration | null;
  onAddCommitment: () => void;
  onEditCommitment: (commitment: Commitment) => void;
  onConfirmCommitment?: (commitmentId: number) => void;
  onDismissCommitment?: (commitmentId: number) => void;
  onDeleteCommitment: (commitmentId: number) => void;
  onSkipGridBlock: (gridBlockId: number) => void;
  onRestoreException: (exceptionId: number) => void;
}

const AllDayCommitmentCard: React.FC<{
  item: Commitment;
  onEdit: (item: Commitment) => void;
  onConfirm?: (id: number) => void;
  onDismiss?: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ item, onEdit, onConfirm, onDismiss, onDelete }) => {
  const readOnlyKratos = isReadOnlyKratos(item.source, item.read_only);
  const sourceMeta = SOURCE_META[item.source];
  const badgeLabel = item.source === 'kratos' ? 'Kratos' : sourceMeta.label;
  const badgeVariant = item.source === 'kratos' ? 'success' : sourceMeta.badgeVariant;
  const surfaceClass = item.tentative ? TENTATIVE_SURFACE_CLASS : 'border-border/80 bg-background/70';
  const layoutClass = item.tentative
    ? 'flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5'
    : 'items-center justify-between gap-2';
  return (
    <div data-testid={`all-day-item-${item.id}`} className={`flex rounded-xl border px-3 py-2 ${layoutClass} ${surfaceClass}`}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-100 truncate">{item.title}</span>
          <StatusBadge label={badgeLabel} variant={badgeVariant} size="xs" />
          {item.tentative && <TentativeBadge />}
        </div>
        {Boolean(item.notes) && <p className="text-[11px] text-slate-400 truncate">{item.notes}</p>}
      </div>
      {!readOnlyKratos && item.tentative && onConfirm && onDismiss && (
        <TentativeActionButtons commitmentId={item.id} title={item.title} testIdPrefix="timeline-tentative" onConfirm={onConfirm} onEdit={() => onEdit(item)} onDismiss={onDismiss} />
      )}
      {!readOnlyKratos && !item.tentative && (
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="xs" aria-label={`Edit ${item.title}`} onClick={() => onEdit(item)} className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="xs" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item.id)} className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center text-rose-400 hover:text-rose-300">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

const AllDayCommitmentsBar: React.FC<{
  commitments: Commitment[];
  workoutHydration?: DayWorkoutHydration | null;
  fastingSuggestion?: FastingSuggestion | null;
  onEdit: (item: Commitment) => void;
  onConfirm?: (id: number) => void;
  onDismiss?: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ commitments, workoutHydration, fastingSuggestion, onEdit, onConfirm, onDismiss, onDelete }) => {
  const dayHeaderWorkout =
    workoutHydration?.planned_workout?.placement === 'day_header'
      ? workoutHydration.planned_workout
      : null;
  if (commitments.length === 0 && !dayHeaderWorkout && !fastingSuggestion) return null;
  return (
    <div data-testid="all-day-commitments" className="space-y-2">
      {dayHeaderWorkout && <KratosDayHeaderPill workout={dayHeaderWorkout} />}
      {fastingSuggestion && <FastingSuggestionPill suggestion={fastingSuggestion} />}
      {commitments.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">All-Day Commitments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commitments.map((item) => (
              <AllDayCommitmentCard key={item.id} item={item} onEdit={onEdit} onConfirm={onConfirm} onDismiss={onDismiss} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SliceBadges: React.FC<{ slice: ResolvedSlice; isActive: boolean; isTentative: boolean }> = ({
  slice,
  isActive,
  isTentative,
}) => {
  const categoryMeta = resolveCategoryMeta(slice.category);
  const sourceMeta = slice.source ? SOURCE_META[slice.source] : null;
  const readOnlyKratos = isReadOnlyKratos(slice.source, slice.read_only);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono font-semibold text-accent">
        {formatMinuteRange(slice.start_minute, slice.end_minute)}
      </span>
      <span className="text-[11px] font-mono text-slate-500">
        {formatDuration(slice.end_minute - slice.start_minute)}
      </span>
      {isActive && <StatusBadge label="Live" variant="info" size="xs" isPulsing />}
      {readOnlyKratos ? (
        <StatusBadge label="Kratos" variant="success" size="xs" />
      ) : sourceMeta ? (
        <StatusBadge label={`Carve-Out: ${sourceMeta.label}`} variant={sourceMeta.badgeVariant} size="xs" />
      ) : (
        <StatusBadge label={categoryMeta.label} variant={categoryMeta.badgeVariant} size="xs" />
      )}
      {isTentative && <TentativeBadge />}
      {slice.hydrated_workout && <HydratedWorkoutBadge workout={slice.hydrated_workout} />}
      {slice.has_conflict && <StatusBadge label="Conflict" variant="error" size="xs" />}
      {slice.suppressed_tail && <StatusBadge label="<15m Tail Suppressed" variant="warning" size="xs" />}
    </div>
  );
};

const SliceActions: React.FC<{
  slice: ResolvedSlice;
  commitment: Commitment | undefined;
  isTentative: boolean;
  onEditCommitment: (item: Commitment) => void;
  onConfirmCommitment?: (id: number) => void;
  onDismissCommitment?: (id: number) => void;
  onDeleteCommitment: (id: number) => void;
  onSkipGridBlock: (id: number) => void;
}> = ({
  slice,
  commitment,
  isTentative,
  onEditCommitment,
  onConfirmCommitment,
  onDismissCommitment,
  onDeleteCommitment,
  onSkipGridBlock,
}) => {
  if (isReadOnlyKratos(slice.source, slice.read_only || commitment?.read_only)) {
    return null;
  }
  if (slice.kind === 'commitment' && commitment && isTentative && onConfirmCommitment && onDismissCommitment) {
    return (
      <TentativeActionButtons
        commitmentId={commitment.id}
        title={slice.title}
        testIdPrefix="timeline-tentative"
        onConfirm={onConfirmCommitment}
        onEdit={() => onEditCommitment(commitment)}
        onDismiss={onDismissCommitment}
      />
    );
  }
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {slice.kind === 'commitment' && commitment && (
        <>
          <Button variant="secondary" size="xs" aria-label={`Edit ${slice.title}`} onClick={() => onEditCommitment(commitment)} icon={<Edit2 className="w-3.5 h-3.5" />} className="min-h-[44px] sm:min-h-[32px]">
            Edit
          </Button>
          <Button variant="danger" size="xs" aria-label={`Delete ${slice.title}`} onClick={() => onDeleteCommitment(commitment.id)} icon={<Trash2 className="w-3.5 h-3.5" />} className="min-h-[44px] sm:min-h-[32px]">
            Delete
          </Button>
        </>
      )}
      {slice.kind === 'grid_block' && (
        <Button variant="outline" size="xs" onClick={() => onSkipGridBlock(slice.source_id)} icon={<EyeOff className="w-3.5 h-3.5" />} className="min-h-[44px] sm:min-h-[32px]">
          Skip today
        </Button>
      )}
    </div>
  );
};

const SliceRow: React.FC<{
  slice: ResolvedSlice;
  isActive: boolean;
  commitment: Commitment | undefined;
  onEditCommitment: (item: Commitment) => void;
  onConfirmCommitment?: (id: number) => void;
  onDismissCommitment?: (id: number) => void;
  onDeleteCommitment: (id: number) => void;
  onSkipGridBlock: (id: number) => void;
}> = (props) => {
  const isTentative =
    props.slice.kind === 'commitment' &&
    (Boolean(props.slice.tentative) || Boolean(props.commitment?.tentative));
  const ringClass = props.isActive
    ? isTentative
      ? 'border-dashed border-amber-400/60 bg-amber-500/[0.08] ring-1 ring-amber-400/30'
      : 'border-accent/60 bg-accent/10 ring-1 ring-accent/30'
    : isTentative
      ? TENTATIVE_SURFACE_CLASS
      : 'border-border/80 bg-background/60';
  const workoutDetail = formatHydratedWorkoutDetail(props.slice.hydrated_workout, true);
  return (
    <div data-testid={`timeline-slice-${props.slice.slice_id}`} className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${ringClass}`}>
      <div className="space-y-1.5 min-w-0">
        <SliceBadges slice={props.slice} isActive={props.isActive} isTentative={isTentative} />
        <h4 className="text-sm font-semibold text-slate-100 break-words">{props.slice.title}</h4>
        {Boolean(workoutDetail) && <p className="text-xs text-emerald-300/90 break-words">{workoutDetail}</p>}
        {Boolean(props.slice.notes) && <p className="text-xs text-slate-400">{props.slice.notes}</p>}
      </div>
      <SliceActions
        slice={props.slice}
        commitment={props.commitment}
        isTentative={isTentative}
        onEditCommitment={props.onEditCommitment}
        onConfirmCommitment={props.onConfirmCommitment}
        onDismissCommitment={props.onDismissCommitment}
        onDeleteCommitment={props.onDeleteCommitment}
        onSkipGridBlock={props.onSkipGridBlock}
      />
    </div>
  );
};

const SkippedExceptionsBar: React.FC<{
  exceptions: GridException[];
  onRestore: (id: number) => void;
}> = ({ exceptions, onRestore }) => {
  const skipped = exceptions.filter((exc) => exc.skipped);
  if (skipped.length === 0) return null;
  return (
    <div className="pt-3 border-t border-border/70 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400">Skipped today:</span>
      {skipped.map((exc) => (
        <Button key={exc.id} variant="ghost" size="xs" icon={<RotateCcw className="w-3 h-3" />} onClick={() => onRestore(exc.id)} className="min-h-[44px] sm:min-h-[32px] border border-border/70">
          Restore block #{exc.grid_block_id}
        </Button>
      ))}
    </div>
  );
};

export const TodayTimeline: React.FC<TodayTimelineProps> = ({
  schedule,
  exceptions,
  nowMinute,
  workoutHydration,
  onAddCommitment,
  onEditCommitment,
  onConfirmCommitment,
  onDismissCommitment,
  onDeleteCommitment,
  onSkipGridBlock,
  onRestoreException,
}) => {
  const commitmentById = new Map<number, Commitment>(schedule.timed_commitments.map((c) => [c.id, c]));
  const effectiveHydration = workoutHydration ?? schedule.workout_hydration ?? null;
  return (
    <GlassCard data-testid="today-timeline" className="space-y-4">
      <SectionHeader
        title="Today Timeline"
        subtitle={`${schedule.slices.length} resolved slices on ${schedule.target_date}`}
        icon={<Calendar className="w-4 h-4" />}
        variant="brand"
        actions={
          <Button variant="brand" size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAddCommitment} className="min-h-[44px] sm:min-h-[32px]">
            Add Commitment
          </Button>
        }
      />
      <AllDayCommitmentsBar
        commitments={schedule.all_day_commitments}
        workoutHydration={effectiveHydration}
        fastingSuggestion={schedule.fasting_suggestion}
        onEdit={onEditCommitment}
        onConfirm={onConfirmCommitment}
        onDismiss={onDismissCommitment}
        onDelete={onDeleteCommitment}
      />
      {schedule.slices.length === 0 ? (
        <EmptyState
          title="No scheduled slices today"
          description="Add a dated commitment or configure a recurring block on the Mon-Sun Weekly Grid."
          action={<Button variant="brand" size="sm" onClick={onAddCommitment} className="min-h-[44px]">Add Commitment</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {schedule.slices.map((slice) => (
            <SliceRow
              key={slice.slice_id}
              slice={slice}
              isActive={nowMinute >= slice.start_minute && nowMinute < slice.end_minute}
              commitment={commitmentById.get(slice.source_id)}
              onEditCommitment={onEditCommitment}
              onConfirmCommitment={onConfirmCommitment}
              onDismissCommitment={onDismissCommitment}
              onDeleteCommitment={onDeleteCommitment}
              onSkipGridBlock={onSkipGridBlock}
            />
          ))}
        </div>
      )}
      <SkippedExceptionsBar exceptions={exceptions} onRestore={onRestoreException} />
    </GlassCard>
  );
};
