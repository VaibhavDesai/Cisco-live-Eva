import { useEffect, useRef, useState } from 'react';
import Button from '../../components/shared/Button';
import { Icon } from '../../icons';
import type { IconName } from '../../icons/types';
import {
  FEEDBACK360_KNOWLEDGE_SOURCES,
  FEEDBACK360_RECOMMENDED_ACTIONS,
  FEEDBACK360_SOURCE_CHECKS,
  type Feedback360Answers,
  type Feedback360Channel,
  type Feedback360ConversationStep,
} from './feedback360Conversation';
import './Feedback360ConversationCard.css';

export interface Feedback360ConversationCardProps {
  step: Feedback360ConversationStep;
  answers: Feedback360Answers;
  onReply: (value: string) => void;
  /** Historical assistant turns keep their content visible without live controls. */
  isActive?: boolean;
}

const CHANNELS: { value: Feedback360Channel; label: string; icon: IconName }[] = [
  { value: 'voice', label: 'Voice', icon: 'phone' },
  { value: 'digital', label: 'Digital', icon: 'chat' },
  { value: 'video', label: 'Video', icon: 'video' },
];

const KNOWLEDGE_ICONS: IconName[] = ['people', 'files', 'document', 'people'];
const ACTION_ICONS: IconName[] = ['document', 'alert', 'chat', 'email', 'alarm'];

function selectedOptionReply(selected: string[], skipLabel: string): string {
  return selected.length ? selected.join(', ') : skipLabel;
}

