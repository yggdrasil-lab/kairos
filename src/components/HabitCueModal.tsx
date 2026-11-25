import React, { useEffect, useState } from 'react';
import { Compass, History, Trash2 } from 'lucide-react';
import {
  AlertBanner,
  Button,
  ChipSelector,
  CollapsibleSection,
  FormField,
  Modal,
  SelectInput,
  StatusBadge,
  TextArea,
  TextInput,
} from '@yggdrasil-lab/ui';
import {
  formatBlockChipLabel,
  FRICTION_TAG_META,
  PASSIVE_RULE_OPTIONS,
} from '../domain/cues';
import type { FrictionNote, GridBlock, HabitCue, HabitCueCreate } from '../domain/types';

export interface HabitCueModalProps {
  isOpen: boolean;
  editing: HabitCue | null;
  weeklyGrid: GridBlock[];
  error: string | null;
  onClose: () => void;
  onSave: (payload: HabitCueCreate, editingId: number | null) => Promise<void>;
  onDelete?: (cueId: number) => Promise<void>;
}

interface HabitCueFormState {
  title: string;
  zoneChain: string;
  chainOrder: string;
  passiveRule: string;
  active: boolean;
  notes: string;
  gridBlockIds: string[];
}

function buildInitialForm(editing: HabitCue | null): HabitCueFormState {
  if (!editing) {
    return {
      title: '',
      zoneChain: '',
      chainOrder: '1',
      passiveRule: '',
      active: true,
      notes: '',
      gridBlockIds: [],
    };
  }
  return {
    title: editing.title,
    zoneChain: editing.zone_chain,
    chainOrder: String(editing.chain_order),
    passiveRule: editing.passive_rule ?? '',
    active: editing.active,
    notes: editing.notes ?? '',
    gridBlockIds: editing.grid_block_ids.map(String),
  };
}

function validateHabitCueForm(form: HabitCueFormState): { payload?: HabitCueCreate; error?: string } {
  const title = form.title.trim();
  if (!title) return { error: 'Cue title is required.' };
  const zoneChain = form.zoneChain.trim();
  if (!zoneChain) return { error: 'Zone chain is required.' };
  const parsedOrder = Number(form.chainOrder);
  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
    return { error: 'Chain order must be a whole number (1 or greater).' };
  }
  return {
    payload: {
      title,
      zone_chain: zoneChain,
      chain_order: parsedOrder,
      passive_rule: form.passiveRule.trim() || null,
      active: form.active,
      notes: form.notes.trim() || null,
      grid_block_ids: form.gridBlockIds.map(Number).filter((n) => !Number.isNaN(n)),
    },
  };
}

