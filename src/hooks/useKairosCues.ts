import { useCallback, useEffect, useState } from 'react';
import { getMondayOfWeek } from '../domain/cues';
import type {
  FrictionNote,
  FrictionNoteCreate,
  HabitCue,
  HabitCueCreate,
  HabitCueUpdate,
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
  updateCue,
} from '../services/api';

export interface KairosCuesActions {
  cues: HabitCue[];
  frictionNotes: FrictionNote[];
  reflection: WeeklyReflection | null;
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

export function useKairosCues(targetDate: string): KairosCuesActions {
  const [cues, setCues] = useState<HabitCue[]>([]);
  const [frictionNotes, setFrictionNotes] = useState<FrictionNote[]>([]);
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [weekStart, setWeekStart] = useState<string>(() => getMondayOfWeek(targetDate));
  const [isLoadingCues, setIsLoadingCues] = useState<boolean>(true);
  const [isLoadingReflection, setIsLoadingReflection] = useState<boolean>(true);
  const [cuesError, setCuesError] = useState<string | null>(null);
  const [cueMutationError, setCueMutationError] = useState<string | null>(null);

  const loadCuesAndNotes = useCallback(async () => {
    setIsLoadingCues(true);
    try {
      const [cueList, noteList] = await Promise.all([
        fetchCues(),
        fetchFrictionNotes({ limit: 40 }),
      ]);
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

  const refreshCues = useCallback(async () => {
    await Promise.all([loadCuesAndNotes(), loadReflection(weekStart)]);
  }, [loadCuesAndNotes, loadReflection, weekStart]);

  useEffect(() => {
    void loadCuesAndNotes();
  }, [loadCuesAndNotes]);

  useEffect(() => {
    void loadReflection(weekStart);
  }, [loadReflection, weekStart]);

  const runMutation = useCallback(
    async (op: () => Promise<unknown>) => {
      setCueMutationError(null);
      try {
        await op();
        await refreshCues();
      } catch (error: unknown) {
        setCueMutationError(resolveCueError(error));
        throw error;
      }
    },
    [refreshCues]
  );

  return {
    cues,
    frictionNotes,
    reflection,
    weekStart,
    isLoadingCues,
    isLoadingReflection,
    cuesError,
    cueMutationError,
    clearCueMutationError: () => setCueMutationError(null),
    setWeekStart,
    refreshCues,
    addCue: (payload) => runMutation(() => createCue(payload)),
    editCue: (cueId, payload) => runMutation(() => updateCue(cueId, payload)),
    removeCue: (cueId) => runMutation(() => deleteCue(cueId)),
    logFriction: (payload) => runMutation(() => createFrictionNote(payload)),
    removeFrictionNote: (noteId) => runMutation(() => deleteFrictionNote(noteId)),
  };
}
