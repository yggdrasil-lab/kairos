import { useState } from 'react';
import { getAucklandWeekdayIndex } from '../domain/schedule';
import type {
  Commitment,
  CommitmentCreate,
  FrictionNoteCreate,
  GridBlock,
  GridBlockCreate,
  HabitCue,
  HabitCueCreate,
} from '../domain/types';
import type { KairosCuesActions } from './useKairosCues';
import type { KairosScheduleActions } from './useKairosSchedule';

export interface FrictionModalContext {
  habitCueId: number | null;
  gridBlockId: number | null;
  cueTitle: string | null;
  blockTitle: string | null;
}

export interface CockpitModalControllers {
  commitmentOpen: boolean;
  editingCommitment: Commitment | null;
  gridOpen: boolean;
  editingBlock: GridBlock | null;
  defaultGridDay: number;
  cueOpen: boolean;
  editingCue: HabitCue | null;
  frictionOpen: boolean;
  frictionContext: FrictionModalContext | null;
  openAddCommitment: () => void;
  openEditCommitment: (item: Commitment) => void;
  closeCommitment: () => void;
  openAddGridBlock: (dayOfWeek?: number) => void;
  openEditGridBlock: (block: GridBlock) => void;
  closeGridBlock: () => void;
  openAddCue: () => void;
  openEditCue: (cue: HabitCue) => void;
  closeCue: () => void;
  openLogFriction: (context?: Partial<FrictionModalContext>) => void;
  closeFriction: () => void;
  saveCommitment: (payload: CommitmentCreate, editingId: number | null) => Promise<void>;
  saveGridBlock: (payload: GridBlockCreate, editingId: number | null) => Promise<void>;
  saveCue: (payload: HabitCueCreate, editingId: number | null) => Promise<void>;
  saveFrictionNote: (payload: FrictionNoteCreate) => Promise<void>;
}

const EMPTY_FRICTION_CONTEXT: FrictionModalContext = {
  habitCueId: null,
  gridBlockId: null,
  cueTitle: null,
  blockTitle: null,
};

function useScheduleModalState(schedule: KairosScheduleActions) {
  const [commitmentOpen, setCommitmentOpen] = useState<boolean>(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [gridOpen, setGridOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<GridBlock | null>(null);
  const [defaultGridDay, setDefaultGridDay] = useState<number>(() =>
    getAucklandWeekdayIndex(schedule.targetDate)
  );

  return {
    commitmentOpen,
    editingCommitment,
    gridOpen,
    editingBlock,
    defaultGridDay,
    openAddCommitment: () => {
      schedule.clearMutationError();
      setEditingCommitment(null);
      setCommitmentOpen(true);
    },
    openEditCommitment: (item: Commitment) => {
      schedule.clearMutationError();
      setEditingCommitment(item);
      setCommitmentOpen(true);
    },
    closeCommitment: () => setCommitmentOpen(false),
    openAddGridBlock: (dayOfWeek?: number) => {
      schedule.clearMutationError();
      setDefaultGridDay(dayOfWeek ?? getAucklandWeekdayIndex(schedule.targetDate));
      setEditingBlock(null);
      setGridOpen(true);
    },
    openEditGridBlock: (block: GridBlock) => {
      schedule.clearMutationError();
      setDefaultGridDay(block.day_of_week);
      setEditingBlock(block);
      setGridOpen(true);
    },
    closeGridBlock: () => setGridOpen(false),
    saveCommitment: (payload: CommitmentCreate, editingId: number | null) =>
      editingId !== null ? schedule.editCommitment(editingId, payload) : schedule.addCommitment(payload),
    saveGridBlock: (payload: GridBlockCreate, editingId: number | null) =>
      editingId !== null ? schedule.editGridBlock(editingId, payload) : schedule.addGridBlock(payload),
  };
}

function useCueModalState(cues: KairosCuesActions) {
  const [cueOpen, setCueOpen] = useState<boolean>(false);
  const [editingCue, setEditingCue] = useState<HabitCue | null>(null);
  const [frictionOpen, setFrictionOpen] = useState<boolean>(false);
  const [frictionContext, setFrictionContext] = useState<FrictionModalContext | null>(null);

  return {
    cueOpen,
    editingCue,
    frictionOpen,
    frictionContext,
    openAddCue: () => {
      cues.clearCueMutationError();
      setEditingCue(null);
      setCueOpen(true);
    },
    openEditCue: (cue: HabitCue) => {
      cues.clearCueMutationError();
      setEditingCue(cue);
      setCueOpen(true);
    },
    closeCue: () => setCueOpen(false),
    openLogFriction: (context: Partial<FrictionModalContext> = {}) => {
      cues.clearCueMutationError();
      setFrictionContext({ ...EMPTY_FRICTION_CONTEXT, ...context });
      setFrictionOpen(true);
    },
    closeFriction: () => setFrictionOpen(false),
    saveCue: (payload: HabitCueCreate, editingId: number | null) =>
      editingId !== null ? cues.editCue(editingId, payload) : cues.addCue(payload),
    saveFrictionNote: (payload: FrictionNoteCreate) => cues.logFriction(payload),
  };
}

export function useCockpitModals(
  schedule: KairosScheduleActions,
  cues: KairosCuesActions
): CockpitModalControllers {
  return {
    ...useScheduleModalState(schedule),
    ...useCueModalState(cues),
  };
}
