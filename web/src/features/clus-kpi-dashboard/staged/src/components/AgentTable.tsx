import { 
  Info, 
  CheckCircle2, 
  FlaskConical, 
  FileText, 
  Ban, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useMemo, useState } from 'react';
import svgPaths from '../imports/svg-pu3pg0146l';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";

// SVG Icon Component
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p36e6200} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

interface AgentRow {
  agentName: string;
  availability: 'Draft' | 'Testing' | 'Live' | 'Disabled';
  totalInteractions: number;
  flaggedInteractions: number;
  avgResolutionTime: string;
  csat: string;
  security: 'Secure' | 'At risk' | 'Review';
  issue?: string;
}

const baseAgents: AgentRow[] = [
  {
    agentName: 'Billing Support',
    availability: 'Live',
    totalInteractions: 4200,
    flaggedInteractions: 66,
    avgResolutionTime: '8.2m',
    csat: '4.8',
    security: 'Secure',
    issue: 'High Resolution Time'
  },
  {
    agentName: 'Tech Assistant',
    availability: 'Testing',
    totalInteractions: 3800,
    flaggedInteractions: 76,
    avgResolutionTime: '4m 15s',
    csat: '3.2/5',
    security: 'At risk',
    issue: 'Low CSAT'
  },
  {
    agentName: 'Returns Bot',
    availability: 'Live',
    totalInteractions: 5100,
    flaggedInteractions: 65,
    avgResolutionTime: '0m 45s',
    csat: '3.9',
    security: 'Review',
    issue: 'High Escalation Rate'
  },
  {
    agentName: 'Agent_Technical',
    availability: 'Draft',
    totalInteractions: 4700,
    flaggedInteractions: 75,
    avgResolutionTime: '8m 20s',
    csat: '-',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Sales',
    availability: 'Disabled',
    totalInteractions: 3200,
    flaggedInteractions: 58,
    avgResolutionTime: '5m 10s',
    csat: '4.0',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Symptoms',
    availability: 'Live',
    totalInteractions: 6000,
    flaggedInteractions: 60,
    avgResolutionTime: '3m 45s',
    csat: '4.7',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Compliance',
    availability: 'Testing',
    totalInteractions: 3600,
    flaggedInteractions: 77,
    avgResolutionTime: '6m 00s',
    csat: '4.1',
    security: 'Review',
  },
  {
    agentName: 'Agent_Feedback',
    availability: 'Live',
    totalInteractions: 4200,
    flaggedInteractions: 74,
    avgResolutionTime: '1m 30s',
    csat: '4.5',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Quality',
    availability: 'Live',
    totalInteractions: 3300,
    flaggedInteractions: 65,
    avgResolutionTime: '2m 15s',
    csat: '4.3',
    security: 'Review',
  },
];

// Generate 91 additional agents to reach 100 total
const additionalAgents = Array.from({ length: 91 }, (_, i) => ({
  agentName: `Agent_${String(i + 1).padStart(3, '0')}`,
  availability: ['Live', 'Testing', 'Draft', 'Disabled'][Math.floor(Math.random() * 4)] as any,
  totalInteractions: Math.floor(Math.random() * 5000) + 1000,
  flaggedInteractions: Math.floor(Math.random() * 100),
  avgResolutionTime: `${Math.floor(Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s`,
  csat: (3 + Math.random() * 2).toFixed(1),
  security: ['Secure', 'At risk', 'Review'][Math.floor(Math.random() * 3)] as any,
  issue: undefined
}));

export const agentData: AgentRow[] = [...baseAgents, ...additionalAgents];

// Helper to parse duration string to seconds
const parseDuration = (duration: string): number => {
  let minutes = 0;
  let seconds = 0;
  
  const mMatch = duration.match(/(\d+(?:\.\d+)?)m/);
  if (mMatch) minutes = parseFloat(mMatch[1]);
  
  const sMatch = duration.match(/(\d+)s/);
  if (sMatch) seconds = parseInt(sMatch[1]);
  
  return minutes * 60 + seconds;
};

// Helper to parse CSAT
const parseCSAT = (csat: string): number => {
  if (csat === '-') return -1;
  return parseFloat(csat.split('/')[0]);
};

type SortConfig = {
  key: keyof AgentRow | 'issue';
  direction: 'asc' | 'desc';
} | null;

const ITEMS_PER_PAGE = 20;

