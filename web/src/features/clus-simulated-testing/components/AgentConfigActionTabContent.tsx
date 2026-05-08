import { useState } from 'react';
import { Link, Text } from '@momentum-design/components/react';
import { Button, Icon, Toggle } from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { AgentTabPanelHeader } from './AgentTabPanelHeader';

type ActionControls = 'none' | 'edit-delete' | 'delete-only';

type ActionRow = {
  id: string;
  name: string;
  createdBy: string;
  description: string;
  lastUpdated: string;
  actionType: string;
  controls: ActionControls;
  defaultEnabled: boolean;
};

const ACTION_ROWS: ActionRow[] = [
  {
    id: 'agent-handover',
    name: 'Agent handover',
    createdBy: 'System',
    description: 'Connect the customer to a live or callback agent when they ask for a person.',
    lastUpdated: '15 Dec 25, 3:09 PM',
    actionType: 'System',
    controls: 'none',
    defaultEnabled: true,
  },
  {
    id: 'transfer-to-collections',
    name: 'TransferToCollections',
    createdBy: 'billing_ops',
    description: 'Route to collections for past-due balances, charge disputes, or hardship.',
    lastUpdated: '16 Apr 26, 2:33 PM',
    actionType: 'Transfer',
    controls: 'edit-delete',
    defaultEnabled: true,
  },
  {
    id: 'schedule-payment',
    name: 'SchedulePayment',
    createdBy: 'billing_ops',
    description: 'Set up a one-time payment or a short payment plan.',
    lastUpdated: '2 Mar 26, 11:22 AM',
    actionType: 'Custom',
    controls: 'edit-delete',
    defaultEnabled: false,
  },
  {
    id: 'get-payment-methods',
    name: 'get_payment_methods',
    createdBy: 'billing_ops',
    description: 'List saved cards and bank accounts on file for the account.',
    lastUpdated: '21 Apr 26, 2:31 PM',
    actionType: 'MCP',
    controls: 'delete-only',
    defaultEnabled: true,
  },
];

function ActionControlsCell({
  variant,
  actionLabel,
}: {
  variant: ActionControls;
  actionLabel: string;
}) {
  if (variant === 'none') {
    return <span className={ck.textMuted} aria-hidden="true">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {variant === 'edit-delete' && (
        <>
          <Button
            type="button"
            color="default"
            variant="tertiary"
            size={32}
            prefixIcon="edit-bold"
            aria-label={`Edit ${actionLabel}`}
          />
          <Button
            type="button"
            color="default"
            variant="tertiary"
            size={32}
            prefixIcon="delete-bold"
            aria-label={`Delete ${actionLabel}`}
          />
        </>
      )}
      {variant === 'delete-only' && (
        <Button
          type="button"
          color="default"
          variant="tertiary"
          size={32}
          prefixIcon="delete-bold"
          aria-label={`Delete ${actionLabel}`}
        />
      )}
    </div>
  );
}

export function AgentConfigActionTabContent() {
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ACTION_ROWS.map((r) => [r.id, r.defaultEnabled]))
  );

  return (
    <section className="agent-config-action-tab flex flex-col gap-4" aria-labelledby="agent-config-action-heading">
      <AgentTabPanelHeader
        id="agent-config-action-heading"
        title="Actions"
        description="Turn tools and workflows on or off for this agent. Changes apply to new conversations."
        trailing={
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-4">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link href="#action-help" size="midsize" onClick={(e) => e.preventDefault()}>
                What is an action?
              </Link>
              <Icon
                name="info-circle-bold"
                size={16}
                lengthUnit="px"
                className={ck.textAccent}
                aria-hidden
              />
            </div>
            <Button
              type="button"
              color="default"
              variant="secondary"
              size={32}
              prefixIcon="plus-bold"
            >
              Add actions
            </Button>
          </div>
        }
      />

      <div className={clusKpiTable.card}>
        <div className={clusKpiTable.scroll}>
          <table className={`${clusKpiTable.table} w-full table-fixed`}>
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[11%]" />
              <col className="w-[36%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={`${clusKpiTable.th} whitespace-nowrap`}>
                  Action name
                </th>
                <th scope="col" className={`${clusKpiTable.th} whitespace-nowrap`}>
                  Created by
                </th>
                <th scope="col" className={`${clusKpiTable.th} min-w-0`}>
                  Description
                </th>
                <th scope="col" className={`${clusKpiTable.th} whitespace-nowrap`}>
                  Last updated
                </th>
                <th scope="col" className={`${clusKpiTable.th} whitespace-nowrap`}>
                  Action type
                </th>
                <th scope="col" className={`${clusKpiTable.th} whitespace-nowrap text-right`}>
                  Controls
                </th>
              </tr>
            </thead>
            <tbody>
              {ACTION_ROWS.map((row) => (
                <tr key={row.id} className={clusKpiTable.tr}>
                  <td className={`${clusKpiTable.td} align-middle`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <Toggle
                        size="compact"
                        checked={enabledById[row.id] ?? row.defaultEnabled}
                        aria-label={`Enable ${row.name}`}
                        onChange={() =>
                          setEnabledById((prev) => {
                            const cur = prev[row.id] ?? row.defaultEnabled;
                            return { ...prev, [row.id]: !cur };
                          })
                        }
                      />
                      <span className="min-w-0 flex-1 truncate" title={row.name}>
                        <Text type="body-midsize-regular" className={ck.text}>
                          {row.name}
                        </Text>
                      </span>
                    </div>
                  </td>
                  <td className={`${clusKpiTable.td} ${ck.text} whitespace-nowrap align-middle`}>
                    {row.createdBy}
                  </td>
                  <td className={`${clusKpiTable.td} min-w-0 align-middle`}>
                    <span className={`block truncate ${ck.text}`} title={row.description}>
                      {row.description}
                    </span>
                  </td>
                  <td className={`${clusKpiTable.td} ${ck.text} whitespace-nowrap tabular-nums align-middle`}>
                    {row.lastUpdated}
                  </td>
                  <td className={`${clusKpiTable.td} ${ck.text} whitespace-nowrap align-middle`}>
                    {row.actionType}
                  </td>
                  <td className={`${clusKpiTable.td} w-0 whitespace-nowrap text-right align-middle`}>
                    <ActionControlsCell variant={row.controls} actionLabel={row.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
