/**
 * Reusable class fragments for CLUS KPI UI so surfaces follow Momentum tokens
 * (html.mds-theme-stable-lightWebex | darkWebex from ThemeContext).
 */
export const ck = {
  text: 'clus-kpi-ck-text',
  textMuted: 'clus-kpi-ck-text-muted',
  /** Semantic status (Momentum): green */
  textSuccess: 'clus-kpi-ck-text-success',
  /** Semantic status (Momentum): red */
  textError: 'clus-kpi-ck-text-error',
  /** Semantic status (Momentum): yellow / amber */
  textWarning: 'clus-kpi-ck-text-warning',
  /** Links and primary emphasis */
  textAccent: 'clus-kpi-ck-text-accent',
  /** Icons or labels on accent / high-contrast surfaces (e.g. agent avatar on accent fill) */
  textInverted: 'clus-kpi-ck-text-inverted',
  /** Icon / text on `background-accent-normal` — common token stays light in light + dark Webex (inverted-text swaps per theme) */
  textOnAccent: 'clus-kpi-ck-text-on-accent',
  borderDefault: 'clus-kpi-ck-border',
  /** Interaction transcript: customer bubble (sharp corner toward thread center / avatar) */
  chatBubbleCustomer: 'clus-kpi-chat-bubble-customer',
  /** Interaction transcript: agent bubble */
  chatBubbleAgent: 'clus-kpi-chat-bubble-agent',
  bgDeep: 'clus-kpi-ck-bg-deep',
  bgSurface: 'clus-kpi-ck-bg-surface',
  bgHover: 'clus-kpi-ck-bg-hover',
  bgSubtle: 'clus-kpi-ck-bg-subtle',
  divide: 'clus-kpi-ck-divide-y',
  hoverText: 'clus-kpi-ck-hover-text',
  /** Pinned / category blocks in Observability (h2), and table section titles (h2) — Momentum type tokens */
  sectionHeading: 'mds-type-section-title clus-kpi-section-heading',
  /** Toolbar title above a table (h3), e.g. Agent overview — not column `th` labels */
  tableTitle: 'mds-type-section-title clus-kpi-table-title',
  /** Class names for Momentum font tokens (see index.css `.mds-type-*`) */
  typo: {
    bodyMidsizeMedium: 'mds-type-body-midsize-medium',
    bodyMidsizeRegular: 'mds-type-body-midsize-regular',
    bodySmallRegular: 'mds-type-body-small-regular',
    bodyLargeMedium: 'mds-type-body-large-medium',
    headingLargeMedium: 'mds-type-heading-large-medium',
    sectionTitle: 'mds-type-section-title',
  },
} as const;

/**
 * App-wide page / section title + lede — pair with global `.app-page-description` in `index.css`.
 * Use `PageHeadingStack` or apply `pageCopy.headingBlock` to the wrapper.
 */
export const pageCopy = {
  headingBlock: 'app-heading-block',
  /** Momentum body midsize + secondary color (same tokens as Integrations / Observability ledes) */
  description: 'app-page-description',
  descriptionMaxWidth: 'max-w-[42rem]',
} as const;

/**
 * Shared table chrome for CLUS (Observability Agent overview = source of truth).
 * Use with `.clus-kpi-agent-table` in `index.css` for cell padding and row borders.
 */
export const clusKpiTable = {
  card: 'clus-kpi-table-card',
  /** Tighter th/td rhythm for Simulated testing Scenarios + Change log tables only */
  cardTestingCompact: 'clus-kpi-table-card clus-kpi-table-card--testing-compact',
  scroll: 'clus-kpi-table-scroll',
  table: 'clus-kpi-agent-table',
  thead: 'clus-kpi-table-thead',
  theadRow: 'clus-kpi-table-thead-row',
  th: 'clus-kpi-table-th',
  thSortable: 'clus-kpi-table-th clus-kpi-table-th--sortable',
  tbody: '',
  tr: 'clus-kpi-table-tr',
  td: 'clus-kpi-table-td',
  tableFooter: 'clus-kpi-table-footer',
} as const;

/** For SVG `fill` / `stroke` and chart libraries that need raw color strings */
export const momentumColorVars = {
  success: 'var(--mds-color-theme-text-success-normal)',
  error: 'var(--mds-color-theme-text-error-normal)',
  warning: 'var(--mds-color-theme-text-warning-normal)',
  accent: 'var(--mds-color-theme-text-accent-normal)',
} as const;

/**
 * Bar/column fill: lighter emphasis at top → base at bottom (Momentum text tokens).
 * Hover tokens read lighter than normal in dark/light Webex themes for accent/success/error.
 */
export const chartBarGradientTokens = {
  accent: {
    top: '--mds-color-theme-text-accent-hover',
    bottom: '--mds-color-theme-text-accent-normal',
  },
  success: {
    top: '--mds-color-theme-text-success-hover',
    bottom: '--mds-color-theme-text-success-normal',
  },
  error: {
    top: '--mds-color-theme-text-error-hover',
    bottom: '--mds-color-theme-text-error-normal',
  },
  /** Stacked secondary series — primary → secondary body text */
  muted: {
    top: '--mds-color-theme-text-primary-normal',
    bottom: '--mds-color-theme-text-secondary-normal',
  },
} as const;

/** Resolve a theme CSS variable to a computed color (for canvas-based charts). */
export function resolveThemeColor(cssVarName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  return v || fallback;
}

/** ECharts linear gradient using token names; fallbacks when vars are unavailable (e.g. SSR). */
export function echartsBarGradientFromThemeTokens(
  pair: { readonly top: string; readonly bottom: string },
  fallback: { top: string; bottom: string },
) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    global: false,
    colorStops: [
      { offset: 0, color: resolveThemeColor(pair.top, fallback.top) },
      { offset: 1, color: resolveThemeColor(pair.bottom, fallback.bottom) },
    ],
  };
}
