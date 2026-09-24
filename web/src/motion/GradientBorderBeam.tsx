import type { CSSProperties } from 'react';

const opacityRamp = [
  0.02, 0.17, 0.46, 0.89, 1.46, 2.15, 2.97, 3.91, 4.97, 6.14, 7.41,
  8.78, 10.25, 11.81, 13.45, 15.18, 16.99, 18.86, 20.8, 22.81,
  24.87, 26.99, 29.15, 31.36, 33.61, 35.89, 38.2, 40.53, 42.88,
  45.24, 47.62, 50, 52.38, 54.76, 57.12, 59.47, 61.8, 64.11, 66.39,
  68.64, 70.85, 73.01, 75.13, 77.19, 79.2, 81.14, 83.01, 84.82,
  86.55, 88.19, 89.75, 91.22, 92.59, 93.86, 95.03, 96.09, 97.03,
  97.85, 98.54, 99.11, 99.54, 99.83, 99.98,
];

const colors = [
  [255, 0, 127],
  [255, 144, 0],
  [2, 200, 255],
  [10, 96, 255],
] as const;

function colorAt(progress: number) {
  const scaledProgress = progress * (colors.length - 1);
  const colorIndex = Math.min(
    Math.floor(scaledProgress),
    colors.length - 2,
  );
  const localProgress = scaledProgress - colorIndex;
  const startColor = colors[colorIndex];
  const endColor = colors[colorIndex + 1];
  const channel = (index: number) =>
    Math.round(
      startColor[index] +
        (endColor[index] - startColor[index]) * localProgress,
    );

  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

const opacities = [
  ...opacityRamp,
  ...Array.from({ length: 54 }, () => 100),
  ...opacityRamp.slice().reverse(),
];

const segments = opacities.map((opacity, index, allSegments) => ({
  color: colorAt(index / (allSegments.length - 1)),
  offset: (73.049 * index) / allSegments.length,
  opacity: opacity / 100,
}));

export function GradientBorderBeamLayer({
  className,
  segmentClassName,
}: {
  className: string;
  segmentClassName: string;
}) {
  return (
    <svg className={className} focusable="false" preserveAspectRatio="none">
      {segments.map((segment, index) => (
        <rect
          className={segmentClassName}
          key={index}
          pathLength="100"
          stroke={segment.color}
          style={
            {
              '--gradient-border-beam-segment-offset': `${segment.offset}px`,
              opacity: segment.opacity,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