function ChoiceTiles({
  items,
  selected,
  icons,
  active,
  onToggle,
  ariaLabel,
}: {
  items: readonly string[];
  selected: string[];
  icons: IconName[];
  active: boolean;
  onToggle: (item: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="feedback360-card__choice-grid" role="group" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const checked = selected.includes(item);
        return (
          <button
            type="button"
            key={item}
            className={`feedback360-card__choice${checked ? ' feedback360-card__choice--selected' : ''}`}
            aria-pressed={checked}
            disabled={!active}
            onClick={() => onToggle(item)}
          >
            <span className="feedback360-card__choice-icon" aria-hidden="true">
              <Icon name={icons[index] ?? 'files'} weight="regular" size={23} />
            </span>
            <span className="feedback360-card__choice-label">{item}</span>
            <Icon
              className="feedback360-card__choice-check"
              name={checked ? 'check-circle-filled' : 'check-circle'}
              weight="bold"
              size={18}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function Feedback360ConversationCard({
  step,
  answers,
  onReply,
  isActive = true,
}: Feedback360ConversationCardProps) {
  const replyRef = useRef(onReply);
  const [sourceProgress, setSourceProgress] = useState(0);
  const [channels, setChannels] = useState<Feedback360Channel[]>(answers.channels);
  const [knowledge, setKnowledge] = useState<string[]>(answers.knowledgeSources);
  const [actions, setActions] = useState<string[]>(answers.actions);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(answers.name);
  const [editingWelcome, setEditingWelcome] = useState(false);
  const [welcome, setWelcome] = useState(answers.welcomeMessage);

  useEffect(() => { replyRef.current = onReply; }, [onReply]);

  useEffect(() => {
    if (step !== 'sources' || !isActive) return;
    const timeouts = [360, 760, 1160].map((delay, index) =>
      window.setTimeout(() => setSourceProgress(index + 1), delay));
    timeouts.push(window.setTimeout(() => replyRef.current('Use recommended'), 2050));
    return () => timeouts.forEach(window.clearTimeout);
  }, [step, isActive]);

  if (step === 'complete') return null;

  if (step === 'sources') {
    const visibleCount = isActive ? sourceProgress : FEEDBACK360_SOURCE_CHECKS.length;
    return (
      <section className="feedback360-card feedback360-card--sources" aria-label="Recommended source checks">
        <div className="feedback360-card__eyebrow">
          <Icon name="sparkle" weight="bold" size={15} />
          Recommended source checks
        </div>
        <div className="feedback360-card__source-list">
          {FEEDBACK360_SOURCE_CHECKS.map((source, index) => (
            <div
              key={source}
              className={`feedback360-card__source-row${index < visibleCount ? ' feedback360-card__source-row--visible' : ''}`}
            >
              <span className="feedback360-card__source-status" aria-hidden="true">
                <Icon
                  name={index < visibleCount ? 'check-circle-filled' : 'check-circle'}
                  weight="bold"
                  size={16}
                />
              </span>
              <span className="feedback360-card__source-copy">
                <strong>{source}</strong>
                <small>{index < visibleCount ? 'Added to setup plan' : 'Preparing recommendation'}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="feedback360-card__footnote" aria-live="polite">
          {visibleCount < FEEDBACK360_SOURCE_CHECKS.length
            ? 'Preparing source recommendations…'
            : 'These checks are planned. No live HR or review systems have been accessed.'}
        </p>
      </section>
    );
  }

  if (step === 'channels') {
    return (
      <section className="feedback360-card feedback360-card--channels" aria-label="Planned channels">
        <div className="feedback360-card__channel-grid" role="group" aria-label="Select channels">
          {CHANNELS.map(channel => {
            const checked = channels.includes(channel.value);
            return (
              <button
                type="button"
                key={channel.value}
                className={`feedback360-card__channel${checked ? ' feedback360-card__channel--selected' : ''}`}
                aria-pressed={checked}
                disabled={!isActive}
                onClick={() => setChannels(current => checked
                  ? current.filter(value => value !== channel.value)
                  : [...current, channel.value])}
              >
                <Icon
                  className="feedback360-card__channel-check"
                  name={checked ? 'check-circle-filled' : 'check-circle'}
                  weight="bold"
                  size={19}
                />
                <Icon name={channel.icon} weight="regular" size={24} />
                <span>{channel.label}</span>
              </button>
            );
          })}
        </div>
        {isActive && (
          <div className="feedback360-card__footer">
            <Button
              size="sm"
              disabled={channels.length === 0}
              onClick={() => onReply(CHANNELS.filter(channel => channels.includes(channel.value)).map(channel => channel.label).join(', '))}
            >
              Continue with selected channels
            </Button>
          </div>
        )}
        <p className="feedback360-card__footnote">Selected channels are part of the draft plan. Connections are set up later.</p>
      </section>
    );
  }

  if (step === 'name') {
    return (
      <section className="feedback360-card feedback360-card--compact" aria-label="Agent name">
        <div className="feedback360-card__eyebrow">
          <Icon name="sparkle" weight="bold" size={15} />
          Suggested name
        </div>
        {editingName && isActive ? (
          <div className="feedback360-card__inline-edit">
            <input
              type="text"
              value={name}
              maxLength={100}
              aria-label="Agent name"
              onChange={event => setName(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && name.trim()) onReply(name.trim());
              }}
            />
            <Button size="sm" disabled={!name.trim()} onClick={() => onReply(name.trim())}>Use name</Button>
          </div>
        ) : (
          <div className="feedback360-card__inline-actions">
            <button type="button" className="feedback360-card__pill" disabled={!isActive} onClick={() => onReply(answers.name)}>
              {answers.name}
            </button>
            {isActive && (
              <Button size="sm" variant="secondary" onClick={() => setEditingName(true)}>
                <Icon name="edit" weight="regular" size={14} />
                Type a different name
              </Button>
            )}
          </div>
        )}
      </section>
    );
  }

  if (step === 'welcome') {
    return (
      <section className="feedback360-card feedback360-card--welcome" aria-label="Suggested welcome message">
        <div className="feedback360-card__eyebrow">
          <Icon name="sparkle" weight="bold" size={15} />
          Suggested welcome message
        </div>
        {editingWelcome && isActive ? (
          <textarea
            value={welcome}
            maxLength={600}
            rows={4}
            aria-label="Edit welcome message"
            onChange={event => setWelcome(event.target.value)}
          />
        ) : (
          <p className="feedback360-card__welcome-text">{isActive ? welcome : answers.welcomeMessage}</p>
        )}
        {isActive && (
          <div className="feedback360-card__footer">
            <Button
              size="sm"
              disabled={!welcome.trim()}
              onClick={() => onReply(editingWelcome ? welcome.trim() : 'Use suggested welcome message')}
            >
              Use greeting
            </Button>
            {!editingWelcome && (
              <Button size="sm" variant="secondary" onClick={() => setEditingWelcome(true)}>
                <Icon name="edit" weight="regular" size={14} />
                Edit greeting
              </Button>
            )}
          </div>
        )}
      </section>
    );
  }

  if (step === 'knowledge' || step === 'actions') {
    const isKnowledge = step === 'knowledge';
    const options = isKnowledge ? FEEDBACK360_KNOWLEDGE_SOURCES : FEEDBACK360_RECOMMENDED_ACTIONS;
    const selected = isKnowledge ? knowledge : actions;
    const update = isKnowledge ? setKnowledge : setActions;
    const label = isKnowledge ? 'Recommended knowledge bases' : 'Recommended actions';
    return (
      <section className="feedback360-card feedback360-card--recommendations" aria-label={label}>
        <div className="feedback360-card__eyebrow">
          <Icon name="sparkle" weight="bold" size={15} />
          {label}
        </div>
        <ChoiceTiles
          items={options}
          selected={selected}
          icons={isKnowledge ? KNOWLEDGE_ICONS : ACTION_ICONS}
          active={isActive}
          ariaLabel={label}
          onToggle={item => update(current => current.includes(item)
            ? current.filter(value => value !== item)
            : [...current, item])}
        />
        {isActive && (
          <div className="feedback360-card__footer">
            <Button
              size="sm"
              onClick={() => onReply(selectedOptionReply(selected, isKnowledge ? 'Skip knowledge for now' : 'Skip actions for now'))}
            >
              Continue with {selected.length} {isKnowledge ? 'knowledge' : 'action'} recommendation{selected.length === 1 ? '' : 's'}
            </Button>
          </div>
        )}
        <p className="feedback360-card__footnote">Recommendations only. Connect and review these capabilities before use.</p>
      </section>
    );
  }

  if (step === 'phone') {
    return (
      <section className="feedback360-card feedback360-card--compact" aria-label="Phone number preference">
        <div className="feedback360-card__eyebrow">
          <Icon name="phone" weight="regular" size={15} />
          Phone number preference
        </div>
        <p className="feedback360-card__welcome-text">{answers.phoneNumberPreference || 'No Preference'}</p>
        <div className="feedback360-card__inline-actions">
          <button
            type="button"
            className="feedback360-card__pill"
            disabled={!isActive}
            onClick={() => onReply(answers.phoneNumberPreference || 'No Preference')}
          >
            Keep this preference
          </button>
        </div>
        <p className="feedback360-card__footnote">A number can be chosen after the draft is created.</p>
      </section>
    );
  }

  return (
    <section className="feedback360-card feedback360-card--compact" aria-label="Create agent draft">
      <div className="feedback360-card__eyebrow">
        <Icon name="sparkle" weight="bold" size={15} />
        Ready to create a draft
      </div>
      <p className="feedback360-card__review-text">Review and connect the planned sources, channels, knowledge, actions, and phone number in AI Agent Studio before use.</p>
      {isActive && <div className="feedback360-card__footer"><Button size="sm" onClick={() => onReply('Create Agent')}>Create Agent</Button></div>}
    </section>
  );
}
