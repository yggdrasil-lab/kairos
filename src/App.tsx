import React, { useState } from 'react';
import { Bell, BellOff, BellRing, Calendar, Clock, Compass, Grid, Plus } from 'lucide-react';
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
import { getBlockFrictionNotes } from './domain/cues';
import { getAucklandWeekdayIndex } from './domain/schedule';
import type {
  CockpitMobileTab,
  DesktopWorkspaceTab,
  ExtendMinutes,
  KairosCockpitData,
  LoadState,
} from './domain/types';
import { useCockpitModals, type CockpitModalControllers } from './hooks/useCockpitModals';
import { useKairosCues, type KairosCuesActions } from './hooks/useKairosCues';
import { useKairosSchedule, type KairosScheduleActions } from './hooks/useKairosSchedule';
import { usePushNotifications, type UsePushNotificationsResult } from './hooks/usePushNotifications';
import { ActiveZoneChainCard } from './components/ActiveZoneChainCard';
import { CommitmentModal } from './components/CommitmentModal';
import { CuesWorkspace } from './components/CuesWorkspace';
import { FrictionNoteModal } from './components/FrictionNoteModal';
import { GridBlockModal } from './components/GridBlockModal';
import { HabitCueModal } from './components/HabitCueModal';
import { NowNextHero } from './components/NowNextHero';
import { TodayTimeline } from './components/TodayTimeline';
import { WeeklyGridView } from './components/WeeklyGridView';

const DESKTOP_TABS: { id: DesktopWorkspaceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Today Timeline', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'week', label: 'Weekly Grid', icon: <Grid className="w-3.5 h-3.5" /> },
  { id: 'cues', label: 'Cues & Reflection', icon: <Compass className="w-3.5 h-3.5" /> },
];

const MOBILE_TABS: { id: CockpitMobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'now', label: 'Now', icon: <Clock className="w-4 h-4" /> },
  { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
  { id: 'week', label: 'Week', icon: <Grid className="w-4 h-4" /> },
  { id: 'cues', label: 'Cues', icon: <Compass className="w-4 h-4" /> },
];

function resolveInitialTabs(): { mobile: CockpitMobileTab; desktop: DesktopWorkspaceTab } {
  if (typeof window === 'undefined') {
    return { mobile: 'now', desktop: 'today' };
  }
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab === 'today' || tab === 'week' || tab === 'cues') {
    return { mobile: tab, desktop: tab };
  }
  return { mobile: 'now', desktop: 'today' };
}

function resolvePushLabel(status: UsePushNotificationsResult['status']): string {
  switch (status) {
    case 'subscribed':
      return 'Nudges On';
    case 'denied':
      return 'Blocked';
    case 'unsupported':
      return 'No Push';
    default:
      return 'Nudges';
  }
}

