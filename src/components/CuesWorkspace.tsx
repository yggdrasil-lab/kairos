import React, { useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { AlertBanner, SegmentedControl } from '@yggdrasil-lab/ui';
import type { CuesSubTab, GridBlock, HabitCue } from '../domain/types';
import type { FrictionModalContext } from '../hooks/useCockpitModals';
import type { KairosCuesActions } from '../hooks/useKairosCues';
import { CueCatalogView } from './CueCatalogView';
import { WeeklyReflectionView } from './WeeklyReflectionView';

export interface CuesWorkspaceProps {
  cuesState: KairosCuesActions;
  weeklyGrid: GridBlock[];
  onAddCue: () => void;
  onEditCue: (cue: HabitCue) => void;
  onLogFriction: (context?: Partial<FrictionModalContext>) => void;
}

const CUES_SUBTABS: { id: CuesSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalog', label: 'Cue Catalog', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'reflection', label: 'Weekly Reflection', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const CuesWorkspace: React.FC<CuesWorkspaceProps> = ({
  cuesState,
  weeklyGrid,
  onAddCue,
  onEditCue,
  onLogFriction,
}) => {
  const [subTab, setSubTab] = useState<CuesSubTab>('catalog');

  return (
    <div data-testid="cues-workspace" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SegmentedControl
          options={CUES_SUBTABS}
          value={subTab}
          onChange={setSubTab}
          variant="brand"
          size="sm"
          idPrefix="cues-subtab"
        />
      </div>
      {Boolean(cuesState.cuesError) && (
        <AlertBanner variant="warning" title="Cues sync notice">
          {cuesState.cuesError}
        </AlertBanner>
      )}
      {subTab === 'catalog' ? (
        <CueCatalogView
          cues={cuesState.cues}
          weeklyGrid={weeklyGrid}
          passiveSignals={cuesState.passiveSignals}
          onAddCue={onAddCue}
          onEditCue={onEditCue}
          onToggleCueActive={(cue) => void cuesState.editCue(cue.id, { active: !cue.active })}
          onDeleteCue={(id) => void cuesState.removeCue(id)}
          onLogFriction={(ctx) => onLogFriction(ctx)}
          onDeleteFrictionNote={(id) => void cuesState.removeFrictionNote(id)}
        />
      ) : (
        <WeeklyReflectionView
          weekStart={cuesState.weekStart}
          reflection={cuesState.reflection}
          isLoading={cuesState.isLoadingReflection}
          onChangeWeekStart={cuesState.setWeekStart}
          onLogFriction={() => onLogFriction()}
          onDeleteFrictionNote={(id) => void cuesState.removeFrictionNote(id)}
        />
      )}
    </div>
  );
};
