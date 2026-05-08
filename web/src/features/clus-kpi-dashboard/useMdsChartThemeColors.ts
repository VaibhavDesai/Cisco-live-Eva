import { useMemo } from 'react';
import { useThemeMode } from '../../app/ThemeContext';

export interface MdsChartThemeColors {
  textPrimary: string;
  textSecondary: string;
  surface: string;
  outline: string;
  tooltipBg: string;
  tooltipBorder: string;
  axisLabel: string;
  splitLine: string;
  secondarySeries: string;
  pieOther: string;
  /** Momentum semantic — green */
  success: string;
  /** Momentum semantic — red */
  error: string;
  /** Momentum semantic — yellow */
  warning: string;
  /** Accent / links */
  accent: string;
  /** Focus / control emphasis (e.g. brush border) */
  controlActive: string;
}

function readVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function useMdsChartThemeColors(): MdsChartThemeColors {
  const { theme } = useThemeMode();
  return useMemo(
    () => ({
      textPrimary: readVar('--mds-color-theme-text-primary-normal', '#f5f5f5'),
      textSecondary: readVar('--mds-color-theme-text-secondary-normal', '#8a939b'),
      surface: readVar('--mds-color-theme-background-solid-secondary-normal', '#2a2d33'),
      outline: readVar('--mds-color-theme-outline-secondary-normal', '#3d4249'),
      tooltipBg: readVar('--mds-color-theme-background-solid-secondary-normal', '#2a2d33'),
      tooltipBorder: readVar('--mds-color-theme-outline-secondary-normal', '#3d4249'),
      axisLabel: readVar('--mds-color-theme-text-secondary-normal', '#8a939b'),
      splitLine: readVar('--mds-color-theme-outline-secondary-normal', '#3d4249'),
      secondarySeries: readVar('--mds-color-theme-text-secondary-normal', '#6b7280'),
      pieOther: readVar('--mds-color-theme-outline-primary-normal', '#4b5563'),
      success: readVar('--mds-color-theme-text-success-normal', '#1a8a3f'),
      error: readVar('--mds-color-theme-text-error-normal', '#d4371c'),
      warning: readVar('--mds-color-theme-text-warning-normal', '#b38600'),
      accent: readVar('--mds-color-theme-text-accent-normal', '#0353a8'),
      controlActive: readVar('--mds-color-theme-control-active-normal', '#2a66ff'),
    }),
    [theme],
  );
}
