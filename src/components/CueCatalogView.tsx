import React from 'react';
import {
  Compass,
  Edit2,
  History,
  MessageSquarePlus,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Button,
  CollapsibleSection,
  EmptyState,
  GlassCard,
  SectionHeader,
  StatusBadge,
} from '@yggdrasil-lab/ui';
import {
  formatBlockChipLabel,
  formatPassiveRuleLabel,
  FRICTION_TAG_META,
  groupCuesByZoneChain,
} from '../domain/cues';
import type { GridBlock, HabitCue } from '../domain/types';
import type { FrictionModalContext } from '../hooks/useCockpitModals';

export interface CueCatalogViewProps {
  cues: HabitCue[];
  weeklyGrid: GridBlock[];
  onAddCue: () => void;
  onEditCue: (cue: HabitCue) => void;
  onToggleCueActive: (cue: HabitCue) => void;
  onDeleteCue: (cueId: number) => void;
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
  onDeleteFrictionNote: (noteId: number) => void;
}

const CueRecentFrictionList: React.FC<{
  cue: HabitCue;
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({ cue, onDeleteFrictionNote }) => {
  if (cue.recent_friction.length === 0) return null;
  return (
    <CollapsibleSection
      title={`Recent Friction (${cue.recent_friction.length})`}
      icon={<History className="w-3.5 h-3.5 text-accent" />}
      variant="inline"
      defaultOpen={false}
    >
      <div className="space-y-1.5 pt-1">
        {cue.recent_friction.map((note) => {
          const meta = FRICTION_TAG_META[note.tag];
          return (
            <div
              key={note.id}
              data-testid={`cue-friction-note-${note.id}`}
              className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge label={meta.label} variant={meta.badgeVariant} size="xs" />
                  <span className="text-[11px] font-mono text-slate-400">{note.target_date}</span>
                  {Boolean(note.block_title) && (
                    <span className="text-[11px] text-slate-400 truncate">
                      ({note.block_title})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 break-words">{note.note}</p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                aria-label={`Delete friction note ${note.id}`}
                onClick={() => onDeleteFrictionNote(note.id)}
                className="min-h-[36px] min-w-[36px] justify-center text-slate-400 hover:text-slate-200 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

const CueCardActions: React.FC<{
  cue: HabitCue;
  firstBlockTitle: string | null;
  onEditCue: (cue: HabitCue) => void;
  onToggleCueActive: (cue: HabitCue) => void;
  onDeleteCue: (cueId: number) => void;
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
}> = ({ cue, firstBlockTitle, onEditCue, onToggleCueActive, onDeleteCue, onLogFriction }) => (
  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
    <Button
      variant="outline"
      size="xs"
      data-testid={`catalog-log-friction-${cue.id}`}
      icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
      onClick={() =>
        onLogFriction({
          habitCueId: cue.id,
          gridBlockId: cue.grid_block_ids[0] ?? null,
          cueTitle: cue.title,
          blockTitle: firstBlockTitle,
        })
      }
      className="min-h-[44px] sm:min-h-[32px]"
    >
      Log Friction
    </Button>
    <Button
      variant="secondary"
      size="xs"
      aria-label={`Edit ${cue.title}`}
      data-testid={`edit-cue-${cue.id}`}
      icon={<Edit2 className="w-3.5 h-3.5" />}
      onClick={() => onEditCue(cue)}
      className="min-h-[44px] sm:min-h-[32px]"
    >
      Edit
    </Button>
    <Button
      variant="ghost"
      size="xs"
      aria-label={`${cue.active ? 'Pause' : 'Resume'} ${cue.title}`}
      onClick={() => onToggleCueActive(cue)}
      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center"
    >
      {cue.active ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
    </Button>
    <Button
      variant="ghost"
      size="xs"
      aria-label={`Delete ${cue.title}`}
      onClick={() => onDeleteCue(cue.id)}
      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center text-slate-400 hover:text-slate-200"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </div>
);

const CueCard: React.FC<{
  cue: HabitCue;
  blockMap: Map<number, GridBlock>;
  onEditCue: (cue: HabitCue) => void;
  onToggleCueActive: (cue: HabitCue) => void;
  onDeleteCue: (cueId: number) => void;
  onLogFriction: (context: Partial<FrictionModalContext>) => void;
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({
  cue,
  blockMap,
  onEditCue,
  onToggleCueActive,
  onDeleteCue,
  onLogFriction,
  onDeleteFrictionNote,
}) => {
  const passiveLabel = formatPassiveRuleLabel(cue.passive_rule);
  const anchoredBlocks = cue.grid_block_ids
    .map((id) => blockMap.get(id))
    .filter((b): b is GridBlock => Boolean(b));
  const stateClass = cue.active
    ? 'border-border/80 bg-background/70'
    : 'border-border/40 bg-background/30 opacity-65';

  return (
    <div
      data-testid={`habit-cue-${cue.id}`}
      className={`rounded-xl border p-3.5 space-y-2.5 transition-opacity ${stateClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
              Step #{cue.chain_order}
            </span>
            <h4 className="text-sm font-semibold text-slate-100 break-words">{cue.title}</h4>
            {Boolean(passiveLabel) && (
              <StatusBadge label={passiveLabel as string} variant="idle" size="xs" />
            )}
            {!cue.active && <StatusBadge label="Paused" variant="idle" size="xs" />}
          </div>
          {Boolean(cue.notes) && (
            <p className="text-xs text-slate-400 break-words">{cue.notes}</p>
          )}
          {anchoredBlocks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {anchoredBlocks.map((block) => (
                <span
                  key={block.id}
                  className="px-2 py-0.5 rounded-md border border-accent/30 bg-accent/10 text-[11px] text-accent"
                >
                  {formatBlockChipLabel(block)}
                </span>
              ))}
            </div>
          )}
        </div>
        <CueCardActions
          cue={cue}
          firstBlockTitle={anchoredBlocks[0]?.title ?? null}
          onEditCue={onEditCue}
          onToggleCueActive={onToggleCueActive}
          onDeleteCue={onDeleteCue}
          onLogFriction={onLogFriction}
        />
      </div>
      <CueRecentFrictionList cue={cue} onDeleteFrictionNote={onDeleteFrictionNote} />
    </div>
  );
};

export const CueCatalogView: React.FC<CueCatalogViewProps> = ({
  cues,
  weeklyGrid,
  onAddCue,
  onEditCue,
  onToggleCueActive,
  onDeleteCue,
  onLogFriction,
  onDeleteFrictionNote,
}) => {
  const groups = groupCuesByZoneChain(cues);
  const blockMap = new Map<number, GridBlock>(weeklyGrid.map((b) => [b.id, b]));

  return (
    <GlassCard data-testid="cue-catalog-view" className="space-y-4">
      <SectionHeader
        title="Habit Cue Catalog"
        subtitle="Physical zone chains anchored to weekly blocks - zero streaks, zero guilt"
        icon={<Compass className="w-4 h-4" />}
        variant="brand"
        actions={
          <Button
            variant="brand"
            size="xs"
            data-testid="add-cue-btn"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAddCue}
            className="min-h-[44px] sm:min-h-[32px]"
          >
            Add Cue
          </Button>
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          title="No habit cues yet"
          description="Group small physical anchors by room or transition chain and link them to weekly blocks."
          action={
            <Button variant="brand" size="sm" onClick={onAddCue} className="min-h-[44px]">
              Add First Cue
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.zoneChain} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                  {group.zoneChain}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {group.cues.length} {group.cues.length === 1 ? 'cue' : 'cues'}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.cues.map((cue) => (
                  <CueCard
                    key={cue.id}
                    cue={cue}
                    blockMap={blockMap}
                    onEditCue={onEditCue}
                    onToggleCueActive={onToggleCueActive}
                    onDeleteCue={onDeleteCue}
                    onLogFriction={onLogFriction}
                    onDeleteFrictionNote={onDeleteFrictionNote}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
