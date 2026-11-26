import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppResumeRefresh } from '@yggdrasil-lab/ui';
import { getAucklandClockSnapshot } from '../domain/schedule';
import type {
  CommitmentCreate,
  CommitmentUpdate,
  ExtendMinutes,
  GridBlockCreate,
  GridBlockUpdate,
  KairosCockpitData,
  LoadState,
} from '../domain/types';
import {
  createCommitment,
  createGridBlock,
  deleteCommitment,
  deleteException,
  deleteGridBlock,
  extendActiveBlock as postExtendActiveBlock,
  fetchDaySchedule,
  fetchExceptions,
  fetchNowNext,
  fetchWeeklyGrid,
  isSessionExpiredError,
  updateCommitment,
  updateGridBlock,
  upsertException,
} from '../services/api';

export interface KairosScheduleActions {
  state: LoadState<KairosCockpitData>;
  targetDate: string;
  nowMinute: number;
  isRefreshing: boolean;
  isExtending: boolean;
  mutationError: string | null;
  clearMutationError: () => void;
  setTargetDate: (nextDate: string) => void;
  refresh: () => Promise<void>;
  addCommitment: (payload: CommitmentCreate) => Promise<void>;
  editCommitment: (id: number, payload: CommitmentUpdate) => Promise<void>;
  confirmCommitment: (commitmentId: number) => Promise<void>;
  dismissCommitment: (commitmentId: number) => Promise<void>;
  removeCommitment: (id: number) => Promise<void>;
  addGridBlock: (payload: GridBlockCreate) => Promise<void>;
  editGridBlock: (id: number, payload: GridBlockUpdate) => Promise<void>;
  removeGridBlock: (id: number) => Promise<void>;
  skipGridBlockForDate: (gridBlockId: number) => Promise<void>;
  restoreException: (exceptionId: number) => Promise<void>;
  extendActiveBlock: (gridBlockId: number, minutes: ExtendMinutes) => Promise<void>;
}

function resolveErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unexpected schedule error';
}

async function fetchCockpitSnapshot(dateStr: string, minute: number): Promise<KairosCockpitData> {
  const [nowNext, daySchedule, weeklyGrid, exceptions] = await Promise.all([
    fetchNowNext(dateStr, minute),
    fetchDaySchedule(dateStr),
    fetchWeeklyGrid(),
    fetchExceptions(dateStr),
  ]);
  return { nowNext, daySchedule, weeklyGrid, exceptions };
}

function useScheduleTimers(
  targetDate: string,
  loadData: (dateStr: string, showSpinner: boolean) => Promise<void>
): void {
  useEffect(() => {
    void loadData(targetDate, true);
  }, [targetDate, loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadData(targetDate, false);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [targetDate, loadData]);

  useAppResumeRefresh(() => {
    void loadData(targetDate, false);
  });
}

function useScheduleSnapshot(targetDate: string) {
  const [nowMinute, setNowMinute] = useState<number>(() => getAucklandClockSnapshot().minuteOfDay);
  const [state, setState] = useState<LoadState<KairosCockpitData>>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (dateStr: string, showSpinner: boolean) => {
    const snap = getAucklandClockSnapshot();
    setNowMinute(snap.minuteOfDay);
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await fetchCockpitSnapshot(dateStr, snap.minuteOfDay);
      setState({ status: 'ready', data });
    } catch (error: unknown) {
      setState({ status: 'error', message: resolveErrorMessage(error), isSessionExpired: isSessionExpiredError(error) });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useScheduleTimers(targetDate, loadData);
  return { state, nowMinute, isRefreshing, loadData };
}

export function useKairosSchedule(): KairosScheduleActions {
  const initialClock = useRef(getAucklandClockSnapshot());
  const [targetDate, setTargetDate] = useState<string>(initialClock.current.isoDate);
  const { state, nowMinute, isRefreshing, loadData } = useScheduleSnapshot(targetDate);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const runMutation = useCallback(async (op: () => Promise<unknown>) => {
    setMutationError(null);
    try {
      await op();
      await loadData(targetDate, false);
    } catch (error: unknown) {
      setMutationError(resolveErrorMessage(error));
      throw error;
    }
  }, [targetDate, loadData]);

  const extendActiveBlock = useCallback(async (gridBlockId: number, minutes: ExtendMinutes) => {
    setIsExtending(true);
    try {
      await runMutation(() => postExtendActiveBlock({ target_date: targetDate, grid_block_id: gridBlockId, minutes }));
    } finally {
      setIsExtending(false);
    }
  }, [targetDate, runMutation]);

  return {
    state, targetDate, nowMinute, isRefreshing, isExtending, mutationError,
    clearMutationError: () => setMutationError(null),
    setTargetDate,
    refresh: () => loadData(targetDate, true),
    addCommitment: (payload) => runMutation(() => createCommitment(payload)),
    editCommitment: (id, payload) => runMutation(() => updateCommitment(id, payload)),
    confirmCommitment: (commitmentId) =>
      runMutation(() => updateCommitment(commitmentId, { tentative: false })),
    dismissCommitment: (commitmentId) => runMutation(() => deleteCommitment(commitmentId)),
    removeCommitment: (id) => runMutation(() => deleteCommitment(id)),
    addGridBlock: (payload) => runMutation(() => createGridBlock(payload)),
    editGridBlock: (id, payload) => runMutation(() => updateGridBlock(id, payload)),
    removeGridBlock: (id) => runMutation(() => deleteGridBlock(id)),
    skipGridBlockForDate: (gridBlockId) => runMutation(() => upsertException({ grid_block_id: gridBlockId, target_date: targetDate, skipped: true })),
    restoreException: (exceptionId) => runMutation(() => deleteException(exceptionId)),
    extendActiveBlock,
  };
}
