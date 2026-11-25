import { useState } from 'react';
import { getAucklandWeekdayIndex } from '../domain/schedule';
import type { Commitment, CommitmentCreate, GridBlock, GridBlockCreate } from '../domain/types';
import type { KairosScheduleActions } from './useKairosSchedule';

export interface CockpitModalControllers {
  commitmentOpen: boolean;
  editingCommitment: Commitment | null;
  gridOpen: boolean;
  editingBlock: GridBlock | null;
  defaultGridDay: number;
  openAddCommitment: () => void;
  openEditCommitment: (item: Commitment) => void;
  closeCommitment: () => void;
  openAddGridBlock: (dayOfWeek?: number) => void;
  openEditGridBlock: (block: GridBlock) => void;
  closeGridBlock: () => void;
  saveCommitment: (payload: CommitmentCreate, editingId: number | null) => Promise<void>;
  saveGridBlock: (payload: GridBlockCreate, editingId: number | null) => Promise<void>;
}

export function useCockpitModals(schedule: KairosScheduleActions): CockpitModalControllers {
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
    openEditCommitment: (item) => {
      schedule.clearMutationError();
      setEditingCommitment(item);
      setCommitmentOpen(true);
    },
    closeCommitment: () => setCommitmentOpen(false),
    openAddGridBlock: (dayOfWeek) => {
      schedule.clearMutationError();
      setDefaultGridDay(dayOfWeek ?? getAucklandWeekdayIndex(schedule.targetDate));
      setEditingBlock(null);
      setGridOpen(true);
    },
    openEditGridBlock: (block) => {
      schedule.clearMutationError();
      setDefaultGridDay(block.day_of_week);
      setEditingBlock(block);
      setGridOpen(true);
    },
    closeGridBlock: () => setGridOpen(false),
    saveCommitment: (payload, editingId) =>
      editingId !== null ? schedule.editCommitment(editingId, payload) : schedule.addCommitment(payload),
    saveGridBlock: (payload, editingId) =>
      editingId !== null ? schedule.editGridBlock(editingId, payload) : schedule.addGridBlock(payload),
  };
}
