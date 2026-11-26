import React from 'react';
import { Edit2, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { Button, StatusBadge } from '@yggdrasil-lab/ui';
import {
  formatDuration,
  formatMinute,
  formatMinuteRange,
  NUDGE_LABELS,
  resolveCategoryMeta,
} from '../domain/schedule';
import type { GridBlock } from '../domain/types';
import {
  computeBlockLayout,
  computeOpenGaps,
  computeTimeOffsetPx,
  resolveCategoryCalendarStyle,
  type BlockLayout,
  type OpenGap,
} from '../domain/weekCalendar';

export const TimeAxisRuler: React.FC<{
  ticks: number[];
  startHour: number;
  pxPerHour: number;
  totalHeightPx: number;
  widthClass: string;
}> = ({ ticks, startHour, pxPerHour, totalHeightPx, widthClass }) => (
  <div
    className={`relative shrink-0 border-r border-border/50 bg-background/20 select-none ${widthClass}`}
    style={{ height: `${totalHeightPx}px` }}
    aria-hidden="true"
  >
    {ticks.map((hour) => {
      const topPx = computeTimeOffsetPx(hour * 60, startHour, pxPerHour);
      return (
        <span
          key={hour}
          style={{ top: `${topPx + 2}px` }}
          className="absolute right-1.5 text-[10px] font-mono leading-none text-slate-500"
        >
          {formatMinute(hour * 60)}
        </span>
      );
    })}
  </div>
);

export const CalendarGridLines: React.FC<{
  ticks: number[];
  startHour: number;
  pxPerHour: number;
}> = ({ ticks, startHour, pxPerHour }) => (
  <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
    {ticks.map((hour) => {
      const topPx = computeTimeOffsetPx(hour * 60, startHour, pxPerHour);
      const halfPx = topPx + pxPerHour / 2;
      return (
        <React.Fragment key={hour}>
          <div style={{ top: `${topPx}px` }} className="absolute inset-x-0 border-t border-border/40" />
          <div
            style={{ top: `${halfPx}px` }}
            className="absolute inset-x-0 border-t border-dashed border-border/20"
          />
        </React.Fragment>
      );
    })}
  </div>
);

export const CalendarNowLine: React.FC<{
  nowMinute: number;
  startHour: number;
  endHour: number;
  pxPerHour: number;
}> = ({ nowMinute, startHour, endHour, pxPerHour }) => {
  if (nowMinute < startHour * 60 || nowMinute > endHour * 60) {
    return null;
  }
  const topPx = computeTimeOffsetPx(nowMinute, startHour, pxPerHour);
  return (
    <div
      data-testid="week-now-line"
      aria-hidden="true"
      style={{ top: `${topPx}px` }}
      className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
    >
      <span className="w-2 h-2 rounded-full bg-amber-300 -ml-1 shadow-[0_0_6px_rgba(252,211,77,0.65)]" />
      <span className="flex-1 h-[2px] bg-amber-300/80 shadow-[0_0_8px_rgba(252,211,77,0.4)]" />
    </div>
  );
};

export const OpenGapPill: React.FC<{
  dayOfWeek: number;
  gap: OpenGap;
  startHour: number;
  pxPerHour: number;
  onSelectGap: (dayOfWeek: number, startMinute: number, endMinute: number) => void;
}> = ({ dayOfWeek, gap, startHour, pxPerHour, onSelectGap }) => {
  const topPx = computeTimeOffsetPx(gap.startMinute, startHour, pxPerHour);
  const heightPx = (gap.durationMinutes / 60) * pxPerHour;
  const prefillEnd = Math.min(gap.endMinute, gap.startMinute + 60);
  return (
    <button
      type="button"
      data-testid={`week-gap-${dayOfWeek}-${gap.startMinute}`}
      aria-label={`Add block in ${formatDuration(gap.durationMinutes)} open gap at ${formatMinute(gap.startMinute)}`}
      onClick={() => onSelectGap(dayOfWeek, gap.startMinute, prefillEnd)}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      className="group absolute inset-x-1 z-[1] flex items-center justify-center rounded-lg border border-transparent hover:border-accent/30 hover:bg-accent/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors cursor-pointer"
    >
      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-background/55 border border-border/40 group-hover:text-accent group-hover:border-accent/40 group-hover:bg-accent/10 transition-colors truncate max-w-full">
        {formatDuration(gap.durationMinutes)} open
      </span>
    </button>
  );
};

const BlockCardBody: React.FC<{
  block: GridBlock;
  layout: BlockLayout;
  hasVisibleQuickActions: boolean;
}> = ({ block, layout, hasVisibleQuickActions }) => {
  const categoryMeta = resolveCategoryMeta(block.category);
  const rightInset = hasVisibleQuickActions ? 'pr-16' : '';

  if (layout.density === 'micro') {
    return (
      <div className="px-1.5 h-full flex items-center gap-1.5 min-w-0 leading-none">
        <span className="text-[10px] font-mono font-semibold text-slate-300 shrink-0">
          {formatMinute(block.start_minute)}
        </span>
        <span className="text-[11px] font-semibold text-slate-100 truncate">{block.title}</span>
      </div>
    );
  }

  if (layout.density === 'compact') {
    return (
      <div className="px-2 py-1 h-full flex flex-col justify-center min-w-0">
        <div className="text-[10px] font-mono font-semibold text-slate-300 truncate leading-tight">
          {formatMinuteRange(block.start_minute, block.end_minute)}
        </div>
        <div className="text-[11px] font-semibold text-slate-100 truncate leading-tight">
          {block.title}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-1.5 h-full flex flex-col justify-between gap-1 min-w-0">
      <div className={`space-y-0.5 min-w-0 ${rightInset}`}>
        <div className="text-[10px] font-mono font-semibold text-slate-300 truncate leading-tight">
          {formatMinuteRange(block.start_minute, block.end_minute)}
        </div>
        <div className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug break-words">
          {block.title}
        </div>
      </div>
      <div className="space-y-0.5 min-w-0">
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge label={categoryMeta.label} variant={categoryMeta.badgeVariant} size="xs" />
          {!block.active && <StatusBadge label="Paused" variant="idle" size="xs" />}
        </div>
        {layout.durationMinutes >= 90 && (
          <div className="text-[10px] text-slate-400 truncate">{NUDGE_LABELS[block.nudge_mode]}</div>
        )}
      </div>
    </div>
  );
};

const BlockActionControls: React.FC<{
  block: GridBlock;
  isMobile: boolean;
  density: BlockLayout['density'];
  onEdit: (block: GridBlock) => void;
  onToggleActive: (block: GridBlock) => void;
  onDelete: (id: number) => void;
}> = ({ block, isMobile, density, onEdit, onToggleActive, onDelete }) => {
  if (isMobile && density !== 'regular') {
    return null;
  }
  const visibilityClass = isMobile
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';
  const btnSizeClass = isMobile
    ? 'min-h-[34px] min-w-[34px] justify-center px-1'
    : 'min-h-[24px] min-w-[24px] justify-center px-1';

  return (
    <div
      className={`absolute top-1 right-1 z-20 flex items-center gap-0.5 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 p-0.5 transition-opacity ${visibilityClass}`}
    >
      {!isMobile && (
        <Button
          variant="ghost"
          size="xs"
          aria-label={`Edit ${block.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
          className={btnSizeClass}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="xs"
        aria-label={`${block.active ? 'Pause' : 'Resume'} ${block.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleActive(block);
        }}
        className={btnSizeClass}
      >
        {block.active ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        aria-label={`Delete ${block.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className={`${btnSizeClass} text-slate-400 hover:text-rose-300`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export const CalendarBlockCard: React.FC<{
  block: GridBlock;
  layout: BlockLayout;
  isMobile: boolean;
  onEdit: (block: GridBlock) => void;
  onToggleActive: (block: GridBlock) => void;
  onDelete: (id: number) => void;
}> = ({ block, layout, isMobile, onEdit, onToggleActive, onDelete }) => {
  const colorStyle = resolveCategoryCalendarStyle(block.category);
  const stateStyle = block.active ? '' : 'opacity-55 border-dashed';
  const hasVisibleQuickActions = isMobile && layout.density === 'regular';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(block);
    }
  };

  return (
    <div
      style={{ top: `${layout.topPx}px`, height: `${layout.heightPx}px` }}
      className="group absolute inset-x-1 z-10 hover:z-30 focus-within:z-30"
    >
      <div
        role="button"
        tabIndex={0}
        data-testid={`grid-block-${block.id}`}
        aria-label={`Edit ${block.title} (${formatMinuteRange(block.start_minute, block.end_minute)})`}
        onClick={() => onEdit(block)}
        onKeyDown={handleKeyDown}
        className={`h-full w-full rounded-lg border border-l-[3px] overflow-hidden text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${colorStyle} ${stateStyle}`}
      >
        <BlockCardBody block={block} layout={layout} hasVisibleQuickActions={hasVisibleQuickActions} />
      </div>
      <BlockActionControls
        block={block}
        isMobile={isMobile}
        density={layout.density}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
      />
    </div>
  );
};

export interface DayCalendarCanvasProps {
  dayOfWeek: number;
  dayBlocks: GridBlock[];
  startHour: number;
  endHour: number;
  pxPerHour: number;
  hourTicks: number[];
  isToday: boolean;
  nowMinute: number;
  isMobile: boolean;
  testId: string;
  className?: string;
  onAddBlock: (dayOfWeek: number, startMinute: number, endMinute: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (blockId: number) => void;
}

export const DayCalendarCanvas: React.FC<DayCalendarCanvasProps> = ({
  dayOfWeek,
  dayBlocks,
  startHour,
  endHour,
  pxPerHour,
  hourTicks,
  isToday,
  nowMinute,
  isMobile,
  testId,
  className = '',
  onAddBlock,
  onEditBlock,
  onToggleBlockActive,
  onDeleteBlock,
}) => {
  const totalHeightPx = (endHour - startHour) * pxPerHour;
  const gaps = computeOpenGaps(dayBlocks, startHour, endHour);

  return (
    <div
      data-testid={testId}
      style={{ height: `${totalHeightPx}px` }}
      className={`relative min-w-0 ${className}`}
    >
      <CalendarGridLines ticks={hourTicks} startHour={startHour} pxPerHour={pxPerHour} />
      {gaps.map((gap) => (
        <OpenGapPill
          key={`${dayOfWeek}-${gap.startMinute}`}
          dayOfWeek={dayOfWeek}
          gap={gap}
          startHour={startHour}
          pxPerHour={pxPerHour}
          onSelectGap={onAddBlock}
        />
      ))}
      {dayBlocks.map((block, index) => {
        const nextBlockStart = dayBlocks[index + 1]?.start_minute;
        const layout = computeBlockLayout(block, startHour, pxPerHour, nextBlockStart);
        return (
          <CalendarBlockCard
            key={block.id}
            block={block}
            layout={layout}
            isMobile={isMobile}
            onEdit={onEditBlock}
            onToggleActive={onToggleBlockActive}
            onDelete={onDeleteBlock}
          />
        );
      })}
      {isToday && (
        <CalendarNowLine
          nowMinute={nowMinute}
          startHour={startHour}
          endHour={endHour}
          pxPerHour={pxPerHour}
        />
      )}
    </div>
  );
};
