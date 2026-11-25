import React, { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import {
  AlertBanner,
  Button,
  FormField,
  Modal,
  SelectInput,
  TextArea,
  TextInput,
} from '@yggdrasil-lab/ui';
import {
  CATEGORY_OPTIONS,
  minuteToTimeInput,
  NUDGE_OPTIONS,
  parseTimeToMinute,
  WEEKDAYS,
} from '../domain/schedule';
import type { GridBlock, GridBlockCreate, NudgeMode } from '../domain/types';

export interface GridBlockModalProps {
  isOpen: boolean;
  defaultDayOfWeek: number;
  editing: GridBlock | null;
  error: string | null;
  onClose: () => void;
  onSave: (payload: GridBlockCreate, editingId: number | null) => Promise<void>;
}

interface GridBlockFormState {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  category: string;
  nudgeMode: NudgeMode;
  notes: string;
}

function buildInitialForm(defaultDayOfWeek: number, editing: GridBlock | null): GridBlockFormState {
  if (!editing) {
    return { title: '', dayOfWeek: defaultDayOfWeek, startTime: '09:00', endTime: '11:00', category: 'deep_work', nudgeMode: 'two-stage', notes: '' };
  }
  return {
    title: editing.title,
    dayOfWeek: editing.day_of_week,
    startTime: minuteToTimeInput(editing.start_minute),
    endTime: minuteToTimeInput(editing.end_minute),
    category: editing.category,
    nudgeMode: editing.nudge_mode,
    notes: editing.notes ?? '',
  };
}

function validateGridBlockForm(
  form: GridBlockFormState,
  editing: GridBlock | null
): { payload?: GridBlockCreate; error?: string } {
  const title = form.title.trim();
  if (!title) return { error: 'Block title is required.' };
  const startMinute = parseTimeToMinute(form.startTime);
  const endMinute = parseTimeToMinute(form.endTime);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) {
    return { error: 'End time must be after start time.' };
  }
  return {
    payload: {
      title,
      day_of_week: form.dayOfWeek,
      start_minute: startMinute,
      end_minute: endMinute,
      category: form.category,
      nudge_mode: form.nudgeMode,
      active: editing ? editing.active : true,
      notes: form.notes.trim() || null,
    },
  };
}

const GridBlockFormBody: React.FC<{
  form: GridBlockFormState;
  setForm: React.Dispatch<React.SetStateAction<GridBlockFormState>>;
  error: string | null;
  isEditing: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ form, setForm, error, isEditing, submitting, onClose, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {Boolean(error) && <AlertBanner variant="error">{error}</AlertBanner>}
    <FormField label="Block Title" htmlFor="grid-block-title" required>
      <TextInput id="grid-block-title" data-testid="grid-block-title-input" variant="blue" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Deep Work Sprint" required />
    </FormField>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Weekday" htmlFor="grid-block-day" required>
        <SelectInput id="grid-block-day" variant="blue" value={String(form.dayOfWeek)} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))} options={WEEKDAYS.map((d) => ({ value: String(d.dayOfWeek), label: d.label }))} />
      </FormField>
      <FormField label="Category" htmlFor="grid-block-category" required>
        <SelectInput id="grid-block-category" variant="blue" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Start" htmlFor="grid-block-start" required>
        <TextInput id="grid-block-start" variant="blue" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} required />
      </FormField>
      <FormField label="End" htmlFor="grid-block-end" required>
        <TextInput id="grid-block-end" variant="blue" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} required />
      </FormField>
    </div>
    <FormField label="Nudge Mode" htmlFor="grid-block-nudge">
      <SelectInput id="grid-block-nudge" variant="blue" value={form.nudgeMode} onChange={(e) => setForm((p) => ({ ...p, nudgeMode: e.target.value as NudgeMode }))} options={NUDGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))} />
    </FormField>
    <FormField label="Notes" htmlFor="grid-block-notes">
      <TextArea id="grid-block-notes" variant="blue" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional block intent" />
    </FormField>
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="secondary" size="sm" onClick={onClose} className="min-h-[44px] sm:min-h-[36px]">Cancel</Button>
      <Button type="submit" variant="blue" size="sm" loading={submitting} data-testid="grid-block-submit-btn" className="min-h-[44px] sm:min-h-[36px]">
        {isEditing ? 'Save Block' : 'Create Block'}
      </Button>
    </div>
  </form>
);

export const GridBlockModal: React.FC<GridBlockModalProps> = ({
  isOpen,
  defaultDayOfWeek,
  editing,
  error,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<GridBlockFormState>(() => buildInitialForm(defaultDayOfWeek, editing));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(defaultDayOfWeek, editing));
    setValidationError(null);
  }, [isOpen, defaultDayOfWeek, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateGridBlockForm(form, editing);
    if (!result.payload) {
      setValidationError(result.error ?? 'Invalid grid block input.');
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      await onSave(result.payload, editing?.id ?? null);
      onClose();
    } catch {
      /* Handled via mutationError state in useKairosSchedule */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Grid Block' : 'Add Weekly Grid Block'} subtitle="Define your recurring ideal week anchor." headerIcon={<LayoutGrid className="w-5 h-5 text-sky-400" />}>
      <GridBlockFormBody form={form} setForm={setForm} error={validationError || error} isEditing={Boolean(editing)} submitting={submitting} onClose={onClose} onSubmit={handleSubmit} />
    </Modal>
  );
};
