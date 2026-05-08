import svgPaths from '../imports/svg-pu3pg0146l';
import { MoreHorizontal, Eye, ArrowLeft, CheckCircle2, FlaskConical, FileText, Ban } from 'lucide-react';

function BotIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
        <path d="M12 2L12 5M12 5C10.3431 5 9 6.34315 9 8L9 9M12 5C13.6569 5 15 6.34315 15 8L15 9M9 9C7.34315 9 6 10.3431 6 12L6 16C6 17.6569 7.34315 19 9 19L15 19C16.6569 19 18 17.6569 18 16L18 12C18 10.3431 16.6569 9 15 9M9 9L15 9M9 13L9 13.01M15 13L15 13.01M9 17L15 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      </svg>
    </div>
  );
}

interface PageHeaderProps {
  agentName?: string;
  status?: 'Live' | 'Testing' | 'Draft' | 'Disabled' | 'Published';
  lastUpdated?: string;
  updatedBy?: string;
  activeTab?: 'Configuration' | 'Interactions' | 'History' | 'Analytics';
  onTabChange?: (tab: 'Configuration' | 'Interactions' | 'History' | 'Analytics') => void;
  onBack?: () => void;
}

export function PageHeader({ 
  agentName = 'Acme Bank Credit Card Assistant',
  status = 'Live',
  lastUpdated = '05/25/2025',
  updatedBy = 'Ayesh Reddy',
  activeTab = 'Analytics',
  onTabChange,
  onBack
}: PageHeaderProps) {
  const tabs = ['Configuration', 'Interactions', 'History', 'Analytics'] as const;

  const getStatusDisplay = (status: string) => {
    let Icon = FileText;
    let colorClass = 'text-gray-400';

    if (status === 'Live' || status === 'Published') {
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
        <span className={colorClass}>{status === 'Published' ? 'Live' : status}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4 border-b border-[rgba(255,255,255,0.1)]">
      {/* Top Section - Agent Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <BotIcon />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl">{agentName}</h1>
              {getStatusDisplay(status)}
            </div>
            <p className="text-[rgba(255,255,255,0.5)] text-sm">
              Last updated on {lastUpdated} by {updatedBy}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.3)] rounded-lg text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button className="p-2 bg-transparent border border-[rgba(255,255,255,0.3)] rounded-lg text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Section - Tabs */}
      <div className="flex gap-1 p-[3px] -m-[3px]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-white text-black'
                : 'bg-transparent text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}