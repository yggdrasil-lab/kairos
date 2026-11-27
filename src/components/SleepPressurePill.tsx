import React from 'react';
import { Moon } from 'lucide-react';
import { StatusBadge } from '@yggdrasil-lab/ui';
import { formatNapDuration } from '../domain/schedule';
import type { SleepPressureNudge } from '../domain/types';

export const SleepPressurePill: React.FC<{ nudge: SleepPressureNudge }> = ({ nudge }) => {
  const napSummary =
    nudge.nap_count > 1
      ? `${nudge.nap_count} naps (${formatNapDuration(nudge.total_nap_hours)})`
      : `${formatNapDuration(nudge.total_nap_hours)} nap recovery`;

  return (
    <div
      data-testid="sleep-pressure-pill"
      className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100 space-y-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Moon className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
          <StatusBadge label="Sleep Pressure" variant="info" size="xs" />
          <span className="font-medium text-slate-100 break-words">{napSummary}</span>
        </div>
        <span className="text-[11px] text-indigo-200/85 whitespace-nowrap">
          Ended {nudge.latest_nap_end}
        </span>
      </div>
      <p className="text-[11px] text-indigo-100/85 break-words">{nudge.reason}</p>
      <p className="text-[11px] text-indigo-200/80 break-words">{nudge.suggestion}</p>
    </div>
  );
};
