import React, { useState } from 'react';
import { Calendar, Clock, Grid, Plus } from 'lucide-react';
import {
  AlertBanner,
  AppHeader,
  AppShell,
  BottomNav,
  Button,
  LoadingState,
  SegmentedControl,
  SessionExpiredBanner,
} from '@yggdrasil-lab/ui';
import { getAucklandWeekdayIndex } from './domain/schedule';
import type {
  CockpitMobileTab,
  Commitment,
  CommitmentCreate,
  DesktopWorkspaceTab,
  GridBlock,
  GridBlockCreate,
  KairosCockpitData,
} from './domain/types';
import { useKairosSchedule } from './hooks/useKairosSchedule';
import { CommitmentModal } from './components/CommitmentModal';
import { GridBlockModal } from './components/GridBlockModal';
import { NowNextHero } from './components/NowNextHero';
import { TodayTimeline } from './components/TodayTimeline';
import { WeeklyGridView } from './components/WeeklyGridView';

const DESKTOP_TABS: { id: DesktopWorkspaceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Today Timeline', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'week', label: 'Mon-Sun Weekly Grid', icon: <Grid className="w-3.5 h-3.5" /> },
];

const MOBILE_TABS: { id: CockpitMobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'now', label: 'Now', icon: <Clock className="w-4 h-4" /> },
  { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
  { id: 'week', label: 'Week', icon: <Grid className="w-4 h-4" /> },
];

interface CockpitBodyProps {
  data: KairosCockpitData;
  desktopTab: DesktopWorkspaceTab;
  mobileTab: CockpitMobileTab;
  nowMinute: number;
  weekdayIndex: number;
  onChangeDesktopTab: (tab: DesktopWorkspaceTab) => void;
  onAddCommitment: () => void;
  onEditCommitment: (c: Commitment) => void;
  onDeleteCommitment: (id: number) => void;
  onSkipGridBlock: (id: number) => void;
  onRestoreException: (id: number) => void;
  onAddGridBlock: (dayOfWeek?: number) => void;
  onEditGridBlock: (b: GridBlock) => void;
  onToggleGridBlockActive: (b: GridBlock) => void;
  onDeleteGridBlock: (id: number) => void;
}

