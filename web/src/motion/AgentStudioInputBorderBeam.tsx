import type { CSSProperties } from 'react';
import {
  agentStudioInputBorderBeamDelayMs,
  agentStudioInputBorderBeamDurationMs,
  useAgentStudioWelcomeState,
} from './agentStudioWelcome';
import { GradientBorderBeamLayer } from './GradientBorderBeam';
import './agentStudioInputBorderBeam.css';

export default function AgentStudioInputBorderBeam() {
  const { enabled, phase, reducedMotion } = useAgentStudioWelcomeState();

  if (!enabled || phase !== 'running' || reducedMotion) return null;

  return (
    <span
      className="agent-studio-input-border-beam"
      style={
        {
          '--agent-studio-input-border-beam-delay': `${agentStudioInputBorderBeamDelayMs}ms`,
          '--agent-studio-input-border-beam-duration': `${agentStudioInputBorderBeamDurationMs}ms`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <GradientBorderBeamLayer
        className="agent-studio-input-border-beam__glow"
        segmentClassName="agent-studio-input-border-beam__segment"
      />
      <GradientBorderBeamLayer
        className="agent-studio-input-border-beam__stroke"
        segmentClassName="agent-studio-input-border-beam__segment"
      />
    </span>
  );
}