export function AgentTable({ onAgentClick }: { onAgentClick?: (agentName: string) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'desc' });

  const handleSort = (key: keyof AgentRow) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null; // Reset to default (which we might define as no sort or issue sort)
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof AgentRow) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-600 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-white" />
      : <ArrowDown className="w-4 h-4 text-white" />;
  };

  const filteredData = useMemo(() => {
    let data = [...agentData];

    // Filter
    if (searchQuery) {
      data = data.filter(agent => 
        agent.agentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      data.sort((a, b) => {
        const { key, direction } = sortConfig;
        let comparison = 0;

        switch (key) {
          case 'issue':
            // Sort by presence of issue
            const aIssue = a.issue ? 1 : 0;
            const bIssue = b.issue ? 1 : 0;
            comparison = aIssue - bIssue;
            break;
          case 'avgResolutionTime':
            comparison = parseDuration(a.avgResolutionTime) - parseDuration(b.avgResolutionTime);
            break;
          case 'csat':
            comparison = parseCSAT(a.csat) - parseCSAT(b.csat);
            break;
          default:
            if (a[key] === undefined && b[key] === undefined) comparison = 0;
            else if (a[key] === undefined) comparison = -1;
            else if (b[key] === undefined) comparison = 1;
            else if (a[key]! < b[key]!) comparison = -1;
            else if (a[key]! > b[key]!) comparison = 1;
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    } else {
        // Default sort: Issues on top
        data.sort((a, b) => {
            if (a.issue && !b.issue) return -1;
            if (!a.issue && b.issue) return 1;
            return 0;
        });
    }

    return data;
  }, [searchQuery, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-none bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <h3 className="text-white">Agent overview</h3>
          <Info className="w-4 h-4 text-gray-600" />
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-800 rounded-lg pl-10 pr-4 py-1.5 text-gray-300 placeholder-gray-600 w-[200px]"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-[#1a1a1a] sticky top-0 z-10">
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead 
                className="text-gray-400 font-medium min-w-[180px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('agentName')}
              >
                <div className="flex items-center gap-2">
                  Agent name
                  {getSortIcon('agentName')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[200px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('issue')}
              >
                <div className="flex items-center gap-2">
                  Issue
                  {getSortIcon('issue')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[130px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('availability')}
              >
                <div className="flex items-center gap-2">
                  Availability
                  {getSortIcon('availability')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[150px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('totalInteractions')}
              >
                <div className="flex items-center gap-2">
                  Total interactions
                  {getSortIcon('totalInteractions')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[160px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('flaggedInteractions')}
              >
                <div className="flex items-center gap-2">
                  Flagged interactions
                  {getSortIcon('flaggedInteractions')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[150px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('avgResolutionTime')}
              >
                <div className="flex items-center gap-2">
                  Avg resolution time
                  {getSortIcon('avgResolutionTime')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[100px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('csat')}
              >
                <div className="flex items-center gap-2">
                  CSAT
                  {getSortIcon('csat')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-400 font-medium min-w-[130px] cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => handleSort('security')}
              >
                <div className="flex items-center gap-2">
                  Security
                  {getSortIcon('security')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((agent, index) => (
              <TableRow key={index} className="border-gray-800 hover:bg-[#252525]">
                <TableCell className="font-medium">
                  <button 
                    onClick={() => onAgentClick?.(agent.agentName)}
                    className="text-blue-500 hover:underline hover:text-blue-400 transition-colors"
                  >
                    {agent.agentName}
                  </button>
                </TableCell>
                <TableCell>
                  {agent.issue && (
                    <div className="flex items-center gap-2 text-red-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>{agent.issue}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const status = agent.availability;
                    let Icon = FileText;
                    let colorClass = 'text-gray-400';

                    if (status === 'Live') {
                      Icon = CheckCircle2;
                      colorClass = 'text-emerald-500';
                    } else if (status === 'Testing') {
                      Icon = FlaskConical;
                      colorClass = 'text-orange-500';
                    } else if (status === 'Draft') {
                      Icon = FileText;
                      colorClass = 'text-gray-400';
                    } else if (status === 'Disabled') {
                      Icon = Ban;
                      colorClass = 'text-gray-500';
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                        <span className={colorClass}>{status}</span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-gray-300">{agent.totalInteractions}</TableCell>
                <TableCell className="text-gray-300">{agent.flaggedInteractions}</TableCell>
                <TableCell className="text-gray-300">{agent.avgResolutionTime}</TableCell>
                <TableCell className="text-gray-300">{agent.csat}</TableCell>
                <TableCell>
                  {(() => {
                    const health = agent.security;
                    let Icon = ShieldCheck;
                    let colorClass = 'text-emerald-500';

                    if (health === 'Secure') {
                      Icon = ShieldCheck;
                      colorClass = 'text-emerald-500';
                    } else if (health === 'At risk') {
                      Icon = ShieldAlert;
                      colorClass = 'text-red-500';
                    } else if (health === 'Review') {
                      Icon = AlertTriangle;
                      colorClass = 'text-orange-500';
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                        <span className={colorClass}>{health}</span>
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {Math.min(filteredData.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredData.length, currentPage * ITEMS_PER_PAGE)} of {filteredData.length} agents
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-gray-300">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
