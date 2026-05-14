import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AgentHeader } from '../../components/agents';
import { Badge, Button, Card, CardBody, CardHeader, Divider, Modal, ModalBody, ModalHeader, TextLink } from '../../components/shared';
import { useApp, type Agent } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import { getElevenLabsConversationSignedUrl, getVoicePreviewErrorMessage } from '../../api/ciscoAi';
import {
  buildInstructionPrompt,
  buildWelcomeMessage,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_AUTO_START_VOICE_PREVIEW_KEY,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  readEvaSessionState,
  type EvaConversationStep,
} from '../../features/eva/evaFormConfig';
import { EVA_TEMPLATES } from '../../features/eva/evaTemplates';
import { Icon } from '../../icons';

type PreviewCallStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'paused' | 'ended' | 'error';

type PreviewTranscriptEntry = {
  id: string;
  role: 'customer' | 'agent';
  text: string;
  timestamp: string;
  timeLabel: string;
};

type PreviewSocketMessage = {
  type?: string;
  audio_event?: { audio_base_64?: string };
  ping_event?: { event_id?: number };
  conversation_initiation_metadata_event?: {
    conversation_id?: string;
    agent_output_audio_format?: string;
  };
  agent_response_event?: {
    agent_response?: string;
  };
  agent_response_correction_event?: {
    corrected_agent_response?: string;
    agent_response?: string;
  };
  user_transcription_event?: {
    user_transcript?: string;
  };
};

type StudioStep = {
  id: string;
  title: string;
  description: string;
  section: string;
  guidedStep: EvaConversationStep;
  icon: 'bot-customer-assistant' | 'bookmark' | 'document' | 'files' | 'tools' | 'shield' | 'play' | 'phone';
};

const studioSteps: StudioStep[] = [
  {
    id: 'instructions',
    title: "Ground agent's behavior",
    description: 'Review the role, goals, tone, and escalation guidance before customers use it.',
    section: 'Instructions',
    guidedStep: 'instructions',
    icon: 'bot-customer-assistant',
  },
  {
    id: 'knowledge',
    title: 'Stay accurate with Knowledge',
    description: 'Check the sources the agent can use so responses stay accurate and on policy.',
    section: 'Knowledge',
    guidedStep: 'knowledge',
    icon: 'bookmark',
  },
  {
    id: 'actions',
    title: 'Execute with tools',
    description: 'Review the tools the agent can call when it needs to look up data or complete a task.',
    section: 'Action',
    guidedStep: 'actions',
    icon: 'tools',
  },
  {
    id: 'security',
    title: 'Add guardrails',
    description: 'Set boundaries for privacy, escalation, and safe behavior before publishing.',
    section: 'Security',
    guidedStep: 'security',
    icon: 'shield',
  },
  {
    id: 'testing',
    title: 'Evaluation agent performance',
    description: 'Run readiness checks and realistic scenarios to validate quality before launch.',
    section: 'Testing',
    guidedStep: 'testing',
    icon: 'play',
  },
];

function getConfiguredSummary(agent: Agent) {
  const knowledgeBases = agent.knowledgeBases?.length
    ? agent.knowledgeBases
    : ['Starter knowledge sources'];
  const isRetailReceptionist = agent.name.toLowerCase().includes('acme electronics');

  return {
    channel: isRetailReceptionist ? 'Voice channel connected' : 'Primary channel ready to review',
    endpoint: '+1 415 555 0198',
    aiEngine: 'Webex AI Pro 1.0',
    handoff: isRetailReceptionist ? 'Manager escalation to Matt' : 'Escalation behavior ready to review',
    actions: isRetailReceptionist
      ? ['Inventory lookup', 'Create support case']
      : ['Starter action set'],
    knowledgeBases,
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function downsampleTo16Khz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }
    output[i] = count > 0 ? sum / count : 0;
  }
  return output;
}

function float32ToPcm16Base64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return arrayBufferToBase64(buffer);
}

function getPreviewTimeLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

