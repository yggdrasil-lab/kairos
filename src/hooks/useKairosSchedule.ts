import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppResumeRefresh } from '@yggdrasil-lab/ui';
import { getAucklandClockSnapshot } from '../domain/schedule';
import type {
  CommitmentCreate,
  CommitmentUpdate,
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
  mutationError: string | null;
  clearMutationError: () => void;
  setTargetDate: (nextDate: string) => void;
  refresh: () => Promise<void>;
  addCommitment: (payload: CommitmentCreate) => Promise<void>;
  editCommitment: (id: number, payload: CommitmentUpdate) => Promise<void>;
  removeCommitment: (id: number) => Promise<void>;
  addGridBlock: (payload: GridBlockCreate) => Promise<void>;
  editGridBlock: (id: number, payload: GridBlockUpdate) => Promise<void>;
  removeGridBlock: (id: number) => Promise<void>;
  skipGridBlockForDate: (gridBlockId: number) => Promise<void>;
  restoreException: (exceptionId: number) => Promise<void>;
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unexpected schedule error';
}

export function useKairosSchedule(): KairosScheduleActions {
  const initialClock = useRef(getAucklandClockSnapshot());
  const [targetDate, setTargetDate] = useState<string>(initialClock.current.isoDate);
  const [nowMinute, setNowMinute] = useState<number>(initialClock.current.minuteOfDay);
  const [state, setState] = useState<LoadState<KairosCockpitData>>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadData = useCallback(async (dateStr: string, showSpinner: boolean) => {
    const snap = getAucklandClockSnapshot();
    setNowMinute(snap.minuteOfDay);
    if (showSpinner) {
      setIsRefreshing(true);
    }
    try {
      const [nowNext, daySchedule, weeklyGrid, exceptions] = await Promise.all([
        fetchNowNext(dateStr, snap.minuteOfDay),
        fetchDaySchedule(dateStr),
        fetchWeeklyGrid(),
        fetchExceptions(dateStr),
      ]);
      setState({
        status: 'ready',
        data: { nowNext, daySchedule, weeklyGrid, exceptions },
      });
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: resolveErrorMessage(error),
        isSessionExpired: isSessionExpiredError(error),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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

  const refresh = useCallback(async () => {
    await loadData(targetDate, true);
  }, [targetDate, loadData]);

  const runMutation = useCallback(
    async (op: () => Promise<unknown>) => {
      setMutationError(null);
      try {
        await op();
        await loadData(targetDate, false);
      } catch (error: unknown) {
        const message = resolveErrorMessage(error);
        setMutationError(message);
        throw error;
      }
    },
    [targetDate, loadData]
  );

  return {
    state,
    targetDate,
    nowMinute,
    isRefreshing,
    mutationError,
    clearMutationError: () => setMutationError(null),
    setTargetDate,
    refresh,
    addCommitment: (payload) => runMutation(() => createCommitment(payload)),
    editCommitment: (id, payload) => runMutation(() => updateCommitment(id, payload)),
    removeCommitment: (id) => runMutation(() => deleteCommitment(id)),
    addGridBlock: (payload) => runMutation(() => createGridBlock(payload)),
    editGridBlock: (id, payload) => runMutation(() => updateGridBlock(id, payload)),
    removeGridBlock: (id) => runMutation(() => deleteGridBlock(id)),
    skipGridBlockForDate: (gridBlockId) =>
      runMutation(() =>
        upsertException({
          grid_block_id: gridBlockId,
          target_date: targetDate,
          skipped: true,
        })
      ),
    restoreException: (exceptionId) => runMutation(() => deleteException(exceptionId)),
  };
}
