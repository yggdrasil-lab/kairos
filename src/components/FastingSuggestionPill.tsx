import React from 'react';
import { Clock } from 'lucide-react';
import { StatusBadge, type StatusBadgeVariant } from '@yggdrasil-lab/ui';
import type { FastingPhase, FastingSuggestion } from '../domain/types';

const PHASE_LABEL: Record<FastingPhase, string> = {
  fasting: 'Fasting',
  eating: 'Eating',
  closed: 'Closed',
};

function resolveBadgeVariant(suggestion: FastingSuggestion): StatusBadgeVariant {
  if (suggestion.phase === 'eating') return 'success';
  if (suggestion.phase === 'closed') return 'idle';
  return suggestion.is_optional_reset ? 'warning' : 'info';
}

function resolveSurfaceClass(suggestion: FastingSuggestion): string {
  if (suggestion.is_optional_reset) {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  }
  if (suggestion.phase === 'closed') {
    return 'border-slate-500/25 bg-slate-500/10 text-slate-300';
  }
  return 'border-sky-400/25 bg-sky-500/10 text-sky-100';
}

function resolveIconColor(suggestion: FastingSuggestion): string {
  if (suggestion.is_optional_reset) return 'text-amber-300';
  if (suggestion.phase === 'closed') return 'text-slate-400';
  return 'text-sky-300';
}

function formatWindowLabel(suggestion: FastingSuggestion): string {
  const prefix = suggestion.is_optional_reset ? 'Optional ' : '';
  return `${prefix}${suggestion.protocol} · ${suggestion.window_start} - ${suggestion.window_end}`;
}

function formatDetailText(suggestion: FastingSuggestion): string {
  if (suggestion.phase === 'eating') return `Closes ${suggestion.window_end}`;
  if (suggestion.phase === 'closed') return 'Kitchen closed';
  return `Opens ${suggestion.window_start}`;
}

export const FastingSuggestionPill: React.FC<{ suggestion: FastingSuggestion }> = ({ suggestion }) => {
  const surfaceClass = resolveSurfaceClass(suggestion);
  const iconColor = resolveIconColor(suggestion);
  const labelTextClass =
    suggestion.phase === 'closed' && !suggestion.is_optional_reset ? 'text-slate-300' : 'text-slate-100';

  return (
    <div
      data-testid="fasting-suggestion-pill"
      data-fasting-phase={suggestion.phase}
      className={`rounded-xl border px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 ${surfaceClass}`}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Clock className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
        <StatusBadge label={PHASE_LABEL[suggestion.phase]} variant={resolveBadgeVariant(suggestion)} size="xs" />
        <span className={`font-medium break-words ${labelTextClass}`}>{formatWindowLabel(suggestion)}</span>
      </div>
      <span className="text-[11px] opacity-85 whitespace-nowrap">{formatDetailText(suggestion)}</span>
    </div>
  );
};