const CockpitBody: React.FC<CockpitBodyProps> = (props) => {
  const { data, desktopTab, mobileTab, nowMinute, weekdayIndex, onChangeDesktopTab } = props;
  const heroClass = mobileTab === 'now' ? 'block' : 'hidden lg:block';
  const todayClass = `${mobileTab === 'today' ? 'block' : 'hidden'} ${desktopTab === 'today' ? 'lg:block' : 'lg:hidden'}`;
  const weekClass = `${mobileTab === 'week' ? 'block' : 'hidden'} ${desktopTab === 'week' ? 'lg:block' : 'lg:hidden'}`;

  return (
    <div className="space-y-5">
      <div className={heroClass}>
        <NowNextHero nowNext={data.nowNext} onAddCommitment={props.onAddCommitment} />
      </div>

      <div className="hidden lg:flex items-center justify-between">
        <SegmentedControl
          options={DESKTOP_TABS}
          value={desktopTab}
          onChange={onChangeDesktopTab}
          variant="blue"
          size="sm"
          idPrefix="desktop-tab"
        />
      </div>

      <div className={todayClass}>
        <TodayTimeline
          schedule={data.daySchedule}
          exceptions={data.exceptions}
          nowMinute={nowMinute}
          onAddCommitment={props.onAddCommitment}
          onEditCommitment={props.onEditCommitment}
          onDeleteCommitment={props.onDeleteCommitment}
          onSkipGridBlock={props.onSkipGridBlock}
          onRestoreException={props.onRestoreException}
        />
      </div>

      <div className={weekClass}>
        <WeeklyGridView
          blocks={data.weeklyGrid}
          initialDayOfWeek={weekdayIndex}
          onAddBlock={props.onAddGridBlock}
          onEditBlock={props.onEditGridBlock}
          onToggleBlockActive={props.onToggleGridBlockActive}
          onDeleteBlock={props.onDeleteGridBlock}
        />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const schedule = useKairosSchedule();
  const [desktopTab, setDesktopTab] = useState<DesktopWorkspaceTab>('today');
  const [mobileTab, setMobileTab] = useState<CockpitMobileTab>('now');
  const [commitmentModalOpen, setCommitmentModalOpen] = useState<boolean>(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [gridModalOpen, setGridModalOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<GridBlock | null>(null);
  const [defaultGridDay, setDefaultGridDay] = useState<number>(() =>
    getAucklandWeekdayIndex(schedule.targetDate)
  );

  const openAddCommitment = () => {
    schedule.clearMutationError();
    setEditingCommitment(null);
    setCommitmentModalOpen(true);
  };

  const openEditCommitment = (item: Commitment) => {
    schedule.clearMutationError();
    setEditingCommitment(item);
    setCommitmentModalOpen(true);
  };

  const openAddGridBlock = (dayOfWeek?: number) => {
    schedule.clearMutationError();
    setDefaultGridDay(dayOfWeek ?? getAucklandWeekdayIndex(schedule.targetDate));
    setEditingBlock(null);
    setGridModalOpen(true);
  };

  const openEditGridBlock = (block: GridBlock) => {
    schedule.clearMutationError();
    setDefaultGridDay(block.day_of_week);
    setEditingBlock(block);
    setGridModalOpen(true);
  };

  const handleSaveCommitment = async (payload: CommitmentCreate, editingId: number | null) => {
    if (editingId !== null) {
      await schedule.editCommitment(editingId, payload);
      return;
    }
    await schedule.addCommitment(payload);
  };

  const handleSaveGridBlock = async (payload: GridBlockCreate, editingId: number | null) => {
    if (editingId !== null) {
      await schedule.editGridBlock(editingId, payload);
      return;
    }
    await schedule.addGridBlock(payload);
  };

  return (
    <AppShell
      header={
        <AppHeader
          brandInitial="K"
          variant="blue"
          title="Kairos"
          subtitle="Focus Cockpit"
          isRefreshing={schedule.isRefreshing}
          onRefresh={() => void schedule.refresh()}
          actions={
            <Button
              variant="blue"
              size="sm"
              data-testid="header-add-btn"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAddCommitment}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Add
            </Button>
          }
        />
      }
      bottomNav={
        <BottomNav
          tabs={MOBILE_TABS}
          activeTab={mobileTab}
          onChangeTab={(id) => setMobileTab(id as CockpitMobileTab)}
          variant="blue"
          hideOnDesktop
        />
      }
    >
      {schedule.state.status === 'error' && schedule.state.isSessionExpired && (
        <SessionExpiredBanner className="mb-4" />
      )}

      {schedule.state.status === 'error' && !schedule.state.isSessionExpired && (
        <AlertBanner
          variant="error"
          title="Schedule unavailable"
          action={
            <Button variant="secondary" size="xs" onClick={() => void schedule.refresh()}>
              Retry
            </Button>
          }
          className="mb-4"
        >
          {schedule.state.message}
        </AlertBanner>
      )}

      {Boolean(schedule.mutationError) && schedule.state.status === 'ready' && (
        <AlertBanner variant="error" className="mb-4">
          {schedule.mutationError}
        </AlertBanner>
      )}

      {schedule.state.status === 'loading' && <LoadingState label="Resolving schedule..." variant="blue" />}

      {schedule.state.status === 'ready' && (
        <CockpitBody
          data={schedule.state.data}
          desktopTab={desktopTab}
          mobileTab={mobileTab}
          nowMinute={schedule.nowMinute}
          weekdayIndex={getAucklandWeekdayIndex(schedule.targetDate)}
          onChangeDesktopTab={setDesktopTab}
          onAddCommitment={openAddCommitment}
          onEditCommitment={openEditCommitment}
          onDeleteCommitment={(id) => void schedule.removeCommitment(id)}
          onSkipGridBlock={(id) => void schedule.skipGridBlockForDate(id)}
          onRestoreException={(id) => void schedule.restoreException(id)}
          onAddGridBlock={openAddGridBlock}
          onEditGridBlock={openEditGridBlock}
          onToggleGridBlockActive={(block) =>
            void schedule.editGridBlock(block.id, { active: !block.active })
          }
          onDeleteGridBlock={(id) => void schedule.removeGridBlock(id)}
        />
      )}

      <CommitmentModal
        isOpen={commitmentModalOpen}
        defaultDate={schedule.targetDate}
        editing={editingCommitment}
        error={schedule.mutationError}
        onClose={() => setCommitmentModalOpen(false)}
        onSave={handleSaveCommitment}
      />

      <GridBlockModal
        isOpen={gridModalOpen}
        defaultDayOfWeek={defaultGridDay}
        editing={editingBlock}
        error={schedule.mutationError}
        onClose={() => setGridModalOpen(false)}
        onSave={handleSaveGridBlock}
      />
    </AppShell>
  );
};
