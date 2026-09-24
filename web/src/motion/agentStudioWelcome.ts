import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react';
import { motionDurationMs } from './motionTokens';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type AgentStudioWelcomePhase = 'running' | 'complete';

export const agentStudioWelcomeWakeDelayMs = motionDurationMs.fast * 2;
export const agentStudioWelcomeRiseDurationMs = motionDurationMs.sustained;
export const agentStudioWelcomeMoveDurationMs = motionDurationMs.extended;
export const agentStudioWelcomeGreetingDurationMs = motionDurationMs.slow;
/* Keep the final settle aligned with the background's rightward landing.
   A shorter hold lets the content stop first, so the translucent surfaces make
   the remaining background travel read as a horizontal content jump. */
export const agentStudioWelcomeHoldDurationMs = motionDurationMs.slow;
export const agentStudioWelcomeTitleStartMs =
  agentStudioWelcomeWakeDelayMs + agentStudioWelcomeRiseDurationMs;
export const agentStudioWelcomeFinalStartMs =
  agentStudioWelcomeTitleStartMs +
  agentStudioWelcomeGreetingDurationMs +
  agentStudioWelcomeHoldDurationMs;
export const agentStudioWelcomeSettleDurationMs = motionDurationMs.sustained;
export const agentStudioInputBorderBeamDelayMs =
  agentStudioWelcomeFinalStartMs;

/* This three-beat sequence stays product-specific: the shared tokens establish
   cadence while Agent Studio groups its creation surfaces into one finale. */
export const agentStudioWelcomeSequenceMs = {
  background: agentStudioWelcomeWakeDelayMs,
  title: agentStudioWelcomeTitleStartMs,
  content: agentStudioWelcomeFinalStartMs,
  settle: agentStudioWelcomeSettleDurationMs,
} as const;

/* The WX1 beam is derived from a 236-frame, 60 fps source animation. Its
   cadence is an effect-specific exception rather than a reusable duration. */
export const agentStudioInputBorderBeamDurationMs = (236 / 60) * 1000;

const backgroundEndMs =
  agentStudioWelcomeWakeDelayMs +
  agentStudioWelcomeRiseDurationMs +
  agentStudioWelcomeMoveDurationMs;
const contentEndMs =
  agentStudioWelcomeFinalStartMs + agentStudioWelcomeSettleDurationMs;
const borderBeamEndMs =
  agentStudioInputBorderBeamDelayMs + agentStudioInputBorderBeamDurationMs;

export const agentStudioWelcomeDurationMs = Math.max(
  backgroundEndMs,
  contentEndMs,
  borderBeamEndMs,
);

type AgentStudioWelcomeState = {
  enabled: boolean;
  phase: AgentStudioWelcomePhase;
  reducedMotion: boolean;
};

const AgentStudioWelcomeContext = createContext<AgentStudioWelcomeState>({
  enabled: false,
  phase: 'complete',
  reducedMotion: false,
});

export function AgentStudioWelcomeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AgentStudioWelcomeState;
}) {
  return createElement(AgentStudioWelcomeContext.Provider, { value }, children);
}

export function useAgentStudioWelcomeState() {
  return useContext(AgentStudioWelcomeContext);
}

export function useAgentStudioWelcome(enabled: boolean) {
  const reducedMotion = usePrefersReducedMotion();
  const hasPlayedRef = useRef(false);
  const [phase, setPhase] = useState<AgentStudioWelcomePhase>(() =>
    enabled && !reducedMotion ? 'running' : 'complete',
  );

  const complete = useCallback(() => setPhase('complete'), []);
  const onAnimationEnd = useCallback((event: AnimationEvent<HTMLElement>) => {
    if (event.currentTarget === event.target && event.animationName === 'agentStudioWelcomeClock') {
      complete();
    }
  }, [complete]);

  const needsStart = enabled && !reducedMotion && !hasPlayedRef.current;
  const visiblePhase = needsStart ? 'running' : phase;

  useEffect(() => {
    if (!enabled || reducedMotion || hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    setPhase('running');
  }, [enabled, reducedMotion]);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      const animationFrame = window.requestAnimationFrame(complete);
      return () => window.cancelAnimationFrame(animationFrame);
    }
    if (phase !== 'running') return;

    const startedAt = window.performance.now();
    const finishExpiredBackgroundRun = () => {
      if (!document.hidden && window.performance.now() - startedAt >= agentStudioWelcomeDurationMs) {
        complete();
      }
    };
    const finishTimer = window.setTimeout(complete, agentStudioWelcomeDurationMs);
    window.addEventListener('pointerdown', complete, { once: true });
    window.addEventListener('keydown', complete, { once: true });
    document.addEventListener('visibilitychange', finishExpiredBackgroundRun);
    return () => {
      window.clearTimeout(finishTimer);
      window.removeEventListener('pointerdown', complete);
      window.removeEventListener('keydown', complete);
      document.removeEventListener('visibilitychange', finishExpiredBackgroundRun);
    };
  }, [complete, enabled, phase, reducedMotion]);

  return { complete, onAnimationEnd, phase: visiblePhase, reducedMotion };
}
