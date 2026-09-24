// Landing motion values from Dialog OS. Keep these local to the new-agent
// experience so the existing animation system on other routes is unchanged.
export const motionDurationMs = {
  fast: 200,
  slow: 600,
  sustained: 1200,
  extended: 2400,
} as const;

export const motionEasing = {
  entrance: [0, 0, 0.2, 1],
  standard: [0.44, 0, 0, 1],
} as const;
