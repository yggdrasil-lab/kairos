import React from 'react';
import { Calendar, Edit2, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button, EmptyState, GlassCard, SectionHeader, StatusBadge } from '@yggdrasil-lab/ui';
import { formatDuration, formatMinuteRange, resolveCategoryMeta, SOURCE_META } from '../domain/schedule';
import type {
  Commitment,
  DaySchedule,
  DayWorkoutHydration,
  GridException,
  ResolvedSlice,
} from '../domain/types';
import { HydratedWorkoutBadge, KratosDayHeaderPill } from './HydratedWorkoutBadge';

export interface TodayTimelineProps {
  schedule: DaySchedule;
  exceptions: GridException[];
  nowMinute: number;
  workoutHydration?: DayWorkoutHydration | null;
  onAddCommitment: () => void;
  onEditCommitment: (commitment: Commitment) => void;
  onDeleteCommitment: (commitmentId: number) => void;
  onSkipGridBlock: (gridBlockId: number) => void;
  onRestoreException: (exceptionId: number) => void;
}

const AllDayCommitmentCard: React.FC<{
  item: Commitment;
  onEdit: (item: Commitment) => void;
  onDelete: (id: number) => void;
}> = ({ item, onEdit, onDelete }) => {
  const isReadOnlyKratos = item.source === 'kratos' || Boolean(item.read_only);
  const sourceMeta = SOURCE_META[item.source];
  const badgeLabel = item.source === 'kratos' ? 'Kratos' : sourceMeta.label;
  const badgeVariant = item.source === 'kratos' ? 'success' : sourceMeta.badgeVariant;
  return (
    <div data-testid={`all-day-item-${item.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/70 px-3 py-2">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-100 truncate">{item.title}</span>
          <StatusBadge label={badgeLabel} variant={badgeVariant} size="xs" />
        </div>
        {Boolean(item.notes) && <p className="text-[11px] text-slate-400 truncate">{item.notes}</p>}
      </div>
      {!isReadOnlyKratos && (
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
  onEdit: (item: Commitment) => void;
  onDelete: (id: number) => void;
}> = ({ commitments, workoutHydration, onEdit, onDelete }) => {
  const dayHeaderWorkout =
    workoutHydration?.planned_workout?.placement === 'day_header'
      ? workoutHydration.planned_workout
      : null;
  if (commitments.length === 0 && !dayHeaderWorkout) return null;
  return (
    <div data-testid="all-day-commitments" className="space-y-2">
      {dayHeaderWorkout && <KratosDayHeaderPill workout={dayHeaderWorkout} />}
      {commitments.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">All-Day Commitments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commitments.map((item) => (
              <AllDayCommitmentCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SliceBadges: React.FC<{ slice: ResolvedSlice; isActive: boolean }> = ({ slice, isActive }) => {
  const categoryMeta = resolveCategoryMeta(slice.category);
  const sourceMeta = slice.source ? SOURCE_META[slice.source] : null;
  const isReadOnlyKratos = slice.source === 'kratos' || Boolean(slice.read_only);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono font-semibold text-accent">
        {formatMinuteRange(slice.start_minute, slice.end_minute)}
      </span>
      <span className="text-[11px] font-mono text-slate-500">
        {formatDuration(slice.end_minute - slice.start_minute)}
      </span>
      {isActive && <StatusBadge label="Live" variant="info" size="xs" isPulsing />}
      {isReadOnlyKratos ? (
        <StatusBadge label="Kratos" variant="success" size="xs" />
      ) : sourceMeta ? (
        <StatusBadge label={`Carve-Out: ${sourceMeta.label}`} variant={sourceMeta.badgeVariant} size="xs" />
      ) : (
        <StatusBadge label={categoryMeta.label} variant={categoryMeta.badgeVariant} size="xs" />
      )}
      {slice.hydrated_workout && <HydratedWorkoutBadge workout={slice.hydrated_workout} />}
      {slice.has_conflict && <StatusBadge label="Conflict" variant="error" size="xs" />}
      {slice.suppressed_tail && <StatusBadge label="<15m Tail Suppressed" variant="warning" size="xs" />}
    </div>
  );
};

const SliceActions: React.FC<{
  slice: ResolvedSlice;
  commitment: Commitment | undefined;
  onEditCommitment: (item: Commitment) => void;
  onDeleteCommitment: (id: number) => void;
  onSkipGridBlock: (id: number) => void;
}> = ({ slice, commitment, onEditCommitment, onDeleteCommitment, onSkipGridBlock }) => {
  const isReadOnlyKratos =
    slice.source === 'kratos' || Boolean(slice.read_only) || Boolean(commitment?.read_only);
  if (isReadOnlyKratos) {
    return null;
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
  onDeleteCommitment: (id: number) => void;
  onSkipGridBlock: (id: number) => void;
}> = (props) => {
  const ringClass = props.isActive
    ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/30'
    : 'border-border/80 bg-background/60';
  const workoutDetail = props.slice.hydrated_workout
    ? [props.slice.hydrated_workout.emphasis, props.slice.hydrated_workout.notes]
        .filter(Boolean)
        .join(' - ')
    : '';
  return (
    <div data-testid={`timeline-slice-${props.slice.slice_id}`} className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${ringClass}`}>
      <div className="space-y-1.5 min-w-0">
        <SliceBadges slice={props.slice} isActive={props.isActive} />
        <h4 className="text-sm font-semibold text-slate-100 break-words">{props.slice.title}</h4>
        {Boolean(workoutDetail) && <p className="text-xs text-emerald-300/90 break-words">{workoutDetail}</p>}
        {Boolean(props.slice.notes) && <p className="text-xs text-slate-400">{props.slice.notes}</p>}
      </div>
      <SliceActions
        slice={props.slice}
        commitment={props.commitment}
        onEditCommitment={props.onEditCommitment}
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
        onEdit={onEditCommitment}
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
