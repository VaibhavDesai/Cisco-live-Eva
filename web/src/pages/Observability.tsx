import type { ReactNode } from 'react';
import { IconProvider, ThemeProvider } from '@momentum-design/components/react';
import { ThemeModeProvider, useThemeMode } from '../app/ThemeContext';
import { publicAssetUrl } from '../app/publicAsset';
import { ClusKpiDashboardRoot } from '../features/clus-kpi-dashboard/ClusKpiDashboardRoot';

function ObservabilityProviders({ children }: { children: ReactNode }) {
  const { themeClass } = useThemeMode();

  return (
    <ThemeProvider themeclass={themeClass}>
      <IconProvider
        iconSet="custom-icons"
        url={publicAssetUrl('icons').replace(/\/$/, '')}
        fileExtension="svg"
      >
        {children}
      </IconProvider>
    </ThemeProvider>
  );
}

export default function Observability() {
  return (
    <ThemeModeProvider>
      <ObservabilityProviders>
        <ClusKpiDashboardRoot />
      </ObservabilityProviders>
    </ThemeModeProvider>
  );
}
