import React from 'react';
import { Dumbbell } from 'lucide-react';
import { StatusBadge } from '@yggdrasil-lab/ui';
import { formatHydratedWorkoutDetail } from '../domain/schedule';
import type { HydratedWorkout } from '../domain/types';

export const HydratedWorkoutBadge: React.FC<{ workout: HydratedWorkout }> = ({ workout }) => (
  <span data-testid="hydrated-workout-badge" className="inline-flex items-center">
    <StatusBadge label={`Kratos: ${workout.title}`} variant="success" size="xs" />
  </span>
);

export const KratosDayHeaderPill: React.FC<{ workout: HydratedWorkout }> = ({ workout }) => {
  const detail = formatHydratedWorkoutDetail(workout);
  return (
    <div
      data-testid="kratos-day-header-pill"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Dumbbell className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <StatusBadge label="Kratos" variant="success" size="xs" />
        <span className="font-semibold text-slate-100 break-words">{workout.title}</span>
      </div>
      {Boolean(detail) && (
        <span className="text-[11px] text-emerald-200/85 break-words">{detail}</span>
      )}
    </div>
  );
};
