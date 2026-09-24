import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  agentStudioWelcomeRiseDurationMs,
  agentStudioWelcomeWakeDelayMs,
  useAgentStudioWelcomeState,
} from './agentStudioWelcome';
import './agentStudioMotionBackground.css';

export type AgentStudioBackgroundMode = 'home' | 'workspace';

type BackgroundPose = 'hidden' | 'wake' | 'settled' | 'workspace';
type MotionPhase = 'none' | 'rise' | 'move' | 'route';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

const usesWebKitRenderingFallback =
  typeof navigator !== 'undefined' &&
  /AppleWebKit/.test(navigator.userAgent) &&
  !/(Chrome|Chromium|Edg)/.test(navigator.userAgent);

/* The approved AI Agent Studio field keeps product-specific artwork and
   endpoints local while reusing the shared welcome choreography. */
const poses: Record<BackgroundPose, { x: number; y: number }> = {
  wake: { x: -229.5702813720703, y: -36.37297058105469 },
  settled: { x: 0, y: -40 },
  workspace: { x: 0, y: 40 },
  hidden: { x: -229.5702813720703, y: 743.6270294189453 },
};

const noiseSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/>" +
  "<feComponentTransfer><feFuncR type='linear' slope='4' intercept='-1.5'/>" +
  "<feFuncG type='linear' slope='4' intercept='-1.5'/>" +
  "<feFuncB type='linear' slope='4' intercept='-1.5'/></feComponentTransfer>" +
  "</filter><rect width='160' height='160' filter='url(#n)'/></svg>";

const grainBackground = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(noiseSvg)}")`;


export default function AgentStudioMotionBackground({
  mode = 'home',
}: {
  mode?: AgentStudioBackgroundMode;
}) {
  const { enabled, phase, reducedMotion } = useAgentStudioWelcomeState();
  const rootRef = useRef<HTMLDivElement>(null);
  const previousModeRef = useRef(mode);
  const [pose, setPose] = useState<BackgroundPose>(() =>
    mode === 'workspace'
      ? 'workspace'
      : enabled && phase === 'running' && !reducedMotion
        ? 'hidden'
        : 'settled',
  );
  const [motionPhase, setMotionPhase] = useState<MotionPhase>('none');
  const [stageTransform, setStageTransform] = useState(
    'translate(0px, 0px) scale(1)',
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const { width, height } = root.getBoundingClientRect();
      const scale = Math.max(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
      setStageTransform(
        `translate(${width - DESIGN_WIDTH * scale}px, ${height - DESIGN_HEIGHT * scale}px) scale(${scale})`,
      );
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    measure();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const modeChanged = previousModeRef.current !== mode;
    previousModeRef.current = mode;

    if (mode === 'workspace') {
      setMotionPhase(reducedMotion ? 'none' : 'route');
      setPose('workspace');
      return;
    }

    // Returning from a workspace restores the settled Home artwork without
    // replaying the first-visit welcome rise.
    if (modeChanged) {
      setMotionPhase(reducedMotion ? 'none' : 'route');
      setPose('settled');
      return;
    }

    if (!enabled || phase !== 'running' || reducedMotion) {
      setMotionPhase(reducedMotion ? 'none' : 'route');
      setPose('settled');
      return;
    }

    setMotionPhase('none');
    setPose('hidden');

    const wakeTimer = window.setTimeout(() => {
      setMotionPhase('rise');
      setPose('wake');
    }, agentStudioWelcomeWakeDelayMs);
    const settleTimer = window.setTimeout(() => {
      setMotionPhase('move');
      setPose('settled');
    }, agentStudioWelcomeWakeDelayMs + agentStudioWelcomeRiseDurationMs);

    return () => {
      window.clearTimeout(wakeTimer);
      window.clearTimeout(settleTimer);
    };
  }, [enabled, mode, phase, reducedMotion]);

  const activePose = poses[pose];

  return (
    <div
      ref={rootRef}
      className="agent-studio-motion-background"
      data-motion={motionPhase}
      data-pose={pose}
      data-background-mode={mode}
      data-renderer={usesWebKitRenderingFallback ? 'css' : 'svg'}
      aria-hidden="true"
    >
      <div
        className="agent-studio-motion-background__stage"
        style={{ transform: stageTransform }}
      >
        <div className="agent-studio-motion-background__webkit-fallback" />
        <div className="agent-studio-motion-background__webkit-right-accent" />
        <div
          className="agent-studio-motion-background__ellipse-group"
          style={{
            transform: `translate3d(${activePose.x}px, ${activePose.y}px, 0)`,
          }}
        >
          <svg
            className="agent-studio-motion-background__artwork"
            width="1376"
            height="816"
            viewBox="0 0 1376 816"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1280" height="720" transform="translate(48 24)" fill="#000" />

            <g filter="url(#agent-studio-large-disc-blur)">
              <circle
                cx="820.66"
                cy="616.66"
                r="576.274"
                transform="rotate(-178.755 820.66 616.66)"
                fill="url(#agent-studio-large-disc-gradient)"
              />
            </g>

            <g filter="url(#agent-studio-wide-accent-blur)">
              <ellipse
                cx="84.3841"
                cy="451.941"
                rx="84.3841"
                ry="451.941"
                transform="matrix(0.147644 0.989041 0.989041 -0.147644 861 787.219)"
                fill="url(#agent-studio-wide-accent-gradient)"
              />
            </g>

            <g
              className="agent-studio-motion-background__right-accent"
              filter="url(#agent-studio-right-accent-blur)"
              style={{ transform: mode === 'home' ? 'translateY(80px)' : 'translateY(0)' }}
            >
              <ellipse
                cx="1582.09"
                cy="760.301"
                rx="286.981"
                ry="285.902"
                transform="rotate(171.738 1582.09 760.301)"
                fill="url(#agent-studio-right-accent-gradient)"
              />
            </g>

            <defs>
              <filter
                id="agent-studio-large-disc-blur"
                x="24.384"
                y="-179.616"
                width="1592.55"
                height="1592.55"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="110" result="blur" />
              </filter>
              <filter
                id="agent-studio-wide-accent-blur"
                x="743.282"
                y="567.093"
                width="1154.33"
                height="473.717"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="65" result="blur" />
              </filter>
              <filter
                id="agent-studio-right-accent-blur"
                x="1095.09"
                y="274.339"
                width="973.992"
                height="971.923"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="100" result="blur" />
              </filter>

              <linearGradient
                id="agent-studio-large-disc-gradient"
                x1="820.66"
                y1="40.3868"
                x2="1150.72"
                y2="884.711"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0.283119" stopColor="#ABDDFF" />
                <stop offset="0.316113" stopColor="#6195FF" />
                <stop offset="0.602679" stopColor="#0C175B" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <linearGradient
                id="agent-studio-wide-accent-gradient"
                x1="145.934"
                y1="357.461"
                x2="-92.4818"
                y2="490.076"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0.182118" stopColor="#CBEF69" />
                <stop offset="0.412175" stopColor="#FF7C00" />
                <stop offset="0.776846" stopColor="#670081" />
              </linearGradient>
              <linearGradient
                id="agent-studio-right-accent-gradient"
                x1="1791.41"
                y1="700.532"
                x2="1684.62"
                y2="1019.87"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#CBEF69" />
                <stop offset="0.321391" stopColor="#FF7C00" />
                <stop offset="0.795053" stopColor="#670081" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div
        className="agent-studio-motion-background__grain"
        style={{ backgroundImage: grainBackground }}
      />
    </div>
  );
}
