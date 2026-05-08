import { useState } from 'react';
import { Icon, Radio, RadioGroup, Slider, Toggle } from '../momentum';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import type {
  DirectionOption,
  EnforcementMode,
  SensitivityLevel,
  StandardRailId,
  StandardRailState,
} from '../security-tab-data';
import { STANDARD_RAILS } from '../security-tab-data';

const SENSITIVITY_STOPS: SensitivityLevel[] = ['low', 'medium', 'high'];

interface StandardGuardrailsPanelProps {
  rails: Record<StandardRailId, StandardRailState>;
  onChange: (id: StandardRailId, next: StandardRailState) => void;
}

export function StandardGuardrailsPanel({ rails, onChange }: StandardGuardrailsPanelProps) {
  return (
    <div className="sec-tab__standard-list">
      {STANDARD_RAILS.map((meta) => {
        const state = rails[meta.id];
        return (
          <StandardRailCard
            key={meta.id}
            id={meta.id}
            label={meta.label}
            description={meta.description}
            state={state}
            onChange={(next) => onChange(meta.id, next)}
          />
        );
      })}
    </div>
  );
}

/* ── Single rail card ── */

interface StandardRailCardProps {
  id: StandardRailId;
  label: string;
  description: string;
  state: StandardRailState;
  onChange: (next: StandardRailState) => void;
}

function StandardRailCard({ id, label, description, state, onChange }: StandardRailCardProps) {
  const [expanded, setExpanded] = useState(false);
  const controlsDisabled = !state.enabled;

  const setSensitivity = (sensitivity: SensitivityLevel) =>
    onChange({ ...state, sensitivity });

  const setEnforcement = (enforcement: EnforcementMode) =>
    onChange({ ...state, enforcement });

  const setDirection = (direction: DirectionOption) => onChange({ ...state, direction });

  return (
    <section className="sec-tab__rail-card" aria-labelledby={`sec-rail-${id}`}>
      <button
        type="button"
        className="sec-tab__rail-header"
        aria-expanded={expanded}
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="sec-tab__rail-header-left">
          <span onClick={(e) => e.stopPropagation()}>
            <Toggle
              checked={state.enabled}
              aria-label={`Enable ${label}`}
              onChange={() => onChange({ ...state, enabled: !state.enabled })}
            />
          </span>
          <div>
            <h3 className={`sec-tab__rail-title ${ck.text}`} id={`sec-rail-${id}`}>{label}</h3>
            <p className={`sec-tab__rail-desc ${ck.textMuted}`}>{description}</p>
          </div>
        </div>
        <Icon
          name={expanded ? 'arrow-up-bold' : 'arrow-down-bold'}
          size={16}
          lengthUnit="px"
          className={ck.textMuted}
          aria-hidden
        />
      </button>

      {expanded && (
        <div
          className={`sec-tab__rail-body${controlsDisabled ? ' sec-tab__rail-body--controls-disabled' : ''}`}
          aria-disabled={controlsDisabled || undefined}
        >
          <div className="sec-tab__sensitivity">
            <Slider
              label="Sensitivity"
              min={0}
              max={2}
              step={1}
              value={SENSITIVITY_STOPS.indexOf(state.sensitivity)}
              labelStart="Low"
              labelEnd="High"
              aria-label={`${label} sensitivity`}
              disabled={controlsDisabled}
              onInput={(e: Event) => setSensitivity(SENSITIVITY_STOPS[Number((e.target as HTMLInputElement).value)])}
            />
          </div>

          <div className="sec-tab__enforcement-row">
            <div className="sec-tab__radio-group-field">
              <RadioGroup name={`sec-enforce-${id}`} label="Enforcement" disabled={controlsDisabled}>
                <Radio
                  value="monitor"
                  label="Monitor"
                  checked={state.enforcement === 'monitor'}
                  disabled={controlsDisabled}
                  onChange={() => setEnforcement('monitor')}
                />
                <Radio
                  value="block"
                  label="Block"
                  checked={state.enforcement === 'block'}
                  disabled={controlsDisabled}
                  onChange={() => setEnforcement('block')}
                />
              </RadioGroup>
            </div>
            <div className="sec-tab__radio-group-field">
              <RadioGroup name={`sec-direction-${id}`} label="Direction" disabled={controlsDisabled}>
                <Radio
                  value="prompt"
                  label="Prompt"
                  checked={state.direction === 'prompt'}
                  disabled={controlsDisabled}
                  onChange={() => setDirection('prompt')}
                />
                <Radio
                  value="response"
                  label="Response"
                  checked={state.direction === 'response'}
                  disabled={controlsDisabled}
                  onChange={() => setDirection('response')}
                />
              </RadioGroup>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
