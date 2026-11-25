import React, { useState } from 'react';
import { Edit2, Grid, PauseCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { Button, EmptyState, GlassCard, SectionHeader, StatusBadge } from '@yggdrasil-lab/ui';
import {
  formatMinuteRange,
  groupBlocksByWeekday,
  NUDGE_LABELS,
  resolveCategoryMeta,
  WEEKDAYS,
} from '../domain/schedule';
import type { GridBlock } from '../domain/types';

export interface WeeklyGridViewProps {
  blocks: GridBlock[];
  initialDayOfWeek: number;
  onAddBlock: (dayOfWeek?: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (blockId: number) => void;
}

const GridBlockActions: React.FC<{
  block: GridBlock;
  onEdit: (block: GridBlock) => void;
  onToggleActive: (block: GridBlock) => void;
  onDelete: (id: number) => void;
}> = ({ block, onEdit, onToggleActive, onDelete }) => (
  <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50">
    <Button variant="ghost" size="xs" aria-label={`Edit ${block.title}`} onClick={() => onEdit(block)} className="min-h-[44px] min-w-[44px] lg:min-h-[28px] lg:min-w-[28px] justify-center px-1.5">
      <Edit2 className="w-3.5 h-3.5" />
    </Button>
    <Button variant="ghost" size="xs" aria-label={`${block.active ? 'Pause' : 'Resume'} ${block.title}`} onClick={() => onToggleActive(block)} className="min-h-[44px] min-w-[44px] lg:min-h-[28px] lg:min-w-[28px] justify-center px-1.5">
      {block.active ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
    </Button>
    <Button variant="ghost" size="xs" aria-label={`Delete ${block.title}`} onClick={() => onDelete(block.id)} className="min-h-[44px] min-w-[44px] lg:min-h-[28px] lg:min-w-[28px] justify-center px-1.5 text-rose-400 hover:text-rose-300">
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </div>
);

const GridBlockCard: React.FC<{
  block: GridBlock;
  onEdit: (block: GridBlock) => void;
  onToggleActive: (block: GridBlock) => void;
  onDelete: (id: number) => void;
}> = ({ block, onEdit, onToggleActive, onDelete }) => {
  const categoryMeta = resolveCategoryMeta(block.category);
  const stateClass = block.active ? 'border-border/80 bg-background/70' : 'border-border/40 bg-background/30 opacity-60';
  return (
    <div data-testid={`grid-block-${block.id}`} className={`rounded-xl border p-2.5 space-y-2 transition-opacity ${stateClass}`}>
      <div className="space-y-1">
        <div className="text-[11px] font-mono font-semibold text-accent">{formatMinuteRange(block.start_minute, block.end_minute)}</div>
        <div className="text-xs font-semibold text-slate-100 leading-snug break-words">{block.title}</div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge label={categoryMeta.label} variant={categoryMeta.badgeVariant} size="xs" />
        {!block.active && <StatusBadge label="Paused" variant="idle" size="xs" />}
      </div>
      <div className="text-[10px] text-slate-400">{NUDGE_LABELS[block.nudge_mode]}</div>
      <GridBlockActions block={block} onEdit={onEdit} onToggleActive={onToggleActive} onDelete={onDelete} />
    </div>
  );
};

const MobileDayPanel: React.FC<{
  grouped: Record<number, GridBlock[]>;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (id: number) => void;
}> = ({ grouped, selectedDay, onSelectDay, onEditBlock, onToggleBlockActive, onDeleteBlock }) => {
  const mobileBlocks = grouped[selectedDay] ?? [];
  const activeWeekday = WEEKDAYS.find((d) => d.dayOfWeek === selectedDay) ?? WEEKDAYS[0];
  return (
    <div data-testid="weekly-grid-mobile" className="lg:hidden space-y-3">
      <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Select weekday">
        {WEEKDAYS.map((day) => {
          const isSelected = day.dayOfWeek === selectedDay;
          const pillStyle = isSelected
            ? 'bg-accent/20 text-accent border-accent/50'
            : 'bg-background/60 text-slate-400 border-border/80 hover:text-slate-200';
          return (
            <button key={day.dayOfWeek} type="button" role="tab" aria-selected={isSelected} data-testid={`week-day-pill-${day.dayOfWeek}`} onClick={() => onSelectDay(day.dayOfWeek)} className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors flex flex-col items-center justify-center ${pillStyle}`}>
              <span>{day.short}</span>
              <span className="text-[10px] font-mono opacity-80">{(grouped[day.dayOfWeek] ?? []).length}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold text-slate-200">{activeWeekday.label}</span>
        <span>{mobileBlocks.length} blocks</span>
      </div>
      {mobileBlocks.length === 0 ? (
        <EmptyState title={`No blocks on ${activeWeekday.label}`} description="Add a recurring anchor block for this weekday." />
      ) : (
        <div className="space-y-2">
          {mobileBlocks.map((block) => (
            <GridBlockCard key={block.id} block={block} onEdit={onEditBlock} onToggleActive={onToggleBlockActive} onDelete={onDeleteBlock} />
          ))}
        </div>
      )}
    </div>
  );
};

const DesktopDayColumn: React.FC<{
  dayOfWeek: number;
  short: string;
  label: string;
  dayBlocks: GridBlock[];
  onAddBlock: (dayOfWeek: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (id: number) => void;
}> = ({ dayOfWeek, short, label, dayBlocks, onAddBlock, onEditBlock, onToggleBlockActive, onDeleteBlock }) => (
  <div data-testid={`week-column-${dayOfWeek}`} className="rounded-xl border border-border/70 bg-background/40 p-2.5 space-y-2 flex flex-col">
    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{short}</span>
      <button type="button" aria-label={`Add block for ${label}`} onClick={() => onAddBlock(dayOfWeek)} className="p-1 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="space-y-2 flex-1">
      {dayBlocks.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-4">Open</p>
      ) : (
        dayBlocks.map((block) => (
          <GridBlockCard key={block.id} block={block} onEdit={onEditBlock} onToggleActive={onToggleBlockActive} onDelete={onDeleteBlock} />
        ))
      )}
    </div>
  </div>
);

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  blocks,
  initialDayOfWeek,
  onAddBlock,
  onEditBlock,
  onToggleBlockActive,
  onDeleteBlock,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(initialDayOfWeek);
  const grouped = groupBlocksByWeekday(blocks);
  return (
    <GlassCard data-testid="weekly-grid-view" className="space-y-4">
      <SectionHeader
        title="Mon-Sun Weekly Grid"
        subtitle="Ideal recurring anchor blocks carved automatically by commitments"
        icon={<Grid className="w-4 h-4" />}
        variant="brand"
        actions={
          <Button variant="brand" size="xs" data-testid="add-grid-block-btn" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onAddBlock(selectedDay)} className="min-h-[44px] sm:min-h-[32px]">
            Add Grid Block
          </Button>
        }
      />
      <MobileDayPanel grouped={grouped} selectedDay={selectedDay} onSelectDay={setSelectedDay} onEditBlock={onEditBlock} onToggleBlockActive={onToggleBlockActive} onDeleteBlock={onDeleteBlock} />
      <div data-testid="weekly-grid-desktop" className="hidden lg:grid lg:grid-cols-7 gap-2.5">
        {WEEKDAYS.map((day) => (
          <DesktopDayColumn
            key={day.dayOfWeek}
            dayOfWeek={day.dayOfWeek}
            short={day.short}
            label={day.label}
            dayBlocks={grouped[day.dayOfWeek] ?? []}
            onAddBlock={onAddBlock}
            onEditBlock={onEditBlock}
            onToggleBlockActive={onToggleBlockActive}
            onDeleteBlock={onDeleteBlock}
          />
        ))}
      </div>
    </GlassCard>
  );
};
