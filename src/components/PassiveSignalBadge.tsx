import React from 'react';
import { StatusBadge } from '@yggdrasil-lab/ui';
import { resolvePassiveBadgeState } from '../domain/cues';
import type { PassiveSignalStatus } from '../domain/types';

export interface PassiveSignalBadgeProps {
  passiveRule: string | null;
  passiveSignals?: Record<string, PassiveSignalStatus>;
}

export const PassiveSignalBadge: React.FC<PassiveSignalBadgeProps> = ({
  passiveRule,
  passiveSignals,
}) => {
  const badge = resolvePassiveBadgeState(passiveRule, passiveSignals);
  if (!badge) return null;
  if (badge.observed) {
    return (
      <span data-testid="passive-signal-observed" className="inline-flex items-center">
        <StatusBadge label={badge.label} variant="success" size="xs" />
      </span>
    );
  }
  return <StatusBadge label={badge.label} variant="idle" size="xs" />;
};