const CueRecentFrictionSection: React.FC<{ notes: FrictionNote[] }> = ({ notes }) => {
  if (notes.length === 0) return null;
  return (
    <CollapsibleSection
      title={`Recent Friction (${notes.length})`}
      icon={<History className="w-3.5 h-3.5 text-accent" />}
      variant="card"
      defaultOpen={false}
    >
      <div className="space-y-2">
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

const HabitCuePrimaryFields: React.FC<{
  form: HabitCueFormState;
  setForm: React.Dispatch<React.SetStateAction<HabitCueFormState>>;
}> = ({ form, setForm }) => (
  <>
    <FormField label="Cue Title" htmlFor="cue-title" required>
      <TextInput
        id="cue-title"
        data-testid="cue-title-input"
        variant="brand"
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        placeholder="e.g. Fill water bottle at counter"
        required
      />
    </FormField>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-2">
        <FormField label="Zone Chain" htmlFor="cue-zone-chain" required>
          <TextInput
            id="cue-zone-chain"
            data-testid="cue-zone-input"
            variant="brand"
            value={form.zoneChain}
            onChange={(e) => setForm((p) => ({ ...p, zoneChain: e.target.value }))}
            placeholder="e.g. Kitchen -> Desk"
            required
          />
        </FormField>
      </div>
      <FormField label="Chain Order" htmlFor="cue-chain-order" required>
        <TextInput
          id="cue-chain-order"
          data-testid="cue-order-input"
          variant="brand"
          type="number"
          min={1}
          value={form.chainOrder}
          onChange={(e) => setForm((p) => ({ ...p, chainOrder: e.target.value }))}
          required
        />
      </FormField>
    </div>
  </>
);

const HabitCueAnchorFields: React.FC<{
  form: HabitCueFormState;
  setForm: React.Dispatch<React.SetStateAction<HabitCueFormState>>;
  blockOptions: { value: string; label: string }[];
}> = ({ form, setForm, blockOptions }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Passive Signal (Optional)" htmlFor="cue-passive-rule">
        <SelectInput
          id="cue-passive-rule"
          variant="brand"
          value={form.passiveRule}
          onChange={(e) => setForm((p) => ({ ...p, passiveRule: e.target.value }))}
          options={PASSIVE_RULE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </FormField>
      <FormField label="Cue Visibility">
        <button
          type="button"
          data-testid="cue-active-toggle"
          onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
          className={`min-h-[44px] w-full rounded-xl border px-3 text-base sm:text-xs font-semibold transition-colors ${
            form.active
              ? 'bg-accent/20 border-accent/50 text-accent'
              : 'bg-background border-border text-slate-300 hover:border-slate-600'
          }`}
        >
          {form.active ? 'Active in Zone Chain' : 'Paused Cue'}
        </button>
      </FormField>
    </div>
    {blockOptions.length > 0 && (
      <FormField label="Anchored Weekly Blocks">
        <ChipSelector
          multiSelect
          variant="brand"
          size="sm"
          options={blockOptions}
          selectedValues={form.gridBlockIds}
          onChangeValues={(values) => setForm((p) => ({ ...p, gridBlockIds: values }))}
        />
      </FormField>
    )}
    <FormField label="Notes" htmlFor="cue-notes">
      <TextArea
        id="cue-notes"
        variant="brand"
        rows={2}
        value={form.notes}
        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        placeholder="Optional environment setup reminder"
      />
    </FormField>
  </>
);

const HabitCueFormBody: React.FC<{
  form: HabitCueFormState;
  setForm: React.Dispatch<React.SetStateAction<HabitCueFormState>>;
  weeklyGrid: GridBlock[];
  editing: HabitCue | null;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ form, setForm, weeklyGrid, editing, error, onSubmit }) => {
  const sortedBlocks = [...weeklyGrid].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_minute - b.start_minute
  );
  const blockOptions = sortedBlocks.map((block) => ({
    value: String(block.id),
    label: formatBlockChipLabel(block),
  }));

  return (
    <form id="habit-cue-form" onSubmit={onSubmit} className="space-y-4">
      {Boolean(error) && <AlertBanner variant="error">{error}</AlertBanner>}
      <HabitCuePrimaryFields form={form} setForm={setForm} />
      <HabitCueAnchorFields form={form} setForm={setForm} blockOptions={blockOptions} />
      {editing && <CueRecentFrictionSection notes={editing.recent_friction} />}
    </form>
  );
};

const HabitCueFooter: React.FC<{
  isEditing: boolean;
  submitting: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void;
}> = ({ isEditing, submitting, canDelete, onDelete, onClose }) => (
  <div className="flex items-center justify-between gap-2 w-full">
    <div>
      {isEditing && canDelete && (
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={submitting}
          data-testid="cue-delete-btn"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={onDelete}
          className="min-h-[44px] sm:min-h-[36px]"
        >
          Delete
        </Button>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={submitting}
        onClick={onClose}
        className="min-h-[44px] sm:min-h-[36px]"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="habit-cue-form"
        variant="brand"
        size="sm"
        loading={submitting}
        data-testid="cue-submit-btn"
        className="min-h-[44px] sm:min-h-[36px]"
      >
        {isEditing ? 'Save Cue' : 'Create Cue'}
      </Button>
    </div>
  </div>
);

export const HabitCueModal: React.FC<HabitCueModalProps> = ({
  isOpen,
  editing,
  weeklyGrid,
  error,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<HabitCueFormState>(() => buildInitialForm(editing));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(editing));
    setValidationError(null);
  }, [isOpen, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateHabitCueForm(form);
    if (!result.payload) {
      setValidationError(result.error ?? 'Invalid habit cue input.');
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      await onSave(result.payload, editing?.id ?? null);
      onClose();
    } catch {
      /* Handled via cueMutationError state */
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
      /* Handled via cueMutationError state */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Habit Cue' : 'Add Habit Cue'}
      subtitle="Anchor small physical cues to recurring weekly blocks."
      headerIcon={<Compass className="w-5 h-5 text-accent" />}
      footer={
        <HabitCueFooter
          isEditing={Boolean(editing)}
          submitting={submitting}
          canDelete={Boolean(onDelete)}
          onDelete={() => void handleDelete()}
          onClose={onClose}
        />
      }
    >
      <HabitCueFormBody
        form={form}
        setForm={setForm}
        weeklyGrid={weeklyGrid}
        editing={editing}
        error={validationError || error}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
