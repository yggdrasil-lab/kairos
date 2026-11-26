import React from 'react';
import { Check, Edit2, Sparkles, X } from 'lucide-react';
import { Button, StatusBadge } from '@yggdrasil-lab/ui';
import { formatMinuteRange } from '../domain/schedule';
import type { Commitment } from '../domain/types';

export const TENTATIVE_SURFACE_CLASS =
  'border-dashed border-amber-400/45 bg-amber-500/[0.06]';

export const TentativeBadge: React.FC<{ testId?: string }> = ({ testId = 'tentative-badge' }) => (
  <span data-testid={testId} className="inline-flex items-center">
    <StatusBadge label="Tentative" variant="warning" size="xs" />
  </span>
);

export interface TentativeActionButtonsProps {
  commitmentId: number;
  title: string;
  testIdPrefix: string;
  onConfirm: (commitmentId: number) => void;
  onEdit: () => void;
  onDismiss: (commitmentId: number) => void;
}

export const TentativeActionButtons: React.FC<TentativeActionButtonsProps> = ({
  commitmentId,
  title,
  testIdPrefix,
  onConfirm,
  onEdit,
  onDismiss,
}) => (
  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
    <Button
      variant="brand"
      size="xs"
      data-testid={`${testIdPrefix}-confirm-${commitmentId}`}
      aria-label={`Confirm ${title}`}
      icon={<Check className="w-3.5 h-3.5" />}
      onClick={() => onConfirm(commitmentId)}
      className="min-h-[44px] sm:min-h-[32px]"
    >
      Confirm
    </Button>
    <Button
      variant="secondary"
      size="xs"
      data-testid={`${testIdPrefix}-edit-${commitmentId}`}
      aria-label={`Edit ${title}`}
      icon={<Edit2 className="w-3.5 h-3.5" />}
      onClick={onEdit}
      className="min-h-[44px] sm:min-h-[32px]"
    >
      Edit
    </Button>
    <Button
      variant="ghost"
      size="xs"
      data-testid={`${testIdPrefix}-dismiss-${commitmentId}`}
      aria-label={`Dismiss ${title}`}
      icon={<X className="w-3.5 h-3.5" />}
      onClick={() => onDismiss(commitmentId)}
      className="min-h-[44px] sm:min-h-[32px] text-slate-300 hover:text-slate-100 border border-border/70"
    >
      Dismiss
    </Button>
  </div>
);

const TentativeStripRow: React.FC<{
  item: Commitment;
  onConfirm: (commitmentId: number) => void;
  onEdit: (item: Commitment) => void;
  onDismiss: (commitmentId: number) => void;
}> = ({ item, onConfirm, onEdit, onDismiss }) => {
  const timeLabel = item.all_day
    ? 'All Day'
    : formatMinuteRange(item.start_minute ?? 0, item.end_minute ?? 0);
  return (
    <div
      data-testid={`tentative-strip-item-${item.id}`}
      className={`rounded-xl border p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 ${TENTATIVE_SURFACE_CLASS}`}
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-100 break-words">{item.title}</span>
          <TentativeBadge />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono text-amber-200/90">{timeLabel}</span>
          {Boolean(item.notes) && <span className="truncate">{item.notes}</span>}
        </div>
      </div>
      <TentativeActionButtons
        commitmentId={item.id}
        title={item.title}
        testIdPrefix="strip-tentative"
        onConfirm={onConfirm}
        onEdit={() => onEdit(item)}
        onDismiss={onDismiss}
      />
    </div>
  );
};

export interface TentativeReviewStripProps {
  items: Commitment[];
  onConfirm: (commitmentId: number) => void;
  onEdit: (item: Commitment) => void;
  onDismiss: (commitmentId: number) => void;
}

export const TentativeReviewStrip: React.FC<TentativeReviewStripProps> = ({
  items,
  onConfirm,
  onEdit,
  onDismiss,
}) => {
  if (items.length === 0) return null;
  return (
    <div data-testid="tentative-review-strip" className="pt-3 border-t border-border/70 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200/95">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Tentative from Iris</span>
        </div>
        <StatusBadge label="Needs Confirmation" variant="warning" size="xs" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <TentativeStripRow
            key={item.id}
            item={item}
            onConfirm={onConfirm}
            onEdit={onEdit}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};
