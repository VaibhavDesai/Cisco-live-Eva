import { AccordionGroup, AccordionItem } from '../../components/shared/Accordion';
import Dropdown from '../../components/shared/Dropdown';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import { Slider } from '../../components/shared/Slider';
import Toggle from '../../components/shared/Toggle';
import { Tooltip } from '../../components/shared/Tooltip';
import { Icon } from '../../icons';

export type ConversationResponseStyle = 'active' | 'custom';

export interface ConversationConfigurationValue {
  language: string;
  voice: string;
  speakingRate: string;
  includeDisfluencies: boolean;
  allowInterrupt: boolean;
  endOfSpeechSensitivity: number;
  acknowledgementsEnabled: boolean;
  responseStyle: ConversationResponseStyle;
  acknowledgementStyle: string;
  acknowledgementFrequency: string;
  acknowledgementLength: string;
  customStylePrompt: string;
  customVocabulary: string;
  fulfilmentTimeout: string;
  callerTurnTimeout: string;
  noInputTimeout: string;
  slotFillingDelay: string;
  enableDtmf: boolean;
  dtmfDigitTimeout: string;
  terminationChar: string;
  dtmfMaxLength: string;
}

export const DEFAULT_CONVERSATION_CONFIGURATION: ConversationConfigurationValue = {
  language: 'en',
  voice: 'default',
  speakingRate: '1.0',
  includeDisfluencies: false,
  allowInterrupt: true,
  endOfSpeechSensitivity: 30,
  acknowledgementsEnabled: true,
  responseStyle: 'active',
  acknowledgementStyle: 'brief',
  acknowledgementFrequency: 'when-appropriate',
  acknowledgementLength: 'short',
  customStylePrompt: '',
  customVocabulary: '',
  fulfilmentTimeout: '30',
  callerTurnTimeout: '1500',
  noInputTimeout: '10',
  slotFillingDelay: '800',
  enableDtmf: true,
  dtmfDigitTimeout: '5',
  terminationChar: '#',
  dtmfMaxLength: '16',
};

interface ConversationConfigurationProps {
  value: ConversationConfigurationValue;
  onChange: (value: ConversationConfigurationValue) => void;
}

interface ConversationInfoFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  hint: string;
  info?: string;
  onChange: (value: string) => void;
}

