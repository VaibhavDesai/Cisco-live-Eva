import { useEffect, useRef, useState } from 'react';
import fragmentShaderSource from './agentStudioBackground.fragment.glsl?raw';
import vertexShaderSource from './agentStudioBackground.vertex.glsl?raw';
import AgentStudioMotionBackground, {
  type AgentStudioBackgroundMode,
} from './AgentStudioMotionBackground';
import {
  agentStudioWelcomeMoveDurationMs,
  agentStudioWelcomeRiseDurationMs,
  agentStudioWelcomeWakeDelayMs,
  useAgentStudioWelcomeState,
} from './agentStudioWelcome';
import { motionDurationMs, motionEasing } from './motionTokens';
import './agentStudioShaderBackground.css';

type Pose = readonly [number, number];
type Easing = readonly [number, number, number, number];

type Scene = {
  pose: Pose;
  rightAccentOffset: Pose;
  rightAccentOpacity: number;
};

type Transition = {
  from: Scene;
  to: Scene;
  start: number;
  duration: number;
  easing: Easing;
};

type BackgroundController = {
  setMode: (mode: AgentStudioBackgroundMode, immediate: boolean) => void;
};

const SHADER_DPR_CAP = 1.25;
const GRAIN_OPACITY = 0.05;

/* Product-specific endpoints from the approved AI Agent Studio background.
   The welcome choreography continues to use the shared Motion System timing. */
const POSES = {
  hidden: [-229.5702813720703, 743.6270294189453],
  wake: [-229.5702813720703, -36.37297058105469],
  settled: [0, -40],
  workspace: [0, 40],
} as const satisfies Record<string, Pose>;

const SCENES = {
  hidden: { pose: POSES.hidden, rightAccentOffset: [0, 80], rightAccentOpacity: 1 },
  wake: { pose: POSES.wake, rightAccentOffset: [0, 80], rightAccentOpacity: 1 },
  home: { pose: POSES.settled, rightAccentOffset: [0, 80], rightAccentOpacity: 1 },
  workspace: { pose: POSES.workspace, rightAccentOffset: [0, 0], rightAccentOpacity: 1 },
} as const satisfies Record<string, Scene>;

function bezierCoordinate(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * first +
    3 * inverse * t * t * second +
    t * t * t;
}

function bezierDerivative(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * first +
    6 * inverse * t * (second - first) +
    3 * t * t * (1 - second);
}

function cubicBezier(progress: number, easing: Easing) {
  let t = progress;
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const derivative = bezierDerivative(t, easing[0], easing[2]);
    if (Math.abs(derivative) < 0.000001) break;
    t = Math.max(
      0,
      Math.min(
        1,
        t - (bezierCoordinate(t, easing[0], easing[2]) - progress) / derivative,
      ),
    );
  }
  return bezierCoordinate(t, easing[1], easing[3]);
}

