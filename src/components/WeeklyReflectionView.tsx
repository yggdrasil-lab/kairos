import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquarePlus, Sparkles, Trash2 } from 'lucide-react';
import {
  Button,
  EmptyState,
  GlassCard,
  LoadingState,
  SectionHeader,
  StatusBadge,
} from '@yggdrasil-lab/ui';
import { FRICTION_TAG_META, shiftIsoDate } from '../domain/cues';
import type { FrictionNote, WeeklyReflection } from '../domain/types';

export interface WeeklyReflectionViewProps {
  weekStart: string;
  reflection: WeeklyReflection | null;
  isLoading: boolean;
  onChangeWeekStart: (nextWeekStart: string) => void;
  onLogFriction: () => void;
  onDeleteFrictionNote: (noteId: number) => void;
}

const ReflectionNoteRow: React.FC<{
  note: FrictionNote;
  showTag?: boolean;
  onDelete: (id: number) => void;
}> = ({ note, showTag = true, onDelete }) => {
  const tagMeta = FRICTION_TAG_META[note.tag];
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {showTag && (
            <StatusBadge label={tagMeta.label} variant={tagMeta.badgeVariant} size="xs" />
          )}
          <span className="text-[11px] font-mono text-slate-400">{note.target_date}</span>
          {Boolean(note.cue_title) && (
            <span className="text-[11px] font-medium text-accent truncate">
              {note.cue_title}
            </span>
          )}
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
        aria-label={`Delete reflection note ${note.id}`}
        onClick={() => onDelete(note.id)}
        className="min-h-[36px] min-w-[36px] justify-center text-slate-400 hover:text-slate-200 shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

const ReflectionByTagSection: React.FC<{
  buckets: WeeklyReflection['by_tag'];
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({ buckets, onDeleteFrictionNote }) => {
  if (buckets.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">By Friction Pattern</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {buckets.map((bucket) => {
          const meta = FRICTION_TAG_META[bucket.tag];
          return (
            <div key={bucket.tag} data-testid={`reflection-tag-${bucket.tag}`} className="rounded-xl border border-border/80 bg-background/70 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge label={meta.label} variant={meta.badgeVariant} size="sm" />
                <span className="text-xs font-mono text-slate-300">{bucket.count}</span>
              </div>
              <p className="text-[11px] text-slate-400">{meta.description}</p>
              <div className="space-y-1.5">
                {bucket.notes.map((note) => (
                  <ReflectionNoteRow key={note.id} note={note} showTag={false} onDelete={onDeleteFrictionNote} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReflectionByCueSection: React.FC<{
  buckets: WeeklyReflection['by_cue'];
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({ buckets, onDeleteFrictionNote }) => {
  if (buckets.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">By Habit Cue</h3>
      <div className="space-y-2.5">
        {buckets.map((bucket) => (
          <div key={bucket.habit_cue_id} data-testid={`reflection-cue-${bucket.habit_cue_id}`} className="rounded-xl border border-border/80 bg-background/70 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-100 break-words">{bucket.cue_title}</h4>
                <p className="text-[11px] text-accent/90">{bucket.zone_chain}</p>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {bucket.count} {bucket.count === 1 ? 'note' : 'notes'}
              </span>
            </div>
            <div className="space-y-1.5">
              {bucket.notes.map((note) => (
                <ReflectionNoteRow key={note.id} note={note} onDelete={onDeleteFrictionNote} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReflectionSections: React.FC<{
  reflection: WeeklyReflection;
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({ reflection, onDeleteFrictionNote }) => (
  <div className="space-y-4">
    <ReflectionByTagSection buckets={reflection.by_tag} onDeleteFrictionNote={onDeleteFrictionNote} />
    <ReflectionByCueSection buckets={reflection.by_cue} onDeleteFrictionNote={onDeleteFrictionNote} />
    {reflection.unlinked_notes.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Block & General Observations</h3>
        <div className="space-y-1.5">
          {reflection.unlinked_notes.map((note) => (
            <ReflectionNoteRow key={note.id} note={note} onDelete={onDeleteFrictionNote} />
          ))}
        </div>
      </div>
    )}
  </div>
);

const ReflectionHeaderActions: React.FC<{
  weekStart: string;
  onChangeWeekStart: (nextWeekStart: string) => void;
  onLogFriction: () => void;
}> = ({ weekStart, onChangeWeekStart, onLogFriction }) => (
  <div className="flex items-center gap-1.5">
    <Button variant="secondary" size="xs" aria-label="Previous week" data-testid="reflection-prev-week" onClick={() => onChangeWeekStart(shiftIsoDate(weekStart, -7))} className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center">
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <Button variant="secondary" size="xs" aria-label="Next week" data-testid="reflection-next-week" onClick={() => onChangeWeekStart(shiftIsoDate(weekStart, 7))} className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] justify-center">
      <ChevronRight className="w-4 h-4" />
    </Button>
    <Button variant="brand" size="xs" data-testid="reflection-log-friction-btn" icon={<MessageSquarePlus className="w-3.5 h-3.5" />} onClick={onLogFriction} className="min-h-[44px] sm:min-h-[32px]">
      Log Note
    </Button>
  </div>
);

const ReflectionBody: React.FC<{
  reflection: WeeklyReflection | null;
  isLoading: boolean;
  onLogFriction: () => void;
  onDeleteFrictionNote: (noteId: number) => void;
}> = ({ reflection, isLoading, onLogFriction, onDeleteFrictionNote }) => {
  if (isLoading && !reflection) {
    return <LoadingState label="Loading weekly reflection..." variant="brand" />;
  }
  if (!reflection || reflection.total_notes === 0) {
    return (
      <EmptyState
        title="Quiet week logged"
        description="No friction observations recorded for this week yet. Log a quick note whenever a cue or block transition feels sticky."
        action={<Button variant="brand" size="sm" onClick={onLogFriction} className="min-h-[44px]">Log Observation</Button>}
      />
    );
  }
  return (
    <>
      <div className="rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-300">
          {reflection.total_notes} calm {reflection.total_notes === 1 ? 'observation' : 'observations'} captured for review
        </span>
        <span className="font-mono text-accent">
          {reflection.by_cue.length} cues / {reflection.by_tag.length} patterns
        </span>
      </div>
      <ReflectionSections reflection={reflection} onDeleteFrictionNote={onDeleteFrictionNote} />
    </>
  );
};

export const WeeklyReflectionView: React.FC<WeeklyReflectionViewProps> = ({
  weekStart,
  reflection,
  isLoading,
  onChangeWeekStart,
  onLogFriction,
  onDeleteFrictionNote,
}) => {
  const weekRangeLabel = reflection
    ? `${reflection.week_start} to ${reflection.week_end}`
    : `${weekStart} to ${shiftIsoDate(weekStart, 6)}`;

  return (
    <GlassCard data-testid="weekly-reflection-view" className="space-y-4">
      <SectionHeader
        title="Weekly Reflection"
        subtitle={`Friction patterns for ${weekRangeLabel}`}
        icon={<Sparkles className="w-4 h-4" />}
        variant="brand"
        actions={<ReflectionHeaderActions weekStart={weekStart} onChangeWeekStart={onChangeWeekStart} onLogFriction={onLogFriction} />}
      />
      <ReflectionBody reflection={reflection} isLoading={isLoading} onLogFriction={onLogFriction} onDeleteFrictionNote={onDeleteFrictionNote} />
    </GlassCard>
  );
};
