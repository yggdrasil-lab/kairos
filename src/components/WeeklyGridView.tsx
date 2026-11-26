import React, { useState } from 'react';
import { Grid, Plus } from 'lucide-react';
import { Button, GlassCard, SectionHeader } from '@yggdrasil-lab/ui';
import { groupBlocksByWeekday, WEEKDAYS } from '../domain/schedule';
import type { GridBlock } from '../domain/types';
import {
  buildHourTicks,
  computeCalendarBounds,
  DESKTOP_PX_PER_HOUR,
  MOBILE_PX_PER_HOUR,
} from '../domain/weekCalendar';
import { DayCalendarCanvas, TimeAxisRuler } from './WeeklyCalendarPrimitives';

export interface WeeklyGridViewProps {
  blocks: GridBlock[];
  initialDayOfWeek: number;
  todayDayOfWeek: number;
  nowMinute: number;
  onAddBlock: (dayOfWeek?: number, startMinute?: number, endMinute?: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (blockId: number) => void;
}

interface CalendarGridSharedProps {
  grouped: Record<number, GridBlock[]>;
  startHour: number;
  endHour: number;
  hourTicks: number[];
  todayDayOfWeek: number;
  nowMinute: number;
  onAddBlock: (dayOfWeek?: number, startMinute?: number, endMinute?: number) => void;
  onEditBlock: (block: GridBlock) => void;
  onToggleBlockActive: (block: GridBlock) => void;
  onDeleteBlock: (blockId: number) => void;
}

const MobileDayPills: React.FC<{
  grouped: Record<number, GridBlock[]>;
  selectedDay: number;
  todayDayOfWeek: number;
  onSelectDay: (day: number) => void;
}> = ({ grouped, selectedDay, todayDayOfWeek, onSelectDay }) => (
  <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Select weekday">
    {WEEKDAYS.map((day) => {
      const isSelected = day.dayOfWeek === selectedDay;
      const isToday = day.dayOfWeek === todayDayOfWeek;
      const pillStyle = isSelected
        ? 'bg-accent/20 text-accent border-accent/50'
        : isToday
          ? 'bg-accent/[0.08] text-slate-200 border-accent/30 hover:text-slate-100'
          : 'bg-background/60 text-slate-400 border-border/80 hover:text-slate-200';
      return (
        <button
          key={day.dayOfWeek}
          type="button"
          role="tab"
          aria-selected={isSelected}
          data-testid={`week-day-pill-${day.dayOfWeek}`}
          onClick={() => onSelectDay(day.dayOfWeek)}
          className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors flex flex-col items-center justify-center ${pillStyle}`}
        >
          <span>{day.short}</span>
          <span className="text-[10px] font-mono opacity-80">{(grouped[day.dayOfWeek] ?? []).length}</span>
        </button>
      );
    })}
  </div>
);

const MobileDayPanel: React.FC<
  CalendarGridSharedProps & { selectedDay: number; onSelectDay: (day: number) => void }
> = (props) => {
  const { grouped, selectedDay, todayDayOfWeek, nowMinute, startHour, endHour, hourTicks, onSelectDay, onAddBlock, onEditBlock, onToggleBlockActive, onDeleteBlock } = props;
  const dayBlocks = grouped[selectedDay] ?? [];
  const activeWeekday = WEEKDAYS.find((d) => d.dayOfWeek === selectedDay) ?? WEEKDAYS[0];
  const totalHeightPx = (endHour - startHour) * MOBILE_PX_PER_HOUR;
  const isToday = selectedDay === todayDayOfWeek;

  return (
    <div data-testid="weekly-grid-mobile" className="lg:hidden space-y-3">
      <MobileDayPills grouped={grouped} selectedDay={selectedDay} todayDayOfWeek={todayDayOfWeek} onSelectDay={onSelectDay} />
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{activeWeekday.label}</span>
          {isToday && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent border border-accent/30">Today</span>}
        </div>
        <span>{dayBlocks.length} blocks</span>
      </div>
      <div className="flex rounded-xl border border-border/70 bg-background/30 overflow-hidden">
        <TimeAxisRuler ticks={hourTicks} startHour={startHour} pxPerHour={MOBILE_PX_PER_HOUR} totalHeightPx={totalHeightPx} widthClass="w-[44px]" />
        <DayCalendarCanvas
          dayOfWeek={selectedDay} dayBlocks={dayBlocks} startHour={startHour} endHour={endHour}
          pxPerHour={MOBILE_PX_PER_HOUR} hourTicks={hourTicks} isToday={isToday} nowMinute={nowMinute}
          isMobile testId={`mobile-week-column-${selectedDay}`} className="flex-1"
          onAddBlock={onAddBlock} onEditBlock={onEditBlock} onToggleBlockActive={onToggleBlockActive} onDeleteBlock={onDeleteBlock}
        />
      </div>
    </div>
  );
};

const DesktopCalendarHeader: React.FC<{
  grouped: Record<number, GridBlock[]>;
  todayDayOfWeek: number;
  onAddBlock: (dayOfWeek: number) => void;
}> = ({ grouped, todayDayOfWeek, onAddBlock }) => (
  <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border/60 bg-background/40">
    <div className="flex items-center justify-end pr-2 text-[10px] font-mono uppercase text-slate-500">Time</div>
    {WEEKDAYS.map((day) => {
      const count = (grouped[day.dayOfWeek] ?? []).length;
      const isToday = day.dayOfWeek === todayDayOfWeek;
      const headerTint = isToday ? 'bg-accent/[0.08] text-accent' : 'text-slate-200';
      return (
        <div key={day.dayOfWeek} className={`flex items-center justify-between gap-1 px-2 py-2 border-l border-border/50 ${headerTint}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider">{day.short}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isToday ? 'bg-accent/20 text-accent' : 'bg-background/60 text-slate-400'}`}>
              {count}
            </span>
          </div>
          <button type="button" aria-label={`Add block for ${day.label}`} onClick={() => onAddBlock(day.dayOfWeek)} className="p-1 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    })}
  </div>
);

const DesktopCalendarGrid: React.FC<CalendarGridSharedProps> = (props) => {
  const { grouped, startHour, endHour, hourTicks, todayDayOfWeek, nowMinute, onAddBlock, onEditBlock, onToggleBlockActive, onDeleteBlock } = props;
  const totalHeightPx = (endHour - startHour) * DESKTOP_PX_PER_HOUR;
  return (
    <div data-testid="weekly-grid-desktop" className="hidden lg:block rounded-xl border border-border/70 bg-background/30 overflow-hidden">
      <DesktopCalendarHeader grouped={grouped} todayDayOfWeek={todayDayOfWeek} onAddBlock={onAddBlock} />
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]">
        <TimeAxisRuler ticks={hourTicks} startHour={startHour} pxPerHour={DESKTOP_PX_PER_HOUR} totalHeightPx={totalHeightPx} widthClass="w-[52px]" />
        {WEEKDAYS.map((day) => (
          <DayCalendarCanvas
            key={day.dayOfWeek} dayOfWeek={day.dayOfWeek} dayBlocks={grouped[day.dayOfWeek] ?? []}
            startHour={startHour} endHour={endHour} pxPerHour={DESKTOP_PX_PER_HOUR} hourTicks={hourTicks}
            isToday={day.dayOfWeek === todayDayOfWeek} nowMinute={nowMinute} isMobile={false}
            testId={`week-column-${day.dayOfWeek}`} className="border-l border-border/50 bg-background/25"
            onAddBlock={onAddBlock} onEditBlock={onEditBlock} onToggleBlockActive={onToggleBlockActive} onDeleteBlock={onDeleteBlock}
          />
        ))}
      </div>
    </div>
  );
};

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = (props) => {
  const { blocks, initialDayOfWeek, todayDayOfWeek, nowMinute, onAddBlock, onEditBlock, onToggleBlockActive, onDeleteBlock } = props;
  const [selectedDay, setSelectedDay] = useState<number>(initialDayOfWeek);
  const grouped = groupBlocksByWeekday(blocks);
  const { startHour, endHour } = computeCalendarBounds(blocks);
  const hourTicks = buildHourTicks(startHour, endHour);
  const shared = { grouped, startHour, endHour, hourTicks, todayDayOfWeek, nowMinute, onAddBlock, onEditBlock, onToggleBlockActive, onDeleteBlock };

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
      <MobileDayPanel {...shared} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      <DesktopCalendarGrid {...shared} />
    </GlassCard>
  );
};
