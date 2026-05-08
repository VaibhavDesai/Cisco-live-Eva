import { useId, useState } from 'react';
import { Button, Icon, Radio, RadioGroup, Slider, Toggle } from '../momentum';
import { CreateCustomProfileDialog } from './CreateCustomProfileDialog';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import type {
  AdvancedRailMeta,
  AdvancedRailGroup,
  AdvancedRailState,
  DirectionOption,
  EnforcementMode,
  SensitivityLevel,
} from '../security-tab-data';
import { ADVANCED_RAIL_GROUPS } from '../security-tab-data';

const SENSITIVITY_STOPS: SensitivityLevel[] = ['low', 'medium', 'high'];

interface AdvancedGuardrailsPanelProps {
  rails: Record<string, AdvancedRailState>;
  onRailChange: (railId: string, next: AdvancedRailState) => void;
}

function advCategoryHeadingId(category: string): string {
  return `adv-cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function AdvancedGuardrailsPanel({ rails, onRailChange }: AdvancedGuardrailsPanelProps) {
  const createCustomProfileTriggerId = useId().replace(/:/g, '');
  const [createProfileOpen, setCreateProfileOpen] = useState(false);

  return (
    <div className="sec-tab__advanced">
      {ADVANCED_RAIL_GROUPS.map((group) => (
        <AdvancedCategorySection key={group.category} group={group} rails={rails} onRailChange={onRailChange} />
      ))}

      <div className="sec-tab__custom-profiles">
        <div className="sec-tab__custom-profiles-left">
          <div>
            <h3 className={`text-sm font-semibold ${ck.text}`}>Custom profiles</h3>
            <p className={`text-sm ${ck.textMuted}`}>
              Generate custom profiles tailored specifically to this agent's configuration and requirements.
            </p>
          </div>
        </div>
        <Button
          type="button"
          id={createCustomProfileTriggerId}
          color="default"
          variant="secondary"
          size={32}
          prefixIcon="plus-bold"
          onClick={() => setCreateProfileOpen(true)}
        >
          Create custom profile
        </Button>
      </div>

      <CreateCustomProfileDialog
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        triggerID={createCustomProfileTriggerId}
      />
    </div>
  );
}

interface AdvancedCategorySectionProps {
  group: AdvancedRailGroup;
  rails: Record<string, AdvancedRailState>;
  onRailChange: (railId: string, next: AdvancedRailState) => void;
}

function AdvancedCategorySection({ group, rails, onRailChange }: AdvancedCategorySectionProps) {
  const enabledCount = group.rails.filter((r) => rails[r.id]?.enabled).length;
  const headingId = advCategoryHeadingId(group.category);

  return (
    <section className="sec-tab__adv-category" aria-labelledby={headingId}>
      <div className="sec-tab__adv-category-head">
        <Icon name={group.icon} size={24} lengthUnit="px" aria-hidden />
        <h2 className={`sec-tab__adv-category-title ${ck.sectionHeading}`} id={headingId}>
          {group.category}
        </h2>
        <span className="sec-tab__badge">
          {enabledCount}/{group.rails.length}
        </span>
      </div>

      <div className="sec-tab__adv-rail-list">
        {group.rails.map((meta) => {
          const state = rails[meta.id];
          if (!state) return null;
          return (
            <AdvancedRailCard
              key={meta.id}
              meta={meta}
              state={state}
              onChange={(next) => onRailChange(meta.id, next)}
            />
          );
        })}
      </div>
    </section>
  );
}

interface AdvancedRailCardProps {
  meta: AdvancedRailMeta;
  state: AdvancedRailState;
  onChange: (next: AdvancedRailState) => void;
}

/** Same layout as `StandardRailCard`: header = toggle + title + description + chevron; body = slider + enforcement + direction. */
function AdvancedRailCard({ meta, state, onChange }: AdvancedRailCardProps) {
  const [expanded, setExpanded] = useState(false);
  const railHeadingId = `adv-rail-${meta.id}`;
  const controlsDisabled = !state.enabled;

  const setSensitivity = (sensitivity: SensitivityLevel) => onChange({ ...state, sensitivity });
  const setEnforcement = (enforcement: EnforcementMode) => onChange({ ...state, enforcement });
  const setDirection = (direction: DirectionOption) => onChange({ ...state, direction });

  return (
    <section className="sec-tab__rail-card" aria-labelledby={railHeadingId}>
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
              aria-label={`Enable ${meta.label}`}
              onChange={() => onChange({ ...state, enabled: !state.enabled })}
            />
          </span>
          <div>
            <h3 className={`sec-tab__rail-title ${ck.text}`} id={railHeadingId}>
              {meta.label}
            </h3>
            <p className={`sec-tab__rail-desc ${ck.textMuted}`}>{meta.description}</p>
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
              aria-label={`${meta.label} sensitivity`}
              disabled={controlsDisabled}
              onInput={(e: Event) =>
                setSensitivity(SENSITIVITY_STOPS[Number((e.target as HTMLInputElement).value)])
              }
            />
          </div>

          <div className="sec-tab__enforcement-row">
            <div className="sec-tab__radio-group-field">
              <RadioGroup name={`adv-enforce-${meta.id}`} label="Enforcement" disabled={controlsDisabled}>
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
              <RadioGroup name={`adv-direction-${meta.id}`} label="Direction" disabled={controlsDisabled}>
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