function interpolateScene(transition: Transition, now: number): Scene {
  const progress = Math.max(
    0,
    Math.min(1, (now - transition.start) / transition.duration),
  );
  const eased = cubicBezier(progress, transition.easing);
  return {
    pose: [
      transition.from.pose[0] + (transition.to.pose[0] - transition.from.pose[0]) * eased,
      transition.from.pose[1] + (transition.to.pose[1] - transition.from.pose[1]) * eased,
    ],
    rightAccentOffset: [
      transition.from.rightAccentOffset[0] +
        (transition.to.rightAccentOffset[0] - transition.from.rightAccentOffset[0]) * eased,
      transition.from.rightAccentOffset[1] +
        (transition.to.rightAccentOffset[1] - transition.from.rightAccentOffset[1]) * eased,
    ],
    rightAccentOpacity:
      transition.from.rightAccentOpacity +
      (transition.to.rightAccentOpacity - transition.from.rightAccentOpacity) * eased,
  };
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create the Agent Studio background shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function AgentStudioShaderBackground({
  mode = 'home',
}: {
  mode?: AgentStudioBackgroundMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enabled, phase, reducedMotion } = useAgentStudioWelcomeState();
  const initialModeRef = useRef(mode);
  const previousModeRef = useRef(mode);
  const shouldAnimateRef = useRef(
    initialModeRef.current === 'home' && enabled && phase === 'running' && !reducedMotion,
  );
  const controllerRef = useRef<BackgroundController | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setUnavailable(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    let wakeTimer = 0;
    let settleTimer = 0;
    let scene: Scene = shouldAnimateRef.current
      ? SCENES.hidden
      : SCENES[initialModeRef.current];
    let transition: Transition | null = null;
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let vertexArray: WebGLVertexArrayObject | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const failOver = () => {
      if (!disposed) setUnavailable(true);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      failOver();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);

    try {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      program = gl.createProgram();
      if (!program) throw new Error('Could not create the Agent Studio background program.');

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'Unknown shader linking error.');
      }

      vertexArray = gl.createVertexArray();
      if (!vertexArray) throw new Error('Could not create the Agent Studio background geometry.');
      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
    } catch (error) {
      console.warn('Agent Studio WebGL background unavailable; using SVG fallback.', error);
      failOver();
      return () => {
        disposed = true;
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        if (vertexArray) gl.deleteVertexArray(vertexArray);
        if (program) gl.deleteProgram(program);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
      };
    }

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      viewport: gl.getUniformLocation(program, 'u_viewport'),
      pose: gl.getUniformLocation(program, 'u_pose'),
      rightAccentOffset: gl.getUniformLocation(program, 'u_right_accent_offset'),
      rightAccentOpacity: gl.getUniformLocation(program, 'u_right_accent_opacity'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
      grain: gl.getUniformLocation(program, 'u_grain'),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, SHADER_DPR_CAP);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      return dpr;
    };

    const currentScene = (now: number): Scene =>
      transition ? interpolateScene(transition, now) : scene;

    const render = (now: number) => {
      frame = 0;
      if (disposed || !program) return;

      const dpr = resize();
      scene = currentScene(now);
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.viewport, canvas.clientWidth, canvas.clientHeight);
      gl.uniform2f(uniforms.pose, scene.pose[0], scene.pose[1]);
      gl.uniform2f(
        uniforms.rightAccentOffset,
        scene.rightAccentOffset[0],
        scene.rightAccentOffset[1],
      );
      gl.uniform1f(uniforms.rightAccentOpacity, scene.rightAccentOpacity);
      gl.uniform1f(uniforms.dpr, dpr);
      gl.uniform1f(uniforms.grain, GRAIN_OPACITY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (transition && now >= transition.start + transition.duration) {
        scene = transition.to;
        transition = null;
      }
      if (transition) frame = window.requestAnimationFrame(render);
    };

    const scheduleRender = () => {
      if (!disposed && frame === 0) frame = window.requestAnimationFrame(render);
    };

    const applyScene = (target: Scene, duration: number, easing: Easing) => {
      const now = window.performance.now();
      scene = currentScene(now);
      transition = duration > 0
        ? { from: scene, to: target, start: now, duration, easing }
        : null;
      if (!transition) scene = target;
      scheduleRender();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleRender();
    };

    resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(canvas);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    applyScene(scene, 0, motionEasing.standard);

    controllerRef.current = {
      setMode(nextMode, immediate) {
        window.clearTimeout(wakeTimer);
        window.clearTimeout(settleTimer);
        applyScene(
          SCENES[nextMode],
          immediate ? 0 : motionDurationMs.extended,
          motionEasing.standard,
        );
      },
    };

    if (shouldAnimateRef.current) {
      wakeTimer = window.setTimeout(() => {
        applyScene(SCENES.wake, agentStudioWelcomeRiseDurationMs, motionEasing.entrance);
      }, agentStudioWelcomeWakeDelayMs);
      settleTimer = window.setTimeout(() => {
        applyScene(SCENES.home, agentStudioWelcomeMoveDurationMs, motionEasing.standard);
      }, agentStudioWelcomeWakeDelayMs + agentStudioWelcomeRiseDurationMs);
    }

    return () => {
      disposed = true;
      controllerRef.current = null;
      window.clearTimeout(wakeTimer);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      if (vertexArray) gl.deleteVertexArray(vertexArray);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    };
  }, []);

  useEffect(() => {
    const modeChanged = previousModeRef.current !== mode;
    previousModeRef.current = mode;
    if (modeChanged || reducedMotion) {
      controllerRef.current?.setMode(mode, reducedMotion);
    }
  }, [mode, reducedMotion]);

  if (unavailable) return <AgentStudioMotionBackground mode={mode} />;

  return (
    <canvas
      ref={canvasRef}
      className="agent-studio-shader-background"
      data-renderer="webgl"
      data-background-mode={mode}
      aria-hidden="true"
    />
  );
}
