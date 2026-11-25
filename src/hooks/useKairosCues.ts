import { useCallback, useEffect, useState } from 'react';
import { getMondayOfWeek } from '../domain/cues';
import type {
  FrictionNote,
  FrictionNoteCreate,
  HabitCue,
  HabitCueCreate,
  HabitCueUpdate,
  PassiveSignalStatus,
  WeeklyReflection,
} from '../domain/types';
import {
  createCue,
  createFrictionNote,
  deleteCue,
  deleteFrictionNote,
  fetchCues,
  fetchFrictionNotes,
  fetchWeeklyReflection,
  getPassiveSignals,
  updateCue,
} from '../services/api';

export interface KairosCuesActions {
  cues: HabitCue[];
  frictionNotes: FrictionNote[];
  reflection: WeeklyReflection | null;
  passiveSignals: Record<string, PassiveSignalStatus>;
  weekStart: string;
  isLoadingCues: boolean;
  isLoadingReflection: boolean;
  cuesError: string | null;
  cueMutationError: string | null;
  clearCueMutationError: () => void;
  setWeekStart: (nextWeekStart: string) => void;
  refreshCues: () => Promise<void>;
  addCue: (payload: HabitCueCreate) => Promise<void>;
  editCue: (cueId: number, payload: HabitCueUpdate) => Promise<void>;
  removeCue: (cueId: number) => Promise<void>;
  logFriction: (payload: FrictionNoteCreate) => Promise<void>;
  removeFrictionNote: (noteId: number) => Promise<void>;
}

function resolveCueError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unexpected cue or friction error';
}

function useCueQueries(targetDate: string, weekStart: string) {
  const [cues, setCues] = useState<HabitCue[]>([]);
  const [frictionNotes, setFrictionNotes] = useState<FrictionNote[]>([]);
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [passiveSignals, setPassiveSignals] = useState<Record<string, PassiveSignalStatus>>({});
  const [isLoadingCues, setIsLoadingCues] = useState<boolean>(true);
  const [isLoadingReflection, setIsLoadingReflection] = useState<boolean>(true);
  const [cuesError, setCuesError] = useState<string | null>(null);

  const loadCuesAndNotes = useCallback(async () => {
    setIsLoadingCues(true);
    try {
      const [cueList, noteList] = await Promise.all([fetchCues(), fetchFrictionNotes({ limit: 40 })]);
      setCues(cueList);
      setFrictionNotes(noteList);
      setCuesError(null);
    } catch (error: unknown) {
      setCuesError(resolveCueError(error));
    } finally {
      setIsLoadingCues(false);
    }
  }, []);

  const loadReflection = useCallback(async (selectedWeek: string) => {
    setIsLoadingReflection(true);
    try {
      const data = await fetchWeeklyReflection(selectedWeek);
      setReflection(data);
      setCuesError(null);
    } catch (error: unknown) {
      setCuesError(resolveCueError(error));
    } finally {
      setIsLoadingReflection(false);
    }
  }, []);

  const loadPassiveSignals = useCallback(async (selectedDate: string) => {
    try {
      const response = await getPassiveSignals(selectedDate);
      setPassiveSignals(response.signals ?? {});
    } catch {
      setPassiveSignals({});
    }
  }, []);

  useEffect(() => {
    void loadCuesAndNotes();
  }, [loadCuesAndNotes]);

  useEffect(() => {
    void loadReflection(weekStart);
  }, [loadReflection, weekStart]);

  useEffect(() => {
    void loadPassiveSignals(targetDate);
  }, [loadPassiveSignals, targetDate]);

  const refreshCues = useCallback(async () => {
    await Promise.all([
      loadCuesAndNotes(),
      loadReflection(weekStart),
      loadPassiveSignals(targetDate),
    ]);
  }, [loadCuesAndNotes, loadReflection, loadPassiveSignals, weekStart, targetDate]);

  return {
    cues,
    frictionNotes,
    reflection,
    passiveSignals,
    isLoadingCues,
    isLoadingReflection,
    cuesError,
    refreshCues,
  };
}

export function useKairosCues(targetDate: string): KairosCuesActions {
  const [weekStart, setWeekStart] = useState<string>(() => getMondayOfWeek(targetDate));
  const [cueMutationError, setCueMutationError] = useState<string | null>(null);
  const queryState = useCueQueries(targetDate, weekStart);

  const runMutation = useCallback(
    async (op: () => Promise<unknown>) => {
      setCueMutationError(null);
      try {
        await op();
        await queryState.refreshCues();
      } catch (error: unknown) {
        setCueMutationError(resolveCueError(error));
        throw error;
      }
    },
    [queryState.refreshCues]
  );

  return {
    ...queryState,
    weekStart,
    cueMutationError,
    clearCueMutationError: () => setCueMutationError(null),
    setWeekStart,
    addCue: (payload) => runMutation(() => createCue(payload)),
    editCue: (cueId, payload) => runMutation(() => updateCue(cueId, payload)),
    removeCue: (cueId) => runMutation(() => deleteCue(cueId)),
    logFriction: (payload) => runMutation(() => createFrictionNote(payload)),
    removeFrictionNote: (noteId) => runMutation(() => deleteFrictionNote(noteId)),
  };
}
