import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

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
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2 bg-gray-900/30">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <h3 className="text-white font-semibold">Active Alerts</h3>
        <div className="ml-auto text-xs text-gray-500">
          {alerts.length} active issues
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 font-medium">Agent</th>
              <th className="px-6 py-3 font-medium">Issue</th>
              <th className="px-6 py-3 font-medium">Current Value</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {alerts.map((alert) => (
              <tr 
                key={alert.id} 
                className={`group cursor-pointer transition-colors ${
                  selectedAlertId === alert.id 
                    ? 'bg-gray-800/50' 
                    : 'hover:bg-gray-800/30'
                }`}
                onClick={() => onAlertClick(alert)}
              >
                <td className="px-6 py-4">
                  <span className="text-white font-medium group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {alert.agent}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                    alert.severity === 'high' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {alert.issue}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300 font-mono text-sm">{alert.value}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-gray-400 text-sm">{alert.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`flex items-center justify-end gap-2 text-sm ${selectedAlertId === alert.id ? 'text-blue-400' : 'text-gray-600'}`}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">View Interactions</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedAlertId === alert.id ? 'rotate-90' : ''}`} />
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
