import { Icon } from '../momentum';
import { ck, clusKpiTable } from '../clus-kpi-theme';

export interface Alert {
  id: number;
  agent: string;
  issue: string;
  value: string;
  status: string;
  severity: 'high' | 'medium' | 'low';
}

const alerts: Alert[] = [
  { id: 1, agent: 'Billing Support', issue: 'High Resolution Time', value: '8.2m', status: 'Live', severity: 'high' },
  { id: 2, agent: 'Tech Assistant', issue: 'Low CSAT', value: '3.2/5', status: 'Live', severity: 'high' },
  { id: 3, agent: 'Returns Bot', issue: 'High Escalation Rate', value: '18%', status: 'Live', severity: 'medium' },
];

interface AlertsTableProps {
  onAlertClick: (alert: Alert) => void;
  selectedAlertId?: number;
}

export function AlertsTable({ onAlertClick, selectedAlertId }: AlertsTableProps) {
  return (
    <div className={`${clusKpiTable.card} mb-8`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 bg-[var(--mds-color-theme-background-secondary-normal)] ${ck.borderDefault}`}>
        <Icon name="alert-circle-bold" size={20} lengthUnit="px" className={ck.textError} aria-hidden />
        <h3 className={ck.tableTitle}>Active Alerts</h3>
        <div className={`ml-auto text-sm ${ck.textMuted}`}>
          {alerts.length} active issues
        </div>
      </div>
      <div className={clusKpiTable.scroll}>
        <table className={clusKpiTable.table}>
          <thead className={clusKpiTable.thead}>
            <tr className={clusKpiTable.theadRow}>
              <th scope="col" className={clusKpiTable.th}>
                Agent
              </th>
              <th scope="col" className={clusKpiTable.th}>
                Issue
              </th>
              <th scope="col" className={clusKpiTable.th}>
                Current value
              </th>
              <th scope="col" className={clusKpiTable.th}>
                Status
              </th>
              <th scope="col" className={clusKpiTable.th} />
            </tr>
          </thead>
          <tbody className={clusKpiTable.tbody}>
            {alerts.map((alert) => (
              <tr 
                key={alert.id} 
                className={`group cursor-pointer ${clusKpiTable.tr} ${
                  selectedAlertId === alert.id ? 'bg-[var(--mds-color-theme-background-secondary-normal)]' : ''
                }`}
                onClick={() => onAlertClick(alert)}
              >
                <td className={clusKpiTable.td}>
                  <span className={`text-[14px] font-medium group-hover:text-[var(--mds-color-theme-text-accent-normal)] transition-colors flex items-center gap-2 ${ck.text}`}>
                    {alert.agent}
                  </span>
                </td>
                <td className={clusKpiTable.td}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                      alert.severity === 'high'
                        ? `${ck.textError} bg-[color-mix(in_srgb,var(--mds-color-theme-background-alert-error-normal)_42%,var(--mds-color-theme-background-solid-secondary-normal))] border-[color-mix(in_srgb,var(--mds-color-theme-text-error-normal)_28%,transparent)]`
                        : `${ck.textWarning} bg-[color-mix(in_srgb,var(--mds-color-theme-background-alert-warning-normal)_42%,var(--mds-color-theme-background-solid-secondary-normal))] border-[color-mix(in_srgb,var(--mds-color-theme-text-warning-normal)_28%,transparent)]`
                    }`}
                  >
                    {alert.issue}
                  </span>
                </td>
                <td className={`${clusKpiTable.td} font-mono text-[14px] ${ck.textMuted}`}>{alert.value}</td>
                <td className={clusKpiTable.td}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--mds-color-theme-text-success-normal)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--mds-color-theme-text-success-normal)]" />
                    </div>
                    <span className={`text-[14px] ${ck.textMuted}`}>{alert.status}</span>
                  </div>
                </td>
                <td className={`${clusKpiTable.td} text-right`}>
                  <div
                    className={`flex items-center justify-end gap-2 text-[14px] ${
                      selectedAlertId === alert.id ? ck.textAccent : ck.textMuted
                    }`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">View Interactions</span>
                    <Icon
                      name="arrow-right-bold"
                      size={16}
                      lengthUnit="px"
                      className={`transition-transform ${selectedAlertId === alert.id ? 'rotate-90' : ''}`}
                      aria-hidden
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