const PushNudgeButton: React.FC<{ push: UsePushNotificationsResult }> = ({ push }) => {
  const isSubscribed = push.status === 'subscribed';
  const isBlocked = push.status === 'denied' || push.status === 'unsupported';
  const icon = isSubscribed ? (
    <BellRing className="w-3.5 h-3.5 text-accent" />
  ) : isBlocked ? (
    <BellOff className="w-3.5 h-3.5" />
  ) : (
    <Bell className="w-3.5 h-3.5" />
  );
  const label = resolvePushLabel(push.status);
  const handleClick = () => {
    if (isSubscribed) {
      void push.disablePush();
      return;
    }
    void push.enablePush();
  };

  return (
    <Button
      variant={isSubscribed ? 'secondary' : 'outline'}
      size="sm"
      data-testid="header-push-btn"
      data-push-status={push.status}
      icon={icon}
      loading={push.status === 'loading'}
      disabled={isBlocked}
      onClick={handleClick}
      aria-label={isSubscribed ? 'Disable push nudges' : 'Enable push nudges'}
      title={push.error ?? label}
      className={`min-h-[44px] min-w-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 ${
        isSubscribed ? 'border-accent/50 text-accent' : ''
      }`}
    >
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};

const CockpitStatusBanners: React.FC<{
  state: LoadState<KairosCockpitData>;
  mutationError: string | null;
  pushError: string | null;
  onRefresh: () => void;
}> = ({ state, mutationError, pushError, onRefresh }) => (
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
    {Boolean(pushError) && (
      <AlertBanner variant="error" className="mb-4">{pushError}</AlertBanner>
    )}
  </>
);

function getTabClasses(mobileTab: CockpitMobileTab, desktopTab: DesktopWorkspaceTab) {
  return {
    hero: mobileTab === 'now' ? 'block space-y-4' : 'hidden lg:block lg:space-y-4',
    today: `${mobileTab === 'today' ? 'block' : 'hidden'} ${desktopTab === 'today' ? 'lg:block' : 'lg:hidden'}`,
    week: `${mobileTab === 'week' ? 'block' : 'hidden'} ${desktopTab === 'week' ? 'lg:block' : 'lg:hidden'}`,
    cues: `${mobileTab === 'cues' ? 'block' : 'hidden'} ${desktopTab === 'cues' ? 'lg:block' : 'lg:hidden'}`,
  };
}

const CockpitBody: React.FC<{
  data: KairosCockpitData;
  desktopTab: DesktopWorkspaceTab;
  mobileTab: CockpitMobileTab;
  schedule: KairosScheduleActions;
  cuesState: KairosCuesActions;
  modals: CockpitModalControllers;
  onExtendBlock: (gridBlockId: number, minutes: ExtendMinutes) => Promise<void>;
  onChangeDesktopTab: (tab: DesktopWorkspaceTab) => void;
}> = ({ data, desktopTab, mobileTab, schedule, cuesState, modals, onExtendBlock, onChangeDesktopTab }) => {
  const cls = getTabClasses(mobileTab, desktopTab);
  return (
    <div className="space-y-5">
      <div className={cls.hero}>
        <NowNextHero nowNext={data.nowNext} onAddCommitment={modals.openAddCommitment} onExtendBlock={onExtendBlock} isExtending={schedule.isExtending} />
        <ActiveZoneChainCard activeSlice={data.nowNext.active_slice} cues={cuesState.cues} onLogFriction={modals.openLogFriction} />
      </div>
      <div className="hidden lg:flex items-center justify-between">
        <SegmentedControl options={DESKTOP_TABS} value={desktopTab} onChange={onChangeDesktopTab} variant="brand" size="sm" idPrefix="desktop-tab" />
      </div>
      <div className={cls.today}>
        <TodayTimeline schedule={data.daySchedule} exceptions={data.exceptions} nowMinute={schedule.nowMinute} onAddCommitment={modals.openAddCommitment} onEditCommitment={modals.openEditCommitment} onDeleteCommitment={(id) => void schedule.removeCommitment(id)} onSkipGridBlock={(id) => void schedule.skipGridBlockForDate(id)} onRestoreException={(id) => void schedule.restoreException(id)} />
      </div>
      <div className={cls.week}>
        <WeeklyGridView blocks={data.weeklyGrid} initialDayOfWeek={getAucklandWeekdayIndex(schedule.targetDate)} onAddBlock={modals.openAddGridBlock} onEditBlock={modals.openEditGridBlock} onToggleBlockActive={(block) => void schedule.editGridBlock(block.id, { active: !block.active })} onDeleteBlock={(id) => void schedule.removeGridBlock(id)} />
      </div>
      <div className={cls.cues}>
        <CuesWorkspace cuesState={cuesState} weeklyGrid={data.weeklyGrid} onAddCue={modals.openAddCue} onEditCue={modals.openEditCue} onLogFriction={modals.openLogFriction} />
      </div>
    </div>
  );
};

const AppModals: React.FC<{
  schedule: KairosScheduleActions;
  cuesState: KairosCuesActions;
  modals: CockpitModalControllers;
}> = ({ schedule, cuesState, modals }) => {
  const weeklyGrid = schedule.state.status === 'ready' ? schedule.state.data.weeklyGrid : [];
  const editingBlockFriction = modals.editingBlock
    ? getBlockFrictionNotes(cuesState.cues, modals.editingBlock.id, cuesState.frictionNotes)
    : [];
  return (
    <>
      <CommitmentModal
        isOpen={modals.commitmentOpen}
        defaultDate={schedule.targetDate}
        editing={modals.editingCommitment}
        error={schedule.mutationError}
        onClose={modals.closeCommitment}
        onSave={modals.saveCommitment}
        onDelete={schedule.removeCommitment}
      />
      <GridBlockModal
        isOpen={modals.gridOpen}
        defaultDayOfWeek={modals.defaultGridDay}
        editing={modals.editingBlock}
        recentFriction={editingBlockFriction}
        error={schedule.mutationError}
        onClose={modals.closeGridBlock}
        onSave={modals.saveGridBlock}
        onDelete={schedule.removeGridBlock}
      />
      <HabitCueModal
        isOpen={modals.cueOpen}
        editing={modals.editingCue}
        weeklyGrid={weeklyGrid}
        error={cuesState.cueMutationError}
        onClose={modals.closeCue}
        onSave={modals.saveCue}
        onDelete={cuesState.removeCue}
      />
      <FrictionNoteModal
        isOpen={modals.frictionOpen}
        defaultDate={schedule.targetDate}
        context={modals.frictionContext}
        error={cuesState.cueMutationError}
        onClose={modals.closeFriction}
        onSave={modals.saveFrictionNote}
      />
    </>
  );
};

const CockpitHeader: React.FC<{
  isRefreshing: boolean;
  push: UsePushNotificationsResult;
  onRefresh: () => void;
  onAdd: () => void;
}> = ({ isRefreshing, push, onRefresh, onAdd }) => (
  <AppHeader
    brandInitial="K"
    variant="brand"
    title="Kairos"
    subtitle="Focus Cockpit"
    isRefreshing={isRefreshing}
    onRefresh={onRefresh}
    actions={
      <div className="flex items-center gap-1.5">
        <PushNudgeButton push={push} />
        <Button variant="brand" size="sm" data-testid="header-add-btn" icon={<Plus className="w-4 h-4" />} onClick={onAdd} className="min-h-[44px] sm:min-h-[36px]">
          Add
        </Button>
      </div>
    }
  />
);

export const App: React.FC = () => {
  const schedule = useKairosSchedule();
  const cuesState = useKairosCues(schedule.targetDate);
  const modals = useCockpitModals(schedule, cuesState);
  const push = usePushNotifications();
  const [initialTabs] = useState(resolveInitialTabs);
  const [desktopTab, setDesktopTab] = useState<DesktopWorkspaceTab>(initialTabs.desktop);
  const [mobileTab, setMobileTab] = useState<CockpitMobileTab>(initialTabs.mobile);

  const handleRefresh = () => {
    void schedule.refresh();
    void cuesState.refreshCues();
  };
  const handleExtendBlock = async (gridBlockId: number, minutes: ExtendMinutes) => {
    try { await schedule.extendActiveBlock(gridBlockId, minutes); } catch { /* Surfaced via mutationError */ }
  };

  return (
    <AppShell
      header={<CockpitHeader isRefreshing={schedule.isRefreshing || cuesState.isLoadingCues} push={push} onRefresh={handleRefresh} onAdd={modals.openAddCommitment} />}
      bottomNav={<BottomNav tabs={MOBILE_TABS} activeTab={mobileTab} onChangeTab={(id) => setMobileTab(id as CockpitMobileTab)} variant="brand" hideOnDesktop />}
    >
      <CockpitStatusBanners state={schedule.state} mutationError={schedule.mutationError || cuesState.cueMutationError} pushError={push.error} onRefresh={handleRefresh} />
      {schedule.state.status === 'loading' && <LoadingState label="Resolving schedule..." variant="brand" />}
      {schedule.state.status === 'ready' && (
        <CockpitBody data={schedule.state.data} desktopTab={desktopTab} mobileTab={mobileTab} schedule={schedule} cuesState={cuesState} modals={modals} onExtendBlock={handleExtendBlock} onChangeDesktopTab={setDesktopTab} />
      )}
      <AppModals schedule={schedule} cuesState={cuesState} modals={modals} />
    </AppShell>
  );
};