export default function AgentStudioLanding() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agents, selectAgent, showToast } = useApp();
  const { setVariation } = useDesignVariation();
  const agent = agentId ? agents[agentId] : null;
  const [previewCallStatus, setPreviewCallStatus] = useState<PreviewCallStatus>('idle');
  const [previewCallError, setPreviewCallError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewInteractionEnded, setPreviewInteractionEnded] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState('');
  const [previewTranscript, setPreviewTranscript] = useState<PreviewTranscriptEntry[]>([]);
  const [previewPaused, setPreviewPaused] = useState(false);
  const previewCallStatusRef = useRef<PreviewCallStatus>('idle');
  const previewWsRef = useRef<WebSocket | null>(null);
  const previewAudioContextRef = useRef<AudioContext | null>(null);
  const previewInputAudioContextRef = useRef<AudioContext | null>(null);
  const previewInputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const previewScriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const previewMicStreamRef = useRef<MediaStream | null>(null);
  const previewOutputFormatRef = useRef('pcm_16000');
  const previewPlaybackTimeRef = useRef(0);
  const previewSpeakingTimerRef = useRef<number | null>(null);
  const previewGreetingFallbackTimerRef = useRef<number | null>(null);
  const previewTranscriptRef = useRef<HTMLDivElement | null>(null);
  const previewInteractionStartedRef = useRef(false);
  const previewConversationReadyRef = useRef(false);
  const previewInitialGreetingPendingRef = useRef(false);
  const previewMicStreamingEnabledRef = useRef(false);
  const previewPausedRef = useRef(false);
  const previewConnectionTimerRef = useRef<number | null>(null);

  if (!agentId || !agent) {
    return <Navigate to="/agents" replace />;
  }

  const summary = getConfiguredSummary(agent);
  const existingEvaSession = readEvaSessionState();
  const phoneNumberDeferred = Boolean(
    existingEvaSession?.phoneNumberDeferred && existingEvaSession.agentName === agent.name,
  );
  const goToSection = (section: string) => {
    selectAgent(agent.id);
    navigate(`/agents/${agent.id}/configure?section=${section}`);
  };

  const openGuidedSetup = (targetStep?: EvaConversationStep, options: { autoStartPreview?: boolean } = {}) => {
    const baseDraft = EVA_TEMPLATES.find(template => template.id === 'customer-support')?.draft ?? EVA_TEMPLATES[0].draft;
    const nextDraft = {
      ...baseDraft,
      name: agent.name,
      description: agent.description,
      goals: [agent.description || `Help customers with ${agent.name.toLowerCase()}`],
    };
    const existing = readEvaSessionState();

    try {
      window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify({
        ...existing,
        landingMode: 'build',
        selectedTemplateId: existing?.selectedTemplateId ?? 'customer-support',
        draft: existing?.draft?.name === agent.name ? existing.draft : nextDraft,
        messages: existing?.messages ?? [],
        guidanceVisible: true,
        orchestrationSuggested: false,
        freeChatActive: false,
        conversationalOnboardingStep: 'idle',
        evaStep: targetStep ?? (existing?.agentName === agent.name ? existing.evaStep : 'profile'),
        agentName: agent.name,
        agentDescription: agent.description,
        avatarUrl: existing?.avatarUrl ?? 'https://us.webexbotbuilder.com/static/assets/i...',
        timezone: existing?.timezone ?? 'America/Los_Angeles',
        aiEngine: existing?.aiEngine ?? 'Webex AI Pro 1.0',
        welcomeMessage: existing?.agentName === agent.name ? existing.welcomeMessage : buildWelcomeMessage(nextDraft),
        instructionPrompt: existing?.agentName === agent.name ? existing.instructionPrompt : buildInstructionPrompt(nextDraft),
        selectedKnowledgeBases: agent.knowledgeBases ?? existing?.selectedKnowledgeBases ?? nextDraft.knowledgeBases.slice(0, 2).map(kb => kb.name),
        selectedActions: existing?.selectedActions ?? getConfiguredSummary(agent).actions,
        optimizeAccepted: existing?.optimizeAccepted ?? false,
        preOptimizeText: existing?.preOptimizeText ?? '',
        optimizeSummary: existing?.optimizeSummary ?? { changes: [], reasoning: [] },
        securityTier: existing?.securityTier ?? 'standard',
        channelType: existing?.channelType ?? 'voice',
        selectedChannels: existing?.agentName === agent.name ? existing?.selectedChannels ?? ['voice'] : ['voice'],
        digitalChannel: existing?.digitalChannel ?? 'chat',
        selectedDigitalChannels: existing?.selectedDigitalChannels ?? ['chat'],
        digitalChannelAddress: existing?.digitalChannelAddress ?? '',
        channelPhoneNumber: existing?.channelPhoneNumber ?? getConfiguredSummary(agent).endpoint,
        phoneNumberDeferred,
        standardGuardrails: existing?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS,
        advancedGuardrailGroups: existing?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS,
        expandedAdvancedGroups: existing?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => group.id),
        personality: existing?.personality ?? {
          llm: 'Webex AI Pro 1.0',
          voice: 'ava',
          language: 'en-US',
          gender: 'neutral',
        },
        customRules: existing?.customRules ?? [],
      }));
      if (options.autoStartPreview) {
        window.sessionStorage.setItem(EVA_AUTO_START_VOICE_PREVIEW_KEY, '1');
      }
    } catch {
      /* If storage is unavailable, still navigate to the guided setup shell. */
    }

    selectAgent(agent.id);
    setVariation('landing');
    navigate('/agents');
  };

  const completeCreating = () => {
    selectAgent(agent.id);
    showToast(`Agent "${agent.name}" created successfully!`, 'success');
    setVariation('dashboard');
    navigate('/agents');
  };

  const stopPreviewCall = (nextStatus: PreviewCallStatus = 'ended') => {
    if (previewConnectionTimerRef.current) {
      window.clearTimeout(previewConnectionTimerRef.current);
      previewConnectionTimerRef.current = null;
    }
    if (previewSpeakingTimerRef.current) {
      window.clearTimeout(previewSpeakingTimerRef.current);
      previewSpeakingTimerRef.current = null;
    }
    if (previewGreetingFallbackTimerRef.current) {
      window.clearTimeout(previewGreetingFallbackTimerRef.current);
      previewGreetingFallbackTimerRef.current = null;
    }
    const ws = previewWsRef.current;
    previewWsRef.current = null;
    previewConversationReadyRef.current = false;
    previewInitialGreetingPendingRef.current = false;
    previewMicStreamingEnabledRef.current = false;
    previewPausedRef.current = false;
    setPreviewPaused(false);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    previewScriptProcessorRef.current?.disconnect();
    previewScriptProcessorRef.current = null;
    previewInputSourceRef.current?.disconnect();
    previewInputSourceRef.current = null;
    previewMicStreamRef.current?.getTracks().forEach(track => track.stop());
    previewMicStreamRef.current = null;
    if (previewInputAudioContextRef.current && previewInputAudioContextRef.current.state !== 'closed') {
      void previewInputAudioContextRef.current.close();
    }
    previewInputAudioContextRef.current = null;
    if (previewAudioContextRef.current && previewAudioContextRef.current.state !== 'closed') {
      void previewAudioContextRef.current.close();
    }
    previewAudioContextRef.current = null;
    previewPlaybackTimeRef.current = 0;
    if ((nextStatus === 'ended' || nextStatus === 'error') && previewInteractionStartedRef.current) {
      setPreviewInteractionEnded(true);
    }
    previewCallStatusRef.current = nextStatus;
    setPreviewCallStatus(nextStatus);
  };

  const appendPreviewTranscript = (role: PreviewTranscriptEntry['role'], text?: string) => {
    const normalizedText = text?.trim();
    if (!normalizedText) return;

    setPreviewTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === role && last.text === normalizedText) {
        return prev;
      }

      return [
        ...prev,
        {
          id: `${role}-${Date.now()}-${prev.length}`,
          role,
          text: normalizedText,
          timestamp: new Date().toISOString(),
          timeLabel: getPreviewTimeLabel(),
        },
      ];
    });
  };

  const togglePreviewPause = () => {
    if (!previewWsRef.current || previewCallStatus === 'idle' || previewCallStatus === 'ended' || previewCallStatus === 'error') {
      return;
    }

    const nextPaused = !previewPausedRef.current;
    previewPausedRef.current = nextPaused;
    setPreviewPaused(nextPaused);

    if (nextPaused) {
      previewCallStatusRef.current = 'paused';
      setPreviewCallStatus('paused');
      return;
    }

    previewCallStatusRef.current = 'listening';
    setPreviewCallStatus('listening');
  };

  const playPreviewAudioChunk = (audioBase64: string) => {
    if (!audioBase64) return;

    const audioContext = previewAudioContextRef.current ?? new AudioContext();
    previewAudioContextRef.current = audioContext;
    const rawBuffer = base64ToArrayBuffer(audioBase64);
    const format = previewOutputFormatRef.current || 'pcm_16000';
    const sampleRateMatch = format.match(/_(\d+)/);
    const sampleRate = sampleRateMatch ? Number(sampleRateMatch[1]) : 16000;

    const scheduleAudioBuffer = (audioBuffer: AudioBuffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      const startTime = Math.max(audioContext.currentTime, previewPlaybackTimeRef.current);
      source.start(startTime);
      previewPlaybackTimeRef.current = startTime + audioBuffer.duration;
      previewCallStatusRef.current = 'speaking';
      setPreviewCallStatus('speaking');

      if (previewSpeakingTimerRef.current) {
        window.clearTimeout(previewSpeakingTimerRef.current);
      }
      const remainingMs = Math.max(0, (previewPlaybackTimeRef.current - audioContext.currentTime) * 1000);
      previewSpeakingTimerRef.current = window.setTimeout(() => {
        previewSpeakingTimerRef.current = null;
        if (previewWsRef.current) {
          if (previewInitialGreetingPendingRef.current) {
            previewInitialGreetingPendingRef.current = false;
            previewMicStreamingEnabledRef.current = true;
          }
          previewCallStatusRef.current = previewPausedRef.current ? 'paused' : 'listening';
          setPreviewCallStatus(previewPausedRef.current ? 'paused' : 'listening');
        }
      }, remainingMs + 160);
    };

    const playPcm = () => {
      const pcm = new Int16Array(rawBuffer);
      const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i += 1) {
        channelData[i] = pcm[i] / 0x8000;
      }
      scheduleAudioBuffer(audioBuffer);
    };

    if (format.startsWith('pcm_')) {
      playPcm();
      return;
    }

    audioContext.decodeAudioData(rawBuffer.slice(0))
      .then(scheduleAudioBuffer)
      .catch(playPcm);
  };

  const startPreviewCall = async () => {
    if (previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking') return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPreviewCallError('Microphone is not available in this browser.');
      previewCallStatusRef.current = 'error';
      setPreviewCallStatus('error');
      return;
    }

    setPreviewCallError('');
    previewCallStatusRef.current = 'connecting';
    setPreviewCallStatus('connecting');
    setPreviewInteractionEnded(false);
    setPreviewTranscript([]);
    setPreviewSessionId('');
    previewInteractionStartedRef.current = false;
    previewConversationReadyRef.current = false;
    previewInitialGreetingPendingRef.current = true;
    previewMicStreamingEnabledRef.current = false;
    previewPausedRef.current = false;
    setPreviewPaused(false);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const signedUrl = await getElevenLabsConversationSignedUrl();
      const ws = new WebSocket(signedUrl);
      previewWsRef.current = ws;
      previewMicStreamRef.current = micStream;
      previewConnectionTimerRef.current = window.setTimeout(() => {
        if (previewWsRef.current !== ws || previewCallStatusRef.current === 'error') return;
        setPreviewCallError('Voice preview could not connect to the voice websocket. Check network access to ElevenLabs and try again.');
        stopPreviewCall('error');
      }, 10000);

      ws.onopen = () => {
        if (previewWsRef.current !== ws) return;
        if (previewConnectionTimerRef.current) {
          window.clearTimeout(previewConnectionTimerRef.current);
          previewConnectionTimerRef.current = null;
        }
        previewConnectionTimerRef.current = window.setTimeout(() => {
          if (
            previewWsRef.current !== ws ||
            previewConversationReadyRef.current ||
            previewCallStatusRef.current === 'error'
          ) {
            return;
          }
          setPreviewCallError('Voice preview connected, but the voice agent did not become ready.');
          stopPreviewCall('error');
        }, 10000);
        previewInteractionStartedRef.current = true;
        ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));

        const audioContext = new AudioContext();
        previewInputAudioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(micStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        previewInputSourceRef.current = source;
        previewScriptProcessorRef.current = processor;

        processor.onaudioprocess = event => {
          if (
            ws.readyState !== WebSocket.OPEN ||
            !previewConversationReadyRef.current ||
            !previewMicStreamingEnabledRef.current ||
            previewPausedRef.current
          ) {
            return;
          }

          const input = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleTo16Khz(input, audioContext.sampleRate);
          ws.send(JSON.stringify({ user_audio_chunk: float32ToPcm16Base64(downsampled) }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = event => {
        if (typeof event.data !== 'string') return;
        let data: PreviewSocketMessage;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'conversation_initiation_metadata') {
          if (previewConnectionTimerRef.current) {
            window.clearTimeout(previewConnectionTimerRef.current);
            previewConnectionTimerRef.current = null;
          }
          previewOutputFormatRef.current =
            data.conversation_initiation_metadata_event?.agent_output_audio_format || 'pcm_16000';
          previewConversationReadyRef.current = true;
          const conversationId = data.conversation_initiation_metadata_event?.conversation_id?.trim();
          if (conversationId) {
            setPreviewSessionId(conversationId);
          }
          previewGreetingFallbackTimerRef.current = window.setTimeout(() => {
            previewGreetingFallbackTimerRef.current = null;
            if (
              previewWsRef.current === ws &&
              previewInitialGreetingPendingRef.current &&
              previewCallStatusRef.current !== 'speaking'
            ) {
              previewInitialGreetingPendingRef.current = false;
              previewMicStreamingEnabledRef.current = true;
              previewCallStatusRef.current = previewPausedRef.current ? 'paused' : 'listening';
              setPreviewCallStatus(previewPausedRef.current ? 'paused' : 'listening');
            }
          }, 1800);
          return;
        }

        if (data.type === 'ping' && typeof data.ping_event?.event_id === 'number') {
          ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event.event_id }));
          return;
        }

        if (data.type === 'audio' && data.audio_event?.audio_base_64) {
          playPreviewAudioChunk(data.audio_event.audio_base_64);
          return;
        }

        if (data.type === 'agent_response') {
          appendPreviewTranscript('agent', data.agent_response_event?.agent_response);
          return;
        }

        if (data.type === 'agent_response_correction') {
          appendPreviewTranscript(
            'agent',
            data.agent_response_correction_event?.corrected_agent_response
              ?? data.agent_response_correction_event?.agent_response,
          );
          return;
        }

        if (data.type === 'user_transcript' || data.type === 'user_transcription') {
          appendPreviewTranscript('customer', data.user_transcription_event?.user_transcript);
        }
      };

      ws.onerror = () => {
        setPreviewCallError('Voice preview connection failed. Waiting for connection details...');
      };

      ws.onclose = event => {
        if (previewWsRef.current !== ws) return;
        if (event.code !== 1000 && previewCallStatusRef.current !== 'error') {
          const reason = event.reason ? `: ${event.reason}` : '';
          const guidance = event.code === 1002 || event.code === 1006
            ? ' Check that the ElevenLabs agent ID matches the API key and that this network allows wss://api.elevenlabs.io.'
            : '';
          setPreviewCallError(`Voice preview websocket closed (${event.code}${reason}).${guidance}`);
          stopPreviewCall('error');
          return;
        }
        stopPreviewCall('ended');
      };
    } catch (err) {
      setPreviewCallError(getVoicePreviewErrorMessage(err));
      stopPreviewCall('error');
    }
  };

  useEffect(() => () => {
    stopPreviewCall('ended');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!previewExpanded) return;
    const transcriptNode = previewTranscriptRef.current;
    if (!transcriptNode) return;
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [previewExpanded, previewTranscript]);

  const headerActions = (
    <div className="agent-studio-header-actions">
      <Button variant="secondary" onClick={completeCreating}>
        Complete creating
      </Button>
      <Button onClick={() => openGuidedSetup('instructions')}>
        <Icon name="sparkle" weight="bold" size="sm" />
        Continue setup
      </Button>
    </div>
  );
  const sessionsDeepLink = previewSessionId
    ? `/agents/${agent.id}/sessions?sessionId=${encodeURIComponent(previewSessionId)}&source=preview`
    : `/agents/${agent.id}/sessions?source=preview`;
  const showPreviewSessionLink = previewInteractionEnded && (previewCallStatus === 'ended' || previewCallStatus === 'error');

  return (
    <div className="primary-content agent-studio-landing">
      <AgentHeader agent={agent} activeTab="configure" showPublishButton={false} showTabs={false} headerRight={headerActions} />

      <section className="agent-studio-hero" aria-labelledby="agent-studio-title">
        <div className="agent-studio-hero__header">
          <div className="agent-studio-hero__main">
            <div className="agent-studio-hero__content">
              <h1 id="agent-studio-title">Review what's configured</h1>
              <p>
                Your conversational setup is saved. This checkpoint shows what is already configured
                before you continue into guided setup.
              </p>
            </div>
          </div>
        </div>

        <div className="agent-studio-grid">
          <Card className="agent-studio-card agent-studio-card--summary">
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon">
                  <Icon name="check-circle-filled" weight="bold" size="sm" />
                </span>
                <span>
                  <strong>Profile</strong>
                  <small>From the conversational setup</small>
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => goToSection('Profile')}>
                Edit
              </Button>
            </CardHeader>
            <CardBody>
              <div className="agent-studio-summary-list">
                {!phoneNumberDeferred && (
                  <span>
                    <strong>Phone</strong>
                    <span className="agent-studio-summary-value">
                      {summary.endpoint}
                      <Badge variant="info" className="agent-studio-service-badge">Voice</Badge>
                    </span>
                  </span>
                )}
                <span><strong>Ai Engine</strong>{summary.aiEngine}</span>
                <span><strong>Language</strong>English (US)</span>
                <span><strong>Timezone</strong>America/Los_Angeles</span>
              </div>
            </CardBody>
          </Card>

          <Card className="agent-studio-card agent-studio-card--summary">
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon">
                  <Icon name="check-circle-filled" weight="bold" size="sm" />
                </span>
                <span>
                  <strong>Connected</strong>
                  <small>Knowledge and actions the agent can use</small>
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => goToSection('Knowledge')}>
                Edit
              </Button>
            </CardHeader>
            <CardBody>
              <div className="agent-studio-chip-group" aria-label="Connected knowledge bases">
                {summary.knowledgeBases.map(item => (
                  <Badge key={item} variant="default" className="agent-studio-service-badge">
                    <Icon name="files" weight="regular" size="xs" />
                    {item}
                  </Badge>
                ))}
              </div>
              <div className="agent-studio-chip-group" aria-label="Connected actions">
                {summary.actions.map(item => (
                  <Badge key={item} variant="default" className="agent-studio-service-badge">
                    <Icon name="tools" weight="regular" size="xs" />
                    {item}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="agent-studio-card agent-studio-card--summary agent-studio-card--preview">
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon">
                  <Icon name="play" weight="bold" size="sm" />
                </span>
                <span>
                  <strong>Preview</strong>
                  <small>Try what is already configured</small>
                </span>
              </div>
              <Button
                type="button"
                variant={previewExpanded ? 'secondary' : 'tertiary'}
                size="sm"
                className="agent-studio-preview-expand-btn"
                aria-expanded={previewExpanded}
                aria-pressed={previewExpanded}
                aria-haspopup="dialog"
                onClick={() => setPreviewExpanded(true)}
              >
                <Icon name="transcript" weight="bold" size="sm" />
                Text transcript
              </Button>
            </CardHeader>
            <CardBody>
              <div
                className={`agent-studio-preview-soundbar${previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking' ? ' agent-studio-preview-soundbar--active' : ''}`}
                aria-label="Preview configured greeting"
              >
                <div className="eva-voice-preview__visualizer" aria-hidden="true">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <span key={index} style={{ animationDelay: `${index * 55}ms` }} />
                  ))}
                </div>
                {previewCallStatus === 'error' && (
                  <span>{previewCallError || 'Voice preview failed.'}</span>
                )}
                {previewCallStatus === 'connecting' && (
                  <span>Connecting voice preview...</span>
                )}
                {previewCallStatus === 'listening' && (
                  <span>Listening...</span>
                )}
                {previewCallStatus === 'speaking' && (
                  <span>Agent is speaking...</span>
                )}
                {previewCallStatus === 'paused' && (
                  <span>Call paused. Resume to continue sending caller audio.</span>
                )}
                <div className="agent-studio-preview-actions">
                  <Button
                    type="button"
                    size="sm"
                    disabled={previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking' || previewCallStatus === 'paused'}
                    onClick={() => { void startPreviewCall(); }}
                  >
                    <Icon name="phone" weight="bold" size="sm" />
                    {previewCallStatus === 'ended' ? 'Restart call' : 'Start Call'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
                    onClick={() => stopPreviewCall('ended')}
                  >
                    End Call
                  </Button>
                </div>
                {showPreviewSessionLink && (
                  <div className="agent-studio-preview-session-link">
                    <Icon name="transcript" weight="regular" size="sm" />
                    <span>
                      Preview ended.{' '}
                      <TextLink
                        variant="inline"
                        size="sm"
                        href={sessionsDeepLink}
                        onClick={event => {
                          event.preventDefault();
                          navigate(sessionsDeepLink);
                        }}
                      >
                        Open this interaction in Sessions
                      </TextLink>
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {previewExpanded && (
        <Modal size="md" onClose={() => setPreviewExpanded(false)} className="agent-studio-transcript-modal">
          <ModalHeader
            title="Live transcript"
            description={`Preview transcript for ${agent.name}`}
            onClose={() => setPreviewExpanded(false)}
          />
          <ModalBody>
            <div className="agent-studio-preview-transcript" aria-live="polite">
              <div className="agent-studio-preview-transcript__controls" aria-label="Preview call controls">
                {previewCallStatus === 'ended' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => { void startPreviewCall(); }}
                  >
                    <Icon name="phone" weight="bold" size="sm" />
                    Restart call
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
                    onClick={togglePreviewPause}
                  >
                    <Icon name={previewPaused ? 'play' : 'pause'} weight="bold" size="sm" />
                    {previewPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
                  onClick={() => stopPreviewCall('ended')}
                >
                  End call
                </Button>
              </div>
              <div ref={previewTranscriptRef} className="agent-studio-preview-transcript__body">
                {previewTranscript.length > 0 ? (
                  previewTranscript.map(message => (
                    <article
                      key={message.id}
                      className={`agent-studio-preview-transcript__message agent-studio-preview-transcript__message--${message.role}`}
                    >
                      <div className="agent-studio-preview-transcript__meta">
                        <span>{message.role === 'agent' ? agent.name : 'Customer'}</span>
                        <time dateTime={message.timestamp}>{message.timeLabel}</time>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  ))
                ) : (
                  <p className="agent-studio-preview-transcript__empty">
                    Transcript text will appear here as the preview sends speech-to-text events.
                  </p>
                )}
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}

      <Divider variant="gradient" aria-hidden="true" />

      <div className="agent-studio-next__header">
        <div className="agent-studio-section-heading">
          <h1 id="agent-studio-next-title">Make the agent smarter</h1>
          <p>Pick one plain-language step. Each one opens the detailed configuration only when you choose it.</p>
        </div>
      </div>

      <div className="agent-studio-step-grid">
        {phoneNumberDeferred && (
          <Card clickable className="agent-studio-step-card" onClick={() => openGuidedSetup('channels')}>
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon agent-studio-card-heading__icon--muted">
                  <Icon className="agent-studio-step-icon" name="phone" weight="regular" size="md" />
                </span>
                <span>
                  <strong>Connect phone number</strong>
                  <small>Make the agent live</small>
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="agent-studio-step-card__content">
                <p>Choose an available voice number before publishing so customers can call this agent.</p>
                <span className="agent-studio-step-card__link">
                  Open Channel
                  <Icon name="next" weight="bold" size="xs" />
                </span>
              </div>
            </CardBody>
          </Card>
        )}
        {studioSteps.map(step => (
          <Card key={step.id} clickable className="agent-studio-step-card" onClick={() => openGuidedSetup(step.guidedStep)}>
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon agent-studio-card-heading__icon--muted">
                  <Icon className="agent-studio-step-icon" name={step.icon} weight="regular" size="md" />
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.section}</small>
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="agent-studio-step-card__content">
                <p>{step.description}</p>
                <span className="agent-studio-step-card__link">
                  Open {step.section}
                  <Icon name="next" weight="bold" size="xs" />
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
