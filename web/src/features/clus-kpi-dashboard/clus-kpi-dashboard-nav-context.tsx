import { createContext, useContext } from 'react';

export type ClusKpiDashboardNav = {
  /** Open an interaction detail in the Observability Interactions tab and sync the URL hash. */
  openInteraction: (id: string) => void;
};

export const ClusKpiDashboardNavContext = createContext<ClusKpiDashboardNav | null>(null);

export function useClusKpiDashboardNav(): ClusKpiDashboardNav | null {
  return useContext(ClusKpiDashboardNavContext);
}
