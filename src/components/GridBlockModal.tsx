import React, { useEffect, useState } from 'react';
import { History, LayoutGrid, Trash2 } from 'lucide-react';
import {
  AlertBanner,
  Button,
  CollapsibleSection,
  FormField,
  Modal,
  SelectInput,
  StatusBadge,
  TextArea,
  TextInput,
} from '@yggdrasil-lab/ui';
import { FRICTION_TAG_META } from '../domain/cues';
import {
  CATEGORY_OPTIONS,
  minuteToTimeInput,
  NUDGE_OPTIONS,
  parseTimeToMinute,
  WEEKDAYS,
} from '../domain/schedule';
import type { FrictionNote, GridBlock, GridBlockCreate, NudgeMode } from '../domain/types';

export interface GridBlockModalProps {
  isOpen: boolean;
  defaultDayOfWeek: number;
  defaultStartMinute?: number;
  defaultEndMinute?: number;
  editing: GridBlock | null;
  recentFriction?: FrictionNote[];
  error: string | null;
  onClose: () => void;
  onSave: (payload: GridBlockCreate, editingId: number | null) => Promise<void>;
  onDelete?: (blockId: number) => Promise<void>;
}

interface GridBlockFormState {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  category: string;
  nudgeMode: NudgeMode;
  flexible: boolean;
  active: boolean;
  notes: string;
}

function buildInitialForm(
  defaultDayOfWeek: number,
  defaultStartMinute: number,
  defaultEndMinute: number,
  editing: GridBlock | null
): GridBlockFormState {
  if (!editing) {
    return {
      title: '',
      dayOfWeek: defaultDayOfWeek,
      startTime: minuteToTimeInput(defaultStartMinute),
      endTime: minuteToTimeInput(defaultEndMinute),
      category: 'deep_work',
      nudgeMode: 'two-stage',
      flexible: false,
      active: true,
      notes: '',
    };
  }
  return {
    title: editing.title,
    dayOfWeek: editing.day_of_week,
    startTime: minuteToTimeInput(editing.start_minute),
    endTime: minuteToTimeInput(editing.end_minute),
    category: editing.category,
    nudgeMode: editing.nudge_mode,
    flexible: editing.flexible,
    active: editing.active,
    notes: editing.notes ?? '',
  };
}

function validateGridBlockForm(form: GridBlockFormState): { payload?: GridBlockCreate; error?: string } {
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
      flexible: form.flexible,
      active: form.active,
      notes: form.notes.trim() || null,
    },
  };
}

