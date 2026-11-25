import React from 'react';
import { Compass, MessageSquarePlus } from 'lucide-react';
import { Button, GlassCard, StatusBadge } from '@yggdrasil-lab/ui';
import {
  formatPassiveRuleLabel,
  getActiveCuesForGridBlock,
  type ZoneChainGroup,
} from '../domain/cues';
import type { HabitCue, ResolvedSlice } from '../domain/types';
import type { FrictionModalContext } from '../hooks/useCockpitModals';

export interface ActiveZoneChainCardProps {
  activeSlice: ResolvedSlice | null;
  cues: HabitCue[];
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
}

const ZoneCueRow: React.FC<{
  cue: HabitCue;
  blockId: number;
  blockTitle: string;
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
}> = ({ cue, blockId, blockTitle, onLogFriction }) => {
  const passiveLabel = formatPassiveRuleLabel(cue.passive_rule);
  return (
    <div
      data-testid={`active-zone-cue-${cue.id}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
            #{cue.chain_order}
          </span>
          <span className="text-sm font-medium text-slate-100 break-words">{cue.title}</span>
          {Boolean(passiveLabel) && (
            <StatusBadge label={passiveLabel as string} variant="idle" size="xs" />
          )}
        </div>
        {Boolean(cue.notes) && (
          <p className="text-xs text-slate-400 break-words">{cue.notes}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="xs"
        data-testid={`cue-log-friction-${cue.id}`}
        icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
        onClick={() =>
          onLogFriction({
            habitCueId: cue.id,
            gridBlockId: blockId,
            cueTitle: cue.title,
            blockTitle,
          })
        }
        className="min-h-[44px] sm:min-h-[32px] shrink-0"
      >
        Log Friction
      </Button>
    </div>
  );
};

const ZoneChainGroupSection: React.FC<{
  group: ZoneChainGroup;
  blockId: number;
  blockTitle: string;
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
}> = ({ group, blockId, blockTitle, onLogFriction }) => (
  <div className="space-y-2">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300/90">
      {group.zoneChain}
    </div>
    <div className="space-y-2">
      {group.cues.map((cue) => (
        <ZoneCueRow
          key={cue.id}
          cue={cue}
          blockId={blockId}
          blockTitle={blockTitle}
          onLogFriction={onLogFriction}
        />
      ))}
    </div>
  </div>
);

export const ActiveZoneChainCard: React.FC<ActiveZoneChainCardProps> = ({
  activeSlice,
  cues,
  onLogFriction,
}) => {
  if (!activeSlice || activeSlice.kind !== 'grid_block') {
    return null;
  }
  const groups = getActiveCuesForGridBlock(cues, activeSlice.source_id);

  return (
    <GlassCard data-testid="active-zone-chain-card" className="space-y-3 border-sky-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">Zone Chain Cues</h3>
            <p className="text-xs text-slate-400 truncate">
              Physical cues anchored to {activeSlice.title}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="xs"
          data-testid="active-block-log-friction-btn"
          icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
          onClick={() =>
            onLogFriction({
              habitCueId: null,
              gridBlockId: activeSlice.source_id,
              cueTitle: null,
              blockTitle: activeSlice.title,
            })
          }
          className="min-h-[44px] sm:min-h-[32px] shrink-0"
        >
          Log Friction
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-xs text-slate-400">
          No active habit cues anchored to this block yet. Anchor one in Cues to see your zone chain here.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <ZoneChainGroupSection
              key={group.zoneChain}
              group={group}
              blockId={activeSlice.source_id}
              blockTitle={activeSlice.title}
              onLogFriction={onLogFriction}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
};
