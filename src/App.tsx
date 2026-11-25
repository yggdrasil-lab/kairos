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
  DesktopWorkspaceTab,
  KairosCockpitData,
  LoadState,
} from './domain/types';
import { useCockpitModals, type CockpitModalControllers } from './hooks/useCockpitModals';
import { useKairosSchedule, type KairosScheduleActions } from './hooks/useKairosSchedule';
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

const CockpitStatusBanners: React.FC<{
  state: LoadState<KairosCockpitData>;
  mutationError: string | null;
  onRefresh: () => void;
}> = ({ state, mutationError, onRefresh }) => (
  <>
    {state.status === 'error' && state.isSessionExpired && <SessionExpiredBanner className="mb-4" />}
    {state.status === 'error' && !state.isSessionExpired && (
      <AlertBanner
        variant="error"
        title="Schedule unavailable"
        action={<Button variant="secondary" size="xs" onClick={onRefresh}>Retry</Button>}
        className="mb-4"
      >
        {state.message}
      </AlertBanner>
    )}
    {Boolean(mutationError) && state.status === 'ready' && (
      <AlertBanner variant="error" className="mb-4">{mutationError}</AlertBanner>
    )}
  </>
);

const CockpitBody: React.FC<{
  data: KairosCockpitData;
  desktopTab: DesktopWorkspaceTab;
  mobileTab: CockpitMobileTab;
  schedule: KairosScheduleActions;
  modals: CockpitModalControllers;
  onChangeDesktopTab: (tab: DesktopWorkspaceTab) => void;
}> = ({ data, desktopTab, mobileTab, schedule, modals, onChangeDesktopTab }) => {
  const heroClass = mobileTab === 'now' ? 'block' : 'hidden lg:block';
  const todayClass = `${mobileTab === 'today' ? 'block' : 'hidden'} ${desktopTab === 'today' ? 'lg:block' : 'lg:hidden'}`;
  const weekClass = `${mobileTab === 'week' ? 'block' : 'hidden'} ${desktopTab === 'week' ? 'lg:block' : 'lg:hidden'}`;

  return (
    <div className="space-y-5">
      <div className={heroClass}>
        <NowNextHero nowNext={data.nowNext} onAddCommitment={modals.openAddCommitment} />
      </div>
      <div className="hidden lg:flex items-center justify-between">
        <SegmentedControl options={DESKTOP_TABS} value={desktopTab} onChange={onChangeDesktopTab} variant="blue" size="sm" idPrefix="desktop-tab" />
      </div>
      <div className={todayClass}>
        <TodayTimeline
          schedule={data.daySchedule}
          exceptions={data.exceptions}
          nowMinute={schedule.nowMinute}
          onAddCommitment={modals.openAddCommitment}
          onEditCommitment={modals.openEditCommitment}
          onDeleteCommitment={(id) => void schedule.removeCommitment(id)}
          onSkipGridBlock={(id) => void schedule.skipGridBlockForDate(id)}
          onRestoreException={(id) => void schedule.restoreException(id)}
        />
      </div>
      <div className={weekClass}>
        <WeeklyGridView
          blocks={data.weeklyGrid}
          initialDayOfWeek={getAucklandWeekdayIndex(schedule.targetDate)}
          onAddBlock={modals.openAddGridBlock}
          onEditBlock={modals.openEditGridBlock}
          onToggleBlockActive={(block) => void schedule.editGridBlock(block.id, { active: !block.active })}
          onDeleteBlock={(id) => void schedule.removeGridBlock(id)}
        />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const schedule = useKairosSchedule();
  const modals = useCockpitModals(schedule);
  const [desktopTab, setDesktopTab] = useState<DesktopWorkspaceTab>('today');
  const [mobileTab, setMobileTab] = useState<CockpitMobileTab>('now');

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
            <Button variant="blue" size="sm" data-testid="header-add-btn" icon={<Plus className="w-4 h-4" />} onClick={modals.openAddCommitment} className="min-h-[44px] sm:min-h-[36px]">
              Add
            </Button>
          }
        />
      }
      bottomNav={
        <BottomNav tabs={MOBILE_TABS} activeTab={mobileTab} onChangeTab={(id) => setMobileTab(id as CockpitMobileTab)} variant="blue" hideOnDesktop />
      }
    >
      <CockpitStatusBanners state={schedule.state} mutationError={schedule.mutationError} onRefresh={() => void schedule.refresh()} />
      {schedule.state.status === 'loading' && <LoadingState label="Resolving schedule..." variant="blue" />}
      {schedule.state.status === 'ready' && (
        <CockpitBody data={schedule.state.data} desktopTab={desktopTab} mobileTab={mobileTab} schedule={schedule} modals={modals} onChangeDesktopTab={setDesktopTab} />
      )}
      <CommitmentModal isOpen={modals.commitmentOpen} defaultDate={schedule.targetDate} editing={modals.editingCommitment} error={schedule.mutationError} onClose={modals.closeCommitment} onSave={modals.saveCommitment} />
      <GridBlockModal isOpen={modals.gridOpen} defaultDayOfWeek={modals.defaultGridDay} editing={modals.editingBlock} error={schedule.mutationError} onClose={modals.closeGridBlock} onSave={modals.saveGridBlock} />
    </AppShell>
  );
};