const BlockRecentFrictionHints: React.FC<{ notes: FrictionNote[] }> = ({ notes }) => {
  if (notes.length === 0) return null;
  return (
    <CollapsibleSection
      title={`Recent Friction (${notes.length})`}
      icon={<History className="w-3.5 h-3.5 text-accent" />}
      variant="card"
      defaultOpen={false}
    >
      <div data-testid="grid-block-recent-friction" className="space-y-2">
        {notes.slice(0, 5).map((item) => {
          const meta = FRICTION_TAG_META[item.tag];
          return (
            <div key={item.id} className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge label={meta.label} variant={meta.badgeVariant} size="xs" />
                <span className="text-[11px] font-mono text-slate-400">{item.target_date}</span>
              </div>
              <p className="text-xs text-slate-200">{item.note}</p>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

const GridBlockFormBody: React.FC<{
  form: GridBlockFormState;
  setForm: React.Dispatch<React.SetStateAction<GridBlockFormState>>;
  error: string | null;
  isEditing: boolean;
  recentFriction: FrictionNote[];
  onSubmit: (e: React.FormEvent) => void;
}> = ({ form, setForm, error, isEditing, recentFriction, onSubmit }) => (
  <form id="grid-block-form" onSubmit={onSubmit} className="space-y-4">
    {Boolean(error) && <AlertBanner variant="error">{error}</AlertBanner>}
    <FormField label="Block Title" htmlFor="grid-block-title" required>
      <TextInput id="grid-block-title" data-testid="grid-block-title-input" variant="brand" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Deep Work Sprint" required />
    </FormField>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Weekday" htmlFor="grid-block-day" required>
        <SelectInput id="grid-block-day" variant="brand" value={String(form.dayOfWeek)} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))} options={WEEKDAYS.map((d) => ({ value: String(d.dayOfWeek), label: d.label }))} />
      </FormField>
      <FormField label="Category" htmlFor="grid-block-category" required>
        <SelectInput id="grid-block-category" variant="brand" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} />
      </FormField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Start" htmlFor="grid-block-start" required>
        <TextInput id="grid-block-start" data-testid="grid-block-start-input" variant="brand" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} required />
      </FormField>
      <FormField label="End" htmlFor="grid-block-end" required>
        <TextInput id="grid-block-end" data-testid="grid-block-end-input" variant="brand" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} required />
      </FormField>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Nudge Mode" htmlFor="grid-block-nudge">
        <SelectInput id="grid-block-nudge" variant="brand" value={form.nudgeMode} onChange={(e) => setForm((p) => ({ ...p, nudgeMode: e.target.value as NudgeMode }))} options={NUDGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))} />
      </FormField>
      <FormField label="Extend Behavior">
        <button
          type="button"
          data-testid="grid-block-flexible-toggle"
          aria-pressed={form.flexible}
          onClick={() => setForm((p) => ({ ...p, flexible: !p.flexible }))}
          className={`min-h-[44px] w-full rounded-xl border px-3 text-base sm:text-xs font-semibold transition-colors ${
            form.flexible ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-background border-border text-slate-300 hover:border-slate-600'
          }`}
        >
          {form.flexible ? 'Flexible (Trim on Extend)' : 'Fixed Anchor'}
        </button>
      </FormField>
    </div>
    {isEditing && (
      <FormField label="Schedule Status">
        <button
          type="button"
          data-testid="grid-block-active-toggle"
          aria-pressed={form.active}
          onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
          className={`min-h-[44px] w-full rounded-xl border px-3 text-base sm:text-xs font-semibold transition-colors ${
            form.active
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : 'bg-background border-border text-slate-400 hover:border-slate-600'
          }`}
        >
          {form.active ? 'Active in Weekly Grid' : 'Paused (Inactive)'}
        </button>
      </FormField>
    )}
    <FormField label="Notes" htmlFor="grid-block-notes">
      <TextArea id="grid-block-notes" variant="brand" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional block intent" />
    </FormField>
    {isEditing && <BlockRecentFrictionHints notes={recentFriction} />}
  </form>
);

const GridBlockFooter: React.FC<{
  isEditing: boolean;
  submitting: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void;
}> = ({ isEditing, submitting, canDelete, onDelete, onClose }) => (
  <div className="flex items-center justify-between gap-2 w-full">
    <div>
      {isEditing && canDelete && (
        <Button type="button" variant="danger" size="sm" disabled={submitting} data-testid="grid-block-delete-btn" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} className="min-h-[44px] sm:min-h-[36px]">
          Delete
        </Button>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" size="sm" disabled={submitting} onClick={onClose} className="min-h-[44px] sm:min-h-[36px]">
        Cancel
      </Button>
      <Button type="submit" form="grid-block-form" variant="brand" size="sm" loading={submitting} data-testid="grid-block-submit-btn" className="min-h-[44px] sm:min-h-[36px]">
        {isEditing ? 'Save Block' : 'Create Block'}
      </Button>
    </div>
  </div>
);

export const GridBlockModal: React.FC<GridBlockModalProps> = ({
  isOpen,
  defaultDayOfWeek,
  defaultStartMinute = 540,
  defaultEndMinute = 660,
  editing,
  recentFriction = [],
  error,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<GridBlockFormState>(() =>
    buildInitialForm(defaultDayOfWeek, defaultStartMinute, defaultEndMinute, editing)
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(defaultDayOfWeek, defaultStartMinute, defaultEndMinute, editing));
    setValidationError(null);
  }, [isOpen, defaultDayOfWeek, defaultStartMinute, defaultEndMinute, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateGridBlockForm(form);
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

  const handleDelete = async () => {
    if (!editing || !onDelete) return;
    setSubmitting(true);
    try {
      await onDelete(editing.id);
      onClose();
    } catch {
      /* Handled via mutationError state in useKairosSchedule */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Grid Block' : 'Add Weekly Grid Block'}
      subtitle="Define your recurring ideal week anchor."
      headerIcon={<LayoutGrid className="w-5 h-5 text-accent" />}
      footer={
        <GridBlockFooter
          isEditing={Boolean(editing)}
          submitting={submitting}
          canDelete={Boolean(onDelete)}
          onDelete={() => void handleDelete()}
          onClose={onClose}
        />
      }
    >
      <GridBlockFormBody
        form={form}
        setForm={setForm}
        error={validationError || error}
        isEditing={Boolean(editing)}
        recentFriction={recentFriction}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
