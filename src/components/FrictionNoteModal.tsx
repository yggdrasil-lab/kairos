import React, { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import {
  AlertBanner,
  Button,
  FormField,
  Modal,
  OptionCardGroup,
  TextInput,
} from '@yggdrasil-lab/ui';
import { FRICTION_TAG_OPTIONS } from '../domain/cues';
import type { FrictionNoteCreate, FrictionTag } from '../domain/types';
import type { FrictionModalContext } from '../hooks/useCockpitModals';

export interface FrictionNoteModalProps {
  isOpen: boolean;
  defaultDate: string;
  context: FrictionModalContext | null;
  error: string | null;
  onClose: () => void;
  onSave: (payload: FrictionNoteCreate) => Promise<void>;
}

const ContextSummaryBanner: React.FC<{ context: FrictionModalContext | null }> = ({ context }) => {
  if (!context || (!context.cueTitle && !context.blockTitle)) {
    return null;
  }
  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-slate-200 space-y-0.5">
      {Boolean(context.cueTitle) && (
        <div>
          <span className="text-slate-400">Cue: </span>
          <span className="font-semibold">{context.cueTitle}</span>
        </div>
      )}
      {Boolean(context.blockTitle) && (
        <div>
          <span className="text-slate-400">Block: </span>
          <span className="font-semibold">{context.blockTitle}</span>
        </div>
      )}
    </div>
  );
};

const FrictionNoteFooter: React.FC<{
  submitting: boolean;
  onClose: () => void;
}> = ({ submitting, onClose }) => (
  <div className="flex items-center justify-end gap-2 w-full">
    <Button type="button" variant="secondary" size="sm" disabled={submitting} onClick={onClose} className="min-h-[44px] sm:min-h-[36px]">
      Cancel
    </Button>
    <Button type="submit" form="friction-note-form" variant="blue" size="sm" loading={submitting} data-testid="friction-submit-btn" className="min-h-[44px] sm:min-h-[36px]">
      Save Note
    </Button>
  </div>
);

const FrictionNoteFormBody: React.FC<{
  context: FrictionModalContext | null;
  error: string | null;
  tag: FrictionTag;
  note: string;
  targetDate: string;
  onChangeTag: (tag: FrictionTag) => void;
  onChangeNote: (note: string) => void;
  onChangeDate: (date: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ context, error, tag, note, targetDate, onChangeTag, onChangeNote, onChangeDate, onSubmit }) => (
  <form id="friction-note-form" onSubmit={onSubmit} className="space-y-4">
    {Boolean(error) && <AlertBanner variant="error">{error}</AlertBanner>}
    <ContextSummaryBanner context={context} />
    <OptionCardGroup<FrictionTag>
      label="What happened?"
      value={tag}
      onChange={onChangeTag}
      options={FRICTION_TAG_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        accent: opt.cardAccent,
      }))}
    />
    <FormField label="1-Line Observation" htmlFor="friction-note-input" required>
      <TextInput id="friction-note-input" data-testid="friction-note-input" variant="blue" value={note} onChange={(e) => onChangeNote(e.target.value)} placeholder="e.g. Bottle was still in the dishwasher" required />
    </FormField>
    <FormField label="Date" htmlFor="friction-date-input">
      <TextInput id="friction-date-input" variant="blue" type="date" value={targetDate} onChange={(e) => onChangeDate(e.target.value)} />
    </FormField>
  </form>
);

export const FrictionNoteModal: React.FC<FrictionNoteModalProps> = ({
  isOpen,
  defaultDate,
  context,
  error,
  onClose,
  onSave,
}) => {
  const [tag, setTag] = useState<FrictionTag>('trigger_missed');
  const [note, setNote] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(defaultDate);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setTag('trigger_missed');
    setNote('');
    setTargetDate(defaultDate);
    setValidationError(null);
  }, [isOpen, defaultDate, context]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setValidationError('Please add a brief 1-line observation.');
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      await onSave({ target_date: targetDate, tag, note: trimmed, habit_cue_id: context?.habitCueId ?? null, grid_block_id: context?.gridBlockId ?? null });
      onClose();
    } catch {
      /* Handled via cueMutationError state */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Friction Observation"
      subtitle="Capture what got in the way so Sunday reflection stays factual and calm."
      headerIcon={<MessageSquarePlus className="w-5 h-5 text-sky-400" />}
      footer={<FrictionNoteFooter submitting={submitting} onClose={onClose} />}
    >
      <FrictionNoteFormBody context={context} error={validationError || error} tag={tag} note={note} targetDate={targetDate} onChangeTag={setTag} onChangeNote={setNote} onChangeDate={setTargetDate} onSubmit={handleSubmit} />
    </Modal>
  );
};
