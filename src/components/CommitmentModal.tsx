import React, { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import {
  AlertBanner,
  Button,
  FormField,
  Modal,
  SelectInput,
  TextArea,
  TextInput,
} from '@yggdrasil-lab/ui';
import { minuteToTimeInput, NUDGE_OPTIONS, parseTimeToMinute } from '../domain/schedule';
import type { Commitment, CommitmentCreate, NudgeMode } from '../domain/types';

export interface CommitmentModalProps {
  isOpen: boolean;
  defaultDate: string;
  editing: Commitment | null;
  error: string | null;
  onClose: () => void;
  onSave: (payload: CommitmentCreate, editingId: number | null) => Promise<void>;
}

interface CommitmentFormState {
  title: string;
  targetDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  nudgeMode: NudgeMode;
  notes: string;
}

function buildInitialForm(defaultDate: string, editing: Commitment | null): CommitmentFormState {
  if (!editing) {
    return { title: '', targetDate: defaultDate, allDay: false, startTime: '10:00', endTime: '11:00', nudgeMode: 'boundary', notes: '' };
  }
  return {
    title: editing.title,
    targetDate: editing.target_date,
    allDay: editing.all_day,
    startTime: editing.start_minute !== null ? minuteToTimeInput(editing.start_minute) : '10:00',
    endTime: editing.end_minute !== null ? minuteToTimeInput(editing.end_minute) : '11:00',
    nudgeMode: editing.nudge_mode,
    notes: editing.notes ?? '',
  };
}

function validateCommitmentForm(form: CommitmentFormState): { payload?: CommitmentCreate; error?: string } {
  const title = form.title.trim();
  if (!title) return { error: 'Title is required.' };
  let startMinute: number | null = null;
  let endMinute: number | null = null;
  if (!form.allDay) {
    startMinute = parseTimeToMinute(form.startTime);
    endMinute = parseTimeToMinute(form.endTime);
    if (startMinute === null || endMinute === null || endMinute <= startMinute) {
      return { error: 'End time must be after start time.' };
    }
  }
  return {
    payload: {
      title,
      target_date: form.targetDate,
      all_day: form.allDay,
      start_minute: startMinute,
      end_minute: endMinute,
      nudge_mode: form.nudgeMode,
      notes: form.notes.trim() || null,
    },
  };
}

const CommitmentTimeFields: React.FC<{
  form: CommitmentFormState;
  setForm: React.Dispatch<React.SetStateAction<CommitmentFormState>>;
}> = ({ form, setForm }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Date" htmlFor="commitment-date" required>
        <TextInput id="commitment-date" data-testid="commitment-date-input" variant="blue" type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} required />
      </FormField>
      <FormField label="Schedule Type">
        <button
          type="button"
          data-testid="commitment-allday-toggle"
          onClick={() => setForm((p) => ({ ...p, allDay: !p.allDay }))}
          className={`min-h-[44px] w-full rounded-xl border px-3 text-base sm:text-xs font-semibold transition-colors ${
            form.allDay ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-background border-border text-slate-300 hover:border-slate-600'
          }`}
        >
          {form.allDay ? 'All-Day Commitment' : 'Timed Carve-Out'}
        </button>
      </FormField>
    </div>
    {!form.allDay && (
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start" htmlFor="commitment-start" required>
          <TextInput id="commitment-start" data-testid="commitment-start-input" variant="blue" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} required />
        </FormField>
        <FormField label="End" htmlFor="commitment-end" required>
          <TextInput id="commitment-end" data-testid="commitment-end-input" variant="blue" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} required />
        </FormField>
      </div>
    )}
  </>
);

const CommitmentFormBody: React.FC<{
  form: CommitmentFormState;
  setForm: React.Dispatch<React.SetStateAction<CommitmentFormState>>;
  error: string | null;
  isEditing: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ form, setForm, error, isEditing, submitting, onClose, onSubmit }) => (
  <form id="commitment-form" onSubmit={onSubmit} className="space-y-4">
    {Boolean(error) && <AlertBanner variant="error">{error}</AlertBanner>}
    <FormField label="Title" htmlFor="commitment-title" required>
      <TextInput id="commitment-title" data-testid="commitment-title-input" variant="blue" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Clinic Appointment" required />
    </FormField>
    <CommitmentTimeFields form={form} setForm={setForm} />
    <FormField label="Nudge Mode" htmlFor="commitment-nudge">
      <SelectInput id="commitment-nudge" variant="blue" value={form.nudgeMode} onChange={(e) => setForm((p) => ({ ...p, nudgeMode: e.target.value as NudgeMode }))} options={NUDGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))} />
    </FormField>
    <FormField label="Notes" htmlFor="commitment-notes">
      <TextArea id="commitment-notes" variant="blue" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional context or location" />
    </FormField>
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="secondary" size="sm" onClick={onClose} className="min-h-[44px] sm:min-h-[36px]">Cancel</Button>
      <Button type="submit" variant="blue" size="sm" loading={submitting} data-testid="commitment-submit-btn" className="min-h-[44px] sm:min-h-[36px]">
        {isEditing ? 'Save Changes' : 'Create Commitment'}
      </Button>
    </div>
  </form>
);

export const CommitmentModal: React.FC<CommitmentModalProps> = ({
  isOpen,
  defaultDate,
  editing,
  error,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CommitmentFormState>(() => buildInitialForm(defaultDate, editing));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(defaultDate, editing));
    setValidationError(null);
  }, [isOpen, defaultDate, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateCommitmentForm(form);
    if (!result.payload) {
      setValidationError(result.error ?? 'Invalid commitment input.');
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      await onSave(result.payload, editing?.id ?? null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Commitment' : 'Add Commitment'} subtitle="Dated commitments automatically carve recurring weekly blocks." headerIcon={<CalendarPlus className="w-5 h-5 text-sky-400" />}>
      <CommitmentFormBody form={form} setForm={setForm} error={validationError || error} isEditing={Boolean(editing)} submitting={submitting} onClose={onClose} onSubmit={handleSubmit} />
    </Modal>
  );
};