function ConversationInfoField({
  id,
  label,
  value,
  placeholder,
  hint,
  info,
  onChange,
}: ConversationInfoFieldProps) {
  return (
    <div className="conversation-config__info-field">
      <div className="conversation-config__field-label-row">
        <label className="form-label" htmlFor={id}>
          {label} <span className="required">*</span>
        </label>
        {info && (
          <Tooltip content={info} placement="bottom">
            <button
              type="button"
              className="conversation-config__info-button"
              aria-label={`${label} information: ${info}`}
            >
              <Icon name="info-circle" weight="bold" size={16} />
            </button>
          </Tooltip>
        )}
      </div>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        hint={hint}
        required
        voiceInput={false}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default function ConversationConfiguration({
  value,
  onChange,
}: ConversationConfigurationProps) {
  const update = <Key extends keyof ConversationConfigurationValue>(
    key: Key,
    nextValue: ConversationConfigurationValue[Key],
  ) => onChange({ ...value, [key]: nextValue });

  return (
    <div className="conversation-config">
      <section className="conversation-config__section" aria-labelledby="conversation-language-title">
        <div className="conversation-config__section-heading">
          <h3 id="conversation-language-title">Language</h3>
          <p>Used for every channel, including voice, chat, and messaging.</p>
        </div>
        <Dropdown
          className="conversation-config__language-field"
          label="Language"
          required
          value={value.language}
          onChange={(nextValue) => update('language', nextValue)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
          ]}
        />
      </section>

      <section className="conversation-config__section" aria-labelledby="conversation-voice-title">
        <div className="conversation-config__section-heading">
          <h3 id="conversation-voice-title">Voice channel</h3>
          <p>
            The settings below apply only when customers talk to the agent by voice (for example on a phone call or in-app voice). They do not apply to chat, SMS, or other text channels.
          </p>
        </div>

        <AccordionGroup type="stack" className="conversation-config__accordions">
          <AccordionItem id="conversation-speaking-listening" title="Speaking and listening" defaultExpanded>
            <div className="conversation-config__field-stack">
              <Dropdown
                label="Select voice"
                required
                value={value.voice}
                onChange={(nextValue) => update('voice', nextValue)}
                options={[{ value: 'default', label: 'Default voice' }]}
              />
              <ConversationInfoField
                id="conversation-speaking-rate"
                label="Speaking rate"
                placeholder="1.0"
                value={value.speakingRate}
                info="1.0x is normal speed. Lower is slower, higher is faster."
                hint="Enter a value from 0.7x to 1.2x. This will override settings in Flow designer."
                onChange={(nextValue) => update('speakingRate', nextValue)}
              />
              <Toggle
                checked={value.includeDisfluencies}
                onChange={(event) => update('includeDisfluencies', event.target.checked)}
                label="Include disfluencies"
                helperText={'Adds fillers like "um" or "like" to sound more human'}
              />
              <Toggle
                checked={value.allowInterrupt}
                onChange={(event) => update('allowInterrupt', event.target.checked)}
                label="Allow customer to interrupt"
                helperText="When a customer speaks, the agent will stop talking. Turn off this setting to allow uninterrupted conversations."
              />
              <div className="conversation-config__slider-field">
                <Slider
                  label="End of speech sensitivity (milliseconds)"
                  aria-label="End of speech sensitivity in milliseconds"
                  min={0}
                  max={100}
                  value={value.endOfSpeechSensitivity}
                  onChange={(nextValue) => update('endOfSpeechSensitivity', Number(nextValue))}
                  minLabel="Aggressive"
                  maxLabel="Relaxed"
                  showValueLabels
                  showTooltip
                />
                <p>Choose how quickly the agent responds after the caller stops talking</p>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem id="conversation-acknowledgements" title="Acknowledgements" defaultExpanded>
            <div className="conversation-config__field-stack">
              <Toggle
                checked={value.acknowledgementsEnabled}
                onChange={(event) => update('acknowledgementsEnabled', event.target.checked)}
                label="Enable acknowledgements"
                helperText="When off, the agent skips acknowledgement phrases and responds directly."
              />
              {value.acknowledgementsEnabled && (
                <>
                  <RadioGroup
                    name="conversation-response-style"
                    label="Acknowledgement mode"
                    value={value.responseStyle}
                    onChange={(nextValue) => update('responseStyle', nextValue as ConversationResponseStyle)}
                  >
                    <Radio
                      value="active"
                      label={'Active - quick acknowledgements (eg. "I understand your response") before substantive response'}
                    />
                    <Radio
                      value="custom"
                      label="Custom - enter custom guidelines for how to acknowledge messages"
                    />
                  </RadioGroup>

                  {value.responseStyle === 'custom' ? (
                    <Textarea
                      label="Custom style prompt"
                      placeholder="Enter guidelines for how to acknowledge messages (subject to validation)"
                      value={value.customStylePrompt}
                      rows={5}
                      maxLength={2000}
                      showCharCount
                      voiceInput={false}
                      hint="Submissions are scanned for policy abuse and jailbreak attempts; invalid content may be rejected."
                      onChange={(event) => update('customStylePrompt', event.target.value)}
                    />
                  ) : (
                    <div className="conversation-config__field-stack">
                      <Dropdown
                        label="Style"
                        value={value.acknowledgementStyle}
                        onChange={(nextValue) => update('acknowledgementStyle', nextValue)}
                        hint="How acknowledgements should sound when using Active acknowledgement mode."
                        options={[
                          { value: 'brief', label: 'Brief' },
                          { value: 'empathetic', label: 'Empathetic' },
                          { value: 'conversational', label: 'Conversational' },
                          { value: 'formal', label: 'Formal' },
                        ]}
                      />
                      <Dropdown
                        label="Frequency"
                        value={value.acknowledgementFrequency}
                        onChange={(nextValue) => update('acknowledgementFrequency', nextValue)}
                        hint="When to emit acknowledgements relative to the conversation flow."
                        options={[
                          { value: 'always', label: 'Always' },
                          { value: 'never', label: 'Never' },
                          { value: 'fulfilment', label: 'Only during fulfilment' },
                          { value: 'when-appropriate', label: 'When appropriate' },
                        ]}
                      />
                      <Dropdown
                        label="Length"
                        value={value.acknowledgementLength}
                        onChange={(nextValue) => update('acknowledgementLength', nextValue)}
                        hint="How long acknowledgements should be when they are generated."
                        options={[
                          { value: 'very-short', label: 'Very short' },
                          { value: 'short', label: 'Short' },
                          { value: 'medium', label: 'Medium' },
                        ]}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </AccordionItem>

          <AccordionItem id="conversation-vocabulary" title="Vocabulary" defaultExpanded>
            <Textarea
              label="Custom vocabulary"
              placeholder="Enter words or phrases separated by commas"
              value={value.customVocabulary}
              voiceInput={false}
              hint="Improve recognition for names, terms, or industry-specific phrases. Enter up to 100 words or phrases, separated by a comma."
              onChange={(event) => update('customVocabulary', event.target.value)}
            />
          </AccordionItem>

          <AccordionItem id="conversation-voice-delays" title="Voice delays and timeouts" defaultExpanded>
            <div className="conversation-config__field-stack">
              <ConversationInfoField
                id="conversation-fulfilment-timeout"
                label="Fulfilment timeout (seconds)"
                placeholder="30"
                value={value.fulfilmentTimeout}
                info="Sets a time limit for task execution and forcibly stops that task"
                hint="Enter a value from 10 to 30"
                onChange={(nextValue) => update('fulfilmentTimeout', nextValue)}
              />
              <ConversationInfoField
                id="conversation-caller-turn-timeout"
                label="Caller turn timeout (milliseconds)"
                placeholder="1500"
                value={value.callerTurnTimeout}
                info="How long to wait before checking if the caller has finished their turn"
                hint="Enter a value from 750 to 3000"
                onChange={(nextValue) => update('callerTurnTimeout', nextValue)}
              />
              <ConversationInfoField
                id="conversation-no-input-timeout"
                label="No-input timeout (seconds)"
                placeholder="10"
                value={value.noInputTimeout}
                info="Sets the maximum time to wait for user input before the system assumes no response."
                hint="Enter a value from 10 to 30"
                onChange={(nextValue) => update('noInputTimeout', nextValue)}
              />
              <ConversationInfoField
                id="conversation-slot-filling-delay"
                label="Additional delay for slot filling (milliseconds)"
                placeholder="800"
                value={value.slotFillingDelay}
                info="Adds extra time after spoken numbers, email addresses, etc. to avoid cutoff or misrecognition."
                hint="Enter a value from 500 to 2000"
                onChange={(nextValue) => update('slotFillingDelay', nextValue)}
              />
            </div>
          </AccordionItem>

          <AccordionItem id="conversation-dtmf" title="DTMF" defaultExpanded>
            <div className="conversation-config__field-stack">
              <Toggle
                checked={value.enableDtmf}
                onChange={(event) => update('enableDtmf', event.target.checked)}
                label="Enable DTMF"
              />
              {value.enableDtmf && (
                <>
                  <ConversationInfoField
                    id="conversation-dtmf-digit-timeout"
                    label="Timeout between digits (seconds)"
                    placeholder="5"
                    value={value.dtmfDigitTimeout}
                    info="How long to wait when digits are being entered for the next digit"
                    hint="Enter a value from 2 to 10"
                    onChange={(nextValue) => update('dtmfDigitTimeout', nextValue)}
                  />
                  <ConversationInfoField
                    id="conversation-dtmf-termination-character"
                    label="Termination character"
                    placeholder="#"
                    value={value.terminationChar}
                    info="Character used to signal end of DTMF input"
                    hint="Character must be # or *"
                    onChange={(nextValue) => update('terminationChar', nextValue)}
                  />
                  <ConversationInfoField
                    id="conversation-dtmf-max-length"
                    label="Max length (characters)"
                    placeholder="16"
                    value={value.dtmfMaxLength}
                    hint="Enter a value from 8 to 32"
                    onChange={(nextValue) => update('dtmfMaxLength', nextValue)}
                  />
                </>
              )}
            </div>
          </AccordionItem>
        </AccordionGroup>
      </section>
    </div>
  );
}
