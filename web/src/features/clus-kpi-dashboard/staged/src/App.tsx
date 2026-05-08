import { useState, useEffect, useMemo } from 'react';
import { KPICard } from './components/KPICard';
import { KPIChart } from './components/KPIChart';
import { AgentTable, agentData } from './components/AgentTable';
import { FigmaHeader } from './components/FigmaHeader';
import { FigmaSidebar } from './components/FigmaSidebar';
import { FilterBar } from './components/FilterBar';
import { SingleAgentView } from './components/SingleAgentView';
import { InteractionPageNew } from './components/InteractionPageNew';
import { ObservabilityView } from './components/ObservabilityView';
import { AIAgentsView } from './components/AIAgentsView';
import { PageHeader } from './components/PageHeader';
import { Check, Plus, Upload } from 'lucide-react';
import imgCoreAppShell from "figma:asset/c22556a75f9b2248e5bb2e52bdc5eea23430dc90.png";
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { InteractionsTab } from "./components/InteractionsTab";
import { Calendar } from './components/ui/calendar';
import { Checkbox } from './components/ui/checkbox';
import { ScrollArea } from './components/ui/scroll-area';
import { addDays } from 'date-fns';
import svgPaths from './imports/svg-pu3pg0146l';
import { Fragment } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './components/ui/button';

// SVG Icon Components
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p36e6200} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p183c4100} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p18419480} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p17448a00} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p333e5200} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function AudioBroadcastIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p3e918280} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p376300} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.pc612580} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p2c9efd00} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.pd51e900} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function TestTubeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
      <path d={svgPaths.p27eceb00} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

export interface KPIData {
  id: string;
  category: string;
  heading: string;
  description: string;
  value: string;
  unit: string;
  change: string;
  isPositive: boolean;
  chartType: 'line' | 'line-threshold' | 'area' | 'bar' | 'stacked-bar' | 'histogram' | 'pie' | 'donut' | 'grouped-bar' | 'column' | 'stacked-area';
  sparklineData?: number[];
  sparklineType?: 'line' | 'area' | 'bar';
  curveType?: 'monotone' | 'linear' | 'step';
}

// Map chart type to sparkline type
function getSparklineType(chartType: KPIData['chartType']): 'line' | 'area' | 'bar' {
  switch (chartType) {
    case 'area':
    case 'stacked-area':
      return 'area';
    case 'bar':
    case 'stacked-bar':
    case 'histogram':
    case 'grouped-bar':
    case 'column':
      return 'bar';
    case 'line':
    case 'line-threshold':
    case 'pie':
    case 'donut':
    default:
      return 'line';
  }
}

// Generate sparkline data based on trend and date range
function generateSparkline(changePercent: string, isPositive: boolean, dateRange: string, seed: number = 0, targetValueStr?: string): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;
  
  let targetMean = 50;
  if (targetValueStr) {
    const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
    if (match) {
       targetMean = parseFloat(match[0].replace(/,/g, ''));
    }
  }
  
  // Determine number of points based on date range
  let points: number;
  switch (dateRange) {
    case '24h':
      points = 24; // Hourly data
      break;
    case 'week':
      points = 7; // Daily data
      break;
    case 'month':
      points = 30; // Daily data
      break;
    case '90d':
      points = 90; // Daily data
      break;
    default:
      points = 12;
  }
  
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  
  // Scale variance based on magnitude (approx 10-20% range)
  const varianceScale = targetMean === 0 ? 5 : Math.abs(targetMean) * 0.15;

  // Generate base walk
  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);
  
  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    // Trend adds up over time
    const trendStep = (trendDirection * (Math.abs(change) / 100) * varianceScale) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;
    
    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }
  
  // Center around targetMean
  const currentAvg = rawData.reduce((a,b) => a+b, 0) / rawData.length;
  const shift = targetMean - currentAvg;
  const isPercentage = targetValueStr ? targetValueStr.includes('%') : false;
  
  return rawData.map(v => {
    let final = v + shift;
    if (targetMean >= 0) final = Math.max(0, final);
    if (isPercentage) final = Math.min(100, final);
    return final;
  });
}

// Generate sparkline data for ratings (0-5 scale)
function generateRatingSparkline(changePercent: string, isPositive: boolean, dateRange: string, seed: number = 0, targetValueStr?: string): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;
  
  let targetMean = 4.2;
  if (targetValueStr) {
     const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
     if (match) targetMean = parseFloat(match[0]);
  }
  
  let points: number;
  switch (dateRange) {
    case '24h': points = 24; break;
    case 'week': points = 7; break;
    case 'month': points = 30; break;
    case '90d': points = 90; break;
    default: points = 12;
  }
  
  const data: number[] = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  
  const varianceScale = 0.5; // 0.5 stars variance

  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);
  
  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStep = (trendDirection * (Math.abs(change)/100) * 0.5) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;
    
    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }
  
  const currentAvg = rawData.reduce((a,b)=>a+b,0)/rawData.length;
  const shift = targetMean - currentAvg;
  
  return rawData.map(v => {
     let final = v + shift;
     return Math.max(1, Math.min(5, final)); // Clamp 1-5
  });
}

// Generate sparkline data for containment rate (60-80%)
function generateContainmentSparkline(changePercent: string, isPositive: boolean, dateRange: string, seed: number = 0, targetValueStr?: string): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;
  
  let targetMean = 76;
  if (targetValueStr) {
     const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
     if (match) targetMean = parseFloat(match[0]);
  }

  let points: number;
  switch (dateRange) {
    case '24h': points = 24; break;
    case 'week': points = 7; break;
    case 'month': points = 30; break;
    case '90d': points = 90; break;
    default: points = 12;
  }
  
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  
  const varianceScale = 8; // +/- 8 range roughly

  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);
  
  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStep = (trendDirection * (Math.abs(change)/100) * varianceScale) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;
    
    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }
  
  const currentAvg = rawData.reduce((a,b)=>a+b,0)/rawData.length;
  const shift = targetMean - currentAvg;
  
  return rawData.map(v => {
     let final = v + shift;
     return Math.max(0, Math.min(100, final));
  });
}

const kpiData: KPIData[] = [
  // Customer Experience
  { id: 'ce1', category: 'Customer Experience', heading: 'CSAT', description: 'How satisfied customers are with the interaction', value: '4.2', unit: '/5', change: '+8%', isPositive: true, chartType: 'line', sparklineData: generateRatingSparkline('+8%', true, '24h', 1) },
  { id: 'ce2', category: 'Customer Experience', heading: 'Customer Effort Score', description: 'How easy it was for the customer to get help', value: '3.8', unit: '/5', change: '+12%', isPositive: true, chartType: 'line', sparklineData: generateRatingSparkline('+12%', true, '24h', 2) },
  { id: 'ce3', category: 'Customer Experience', heading: 'Containment Rate', description: 'Percent of interactions resolved without human intervention', value: '76%', unit: '', change: '+5%', isPositive: true, chartType: 'area', curveType: 'linear', sparklineData: generateContainmentSparkline('+5%', true, '24h', 3) },
  { id: 'ce4', category: 'Customer Experience', heading: 'First-Contact Resolution', description: 'Percent of issues solved in the first interaction', value: '68%', unit: '', change: '+3%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+3%', true, '24h', 4) },
  { id: 'ce5', category: 'Customer Experience', heading: 'Reopen/Recurrence Rate', description: 'Percent of users who return with the same issue', value: '12%', unit: '', change: '-4%', isPositive: true, chartType: 'bar', sparklineData: generateSparkline('-4%', true, '24h', 5) },
  { id: 'ce6', category: 'Customer Experience', heading: 'Time to First Response', description: 'How quickly the AI replies after the user\'s message', value: '0.8s', unit: '', change: '-15%', isPositive: true, chartType: 'line-threshold', sparklineData: generateSparkline('-15%', true, '24h', 6) },
  { id: 'ce7', category: 'Customer Experience', heading: 'Time to Resolution', description: 'Total time from start to resolution', value: '4.2', unit: 'min', change: '+5%', isPositive: false, chartType: 'line-threshold', sparklineData: generateSparkline('+5%', false, '24h', 7) },
  { id: 'ce8', category: 'Customer Experience', heading: 'Turns to Resolution', description: 'Number of conversational exchanges to resolve an issue', value: '6.4', unit: '', change: '-10%', isPositive: true, chartType: 'histogram', sparklineData: generateSparkline('-10%', true, '24h', 8) },
  { id: 'ce9', category: 'Customer Experience', heading: 'Clarification Rate', description: 'How often the AI must ask for more info', value: '18%', unit: '', change: '-6%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('-6%', true, '24h', 9) },
  { id: 'ce10', category: 'Customer Experience', heading: 'Transfer Rate', description: 'How often chats are escalated to a human', value: '14%', unit: '', change: '+4%', isPositive: false, chartType: 'stacked-bar', sparklineData: generateSparkline('+4%', false, '24h', 10) },
  { id: 'ce11', category: 'Customer Experience', heading: 'Latency Stability (P95)', description: 'Consistency of response time at the 95th percentile', value: '1.2s', unit: '', change: '-5%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('-5%', true, '24h', 11) },
  { id: 'ce12', category: 'Customer Experience', heading: 'Abandonment Rate', description: 'Users who quit before the issue is resolved', value: '9%', unit: '', change: '+2%', isPositive: false, chartType: 'line', sparklineData: generateSparkline('+2%', false, '24h', 12) },
  { id: 'ce13', category: 'Customer Experience', heading: 'Locale Parity Index', description: 'Equality of performance across languages/regions', value: '0.89', unit: '', change: '+3%', isPositive: true, chartType: 'grouped-bar', sparklineData: generateSparkline('+3%', true, '24h', 13) },
  
  // AI Quality
  { id: 'aq1', category: 'AI Quality', heading: 'Task Success Rate', description: 'How often the AI completes tasks correctly', value: '92%', unit: '', change: '+6%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+6%', true, '24h', 14) },
  { id: 'aq2', category: 'AI Quality', heading: 'Hallucination Rate', description: 'Frequency of factually incorrect outputs', value: '2.3%', unit: '', change: '+3%', isPositive: false, chartType: 'bar', sparklineData: generateSparkline('+3%', false, '24h', 15) },
  { id: 'aq3', category: 'AI Quality', heading: 'Instruction Adherence', description: 'Degree to which AI follows provided prompts/instructions', value: '95%', unit: '', change: '+4%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+4%', true, '24h', 16) },
  { id: 'aq4', category: 'AI Quality', heading: 'Safety/Policy Incident Rate', description: 'Rate of safety or compliance violations', value: '0.4%', unit: '', change: '+8%', isPositive: false, chartType: 'column', sparklineData: generateSparkline('+8%', false, '24h', 17) },
  { id: 'aq5', category: 'AI Quality', heading: 'Regression Rate After Change', description: 'How often updates worsen performance', value: '5%', unit: '', change: '-8%', isPositive: true, chartType: 'bar', sparklineData: generateSparkline('-8%', true, '24h', 18) },
  { id: 'aq6', category: 'AI Quality', heading: 'Average Response Confidence', description: 'Average self-rated confidence in outputs', value: '0.87', unit: '', change: '+5%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+5%', true, '24h', 19) },
  
  // Business Impact
  { id: 'bi1', category: 'Business Impact', heading: 'Task/Action Completion Rate', description: 'Percent of requested actions successfully finished', value: '88%', unit: '', change: '+7%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+7%', true, '24h', 20) },
  { id: 'bi2', category: 'Business Impact', heading: 'Deflection From Human Queue', description: 'Portion of queries handled by AI instead of humans', value: '72%', unit: '', change: '+9%', isPositive: true, chartType: 'stacked-area', sparklineData: generateSparkline('+9%', true, '24h', 21) },
  { id: 'bi3', category: 'Business Impact', heading: 'Time Saved per Interaction', description: 'Average reduction in handling time', value: '3.4', unit: 'min', change: '+14%', isPositive: true, chartType: 'column', sparklineData: generateSparkline('+14%', true, '24h', 22) },
  { id: 'bi4', category: 'Business Impact', heading: 'Recontact Rate Reduction', description: 'Drop in customers needing to recontact support', value: '28%', unit: '', change: '+11%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+11%', true, '24h', 23) },
  { id: 'bi5', category: 'Business Impact', heading: 'Escalation Avoidance Rate', description: 'Share of issues prevented from reaching higher-tier support', value: '81%', unit: '', change: '+6%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+6%', true, '24h', 24) },
  
  // Tool Specific
  { id: 'ts1', category: 'Tool Specific', heading: 'Tool Invocation Rate', description: 'How often the AI uses available tools during a task', value: '64%', unit: '', change: '+8%', isPositive: true, chartType: 'stacked-bar', sparklineData: generateSparkline('+8%', true, '24h', 25) },
  { id: 'ts2', category: 'Tool Specific', heading: 'Tool Selection Precision', description: 'Accuracy of choosing the correct tool for the job', value: '93%', unit: '', change: '+5%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+5%', true, '24h', 26) },
  { id: 'ts3', category: 'Tool Specific', heading: 'Tool Selection Recall', description: 'Frequency of using tools when they should be used', value: '89%', unit: '', change: '+7%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+7%', true, '24h', 27) },
  { id: 'ts4', category: 'Tool Specific', heading: 'Tool Use Success Rate', description: 'Share of successful tool executions', value: '96%', unit: '', change: '+3%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+3%', true, '24h', 28) },
  { id: 'ts5', category: 'Tool Specific', heading: 'Tool Error Rate', description: 'Frequency of failed tool calls', value: '4%', unit: '', change: '+6%', isPositive: false, chartType: 'bar', sparklineData: generateSparkline('+6%', false, '24h', 29) },
  { id: 'ts6', category: 'Tool Specific', heading: 'Tool Latency P50', description: 'Median time for tool responses', value: '245', unit: 'ms', change: '+7%', isPositive: false, chartType: 'line', sparklineData: generateSparkline('+7%', false, '24h', 30) },
  { id: 'ts7', category: 'Tool Specific', heading: 'Tool Latency P95', description: 'Slowest 5% of tool responses', value: '890', unit: 'ms', change: '-8%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('-8%', true, '24h', 31) },
  { id: 'ts8', category: 'Tool Specific', heading: 'Fallback Path Success Rate', description: 'Success when recovering from tool failures', value: '78%', unit: '', change: '+10%', isPositive: true, chartType: 'line', sparklineData: generateSparkline('+10%', true, '24h', 32) },
  { id: 'ts9', category: 'Tool Specific', heading: 'Tool Version Regression Rate', description: 'Frequency of degraded performance after version updates', value: '6%', unit: '', change: '-15%', isPositive: true, chartType: 'bar', sparklineData: generateSparkline('-15%', true, '24h', 33) },
];

// Group KPIs by category
const categories = ['Customer Experience', 'AI Quality', 'Business Impact', 'Tool Specific'];
const groupedKPIs = categories.map(category => ({
  category,
  kpis: kpiData.filter(kpi => kpi.category === category)
}));

export default function App() {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<'All' | 'Autonomous' | 'Scripted'>('All');
  const [agentChannels, setAgentChannels] = useState<Set<'Voice' | 'Digital'>>(new Set(['Voice', 'Digital']));
  const [dateRange, setDateRange] = useState<'24h' | 'week' | 'month' | '90d' | 'custom'>('24h');
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});
  const [environment, setEnvironment] = useState<'Live' | 'Testing'>('Live');
  const [stickyChart, setStickyChart] = useState(false);
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>(['ce1', 'bi1', 'ce7']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(['ce1', 'bi1', 'ce7']);
  const [activeView, setActiveView] = useState<'observability' | 'ai-agents'>('observability');
  const [activeTab, setActiveTab] = useState("dashboard");

  // Listen to hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/agent/')) {
        const agentName = hash.replace('#/agent/', '');
        setSelectedAgent(decodeURIComponent(agentName));
        setSelectedInteraction(null);
      } else if (hash.startsWith('#/interaction/')) {
        const interactionId = hash.replace('#/interaction/', '');
        setSelectedInteraction(decodeURIComponent(interactionId));
        setSelectedAgent(null);
        setActiveTab('interactions');
      } else if (hash === '' || hash === '#/') {
        setSelectedAgent(null);
        setSelectedInteraction(null);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Recalculate sparklines when date range changes
  const kpiDataWithSparklines = useMemo(() => {
    return kpiData.map(kpi => {
      let sparklineData: number[];
      
      // Use specific generators based on KPI type
      const seed = parseInt(kpi.id.replace(/\D/g, ''), 10) || 0;
      if (kpi.id === 'ce3') { // Containment Rate
        sparklineData = generateContainmentSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
      } else if (kpi.unit === '/5' || kpi.heading.includes('CSAT')) {
        sparklineData = generateRatingSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
      } else {
        sparklineData = generateSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
      }

      return {
        ...kpi,
        sparklineData,
        sparklineType: getSparklineType(kpi.chartType)
      };
    });
  }, [dateRange]);

  // Filter KPIs based on search query
  const filteredKpiData = useMemo(() => {
    if (!searchQuery.trim()) {
      return kpiDataWithSparklines;
    }
    
    const query = searchQuery.toLowerCase();
    return kpiDataWithSparklines.filter(kpi => 
      kpi.heading.toLowerCase().includes(query)
    );
  }, [kpiDataWithSparklines, searchQuery]);

  const activeKPI = filteredKpiData.find(k => k.id === activeCardId);
  
  const togglePin = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setPinnedCardIds(prev => {
      const index = prev.indexOf(cardId);
      if (index > -1) {
        // Remove the card
        return prev.filter(id => id !== cardId);
      } else {
        // Add the card
        return [...prev, cardId];
      }
    });
  };

  const movePinnedCard = (dragIndex: number, hoverIndex: number) => {
    setPinnedCardIds(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      return newOrder;
    });
  };

  const toggleChannel = (channel: 'Voice' | 'Digital') => {
    const newChannels = new Set(agentChannels);
    if (newChannels.has(channel)) {
      newChannels.delete(channel);
    } else {
      newChannels.add(channel);
    }
    setAgentChannels(newChannels);
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '24h': return 'Last 24 hours';
      case 'week': return 'Last week';
      case 'month': return 'Last month';
      case '90d': return 'Last 90 days';
      case 'custom': return 'Select date range';
      default: return 'Last 24 hours';
    }
  };

  const filtersContent = (
    <div className="flex gap-3 items-center flex-wrap">
      {/* Show Filters Toggle */}
      <button
        onClick={() => setShowFilterBar(!showFilterBar)}
        className={`flex items-center gap-1.5 px-3 py-[5.5px] rounded-lg transition-colors ${
          showFilterBar 
            ? 'bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.7)] text-[rgba(255,255,255,0.95)]' 
            : 'bg-transparent border border-[rgba(255,255,255,0.5)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)]'
        }`}
      >
        <FilterIcon />
        <span>{showFilterBar ? 'Hide filters' : 'Show filters'}</span>
      </button>
      
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-[400px]">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder={activeView === 'ai-agents' ? "Search agents, metrics and interactions" : "Search metrics"}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg pl-10 pr-4 py-[5.5px] text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.7)]"
        />
      </div>
      
      {/* Analytics Filter - Only for AI Agents View */}
      {activeView === 'ai-agents' && (
      <Popover>
        <PopoverTrigger className="flex items-center gap-1.5 px-3 py-[5.5px] bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)] transition-colors">
          <TestTubeIcon />
          <span>Analytics</span>
          <ArrowDownIcon />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 bg-[#1a1a1a] border border-gray-800">
          <div className="p-3 border-b border-gray-800">
            <h4 className="font-medium text-white text-sm">Select Analytics</h4>
          </div>
          <ScrollArea className="h-80">
            <div className="p-3 space-y-4">
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{category}</h5>
                  <div className="space-y-1">
                    {kpiData.filter(k => k.category === category).map(kpi => (
                      <div key={kpi.id} className="flex items-start space-x-3 p-1.5 hover:bg-white/5 rounded group">
                        <Checkbox 
                          id={`metric-${kpi.id}`}
                          checked={selectedMetricIds.includes(kpi.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetricIds([...selectedMetricIds, kpi.id]);
                            } else {
                              setSelectedMetricIds(selectedMetricIds.filter(id => id !== kpi.id));
                            }
                          }}
                          className="mt-1 border-gray-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
                        />
                        <label 
                          htmlFor={`metric-${kpi.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300 cursor-pointer grid gap-1 flex-1 group-hover:text-white transition-colors"
                        >
                          <span>{kpi.heading}</span>
                          <span className="text-xs font-normal text-gray-500 line-clamp-2">{kpi.description}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      )}

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger className="flex items-center gap-1.5 px-3 py-[5.5px] bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)] transition-colors">
          <FilterIcon />
          <span>{getDateRangeLabel()}</span>
          <ArrowDownIcon />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-[#1a1a1a] border border-gray-800">
          {dateRange === 'custom' ? (
            <div className="space-y-3">
              <button
                onClick={() => setDateRange('24h')}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-[#252525] rounded transition-colors w-full text-left"
              >
                ← Back to options
              </button>
              <Calendar
                mode="range"
                selected={customDateRange.from ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                className="rounded-md"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setDateRange('24h')}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
              >
                <span>Last 24 hours</span>
                {dateRange === '24h' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button
                onClick={() => setDateRange('week')}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
              >
                <span>Last week</span>
                {dateRange === 'week' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button
                onClick={() => setDateRange('month')}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
              >
                <span>Last month</span>
                {dateRange === 'month' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
              >
                <span>Last 90 days</span>
                {dateRange === '90d' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
              >
                <span>Select date range</span>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-black content-stretch flex flex-col h-screen items-start overflow-clip relative w-full" data-name="App Shell">
        <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0 w-full" data-name=".Core - App Shell">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute bg-black inset-0" />
            <img alt="" className="absolute max-w-none object-50%-50% object-cover opacity-90 size-full" src={imgCoreAppShell} />
          </div>
          
          {/* Header */}
          <FigmaHeader />
          
          {/* Fixed dark tint overlay - positioned over Main Content Area */}
          <div 
            className="fixed top-[64px] left-[260px] right-0 bottom-0 backdrop-blur-[400px] backdrop-filter bg-[rgba(0,0,0,0.4)] pointer-events-none rounded-tl-[16px] z-[0]" 
            aria-hidden="true"
          />
          
          {/* Main Layout */}
          <div className="basis-0 content-stretch flex gap-[24px] grow isolate items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Main Layout">
            {/* Sidebar */}
            <FigmaSidebar 
              activeView={selectedAgent ? 'ai-agents' : activeView} 
              onNavigate={(view) => {
                setActiveView(view);
                setSelectedAgent(null);
                setSelectedInteraction(null);
                window.location.hash = '#/';
              }}
            />
            
            {/* Main Content Area */}
            <div className="basis-0 content-stretch flex flex-col gap-[16px] grow h-full items-start min-h-px min-w-px shrink-0 z-[2] overflow-auto px-[24px] py-[24px] relative" data-name=".Main Content Area">
              {/* Dark tint overlay removed from here */}
              
              {selectedAgent ? (
                <SingleAgentView 
                  agentName={selectedAgent} 
                  onBack={() => setSelectedAgent(null)} 
                />
              ) : selectedInteraction && activeView !== 'observability' ? (
                <div className="w-[1400px] h-full relative z-[1]">
                  <InteractionPageNew 
                    interactionId={selectedInteraction} 
                    onBack={() => setSelectedInteraction(null)} 
                  />
                </div>
              ) : (
                <div className="w-[1400px] space-y-6 relative z-[1]">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h1 className="text-white">{activeView === 'observability' ? 'Observability' : 'AI Agents'}</h1>
                      <p className="text-gray-400">Manage and monitor your AI agents</p>
                    </div>
                    {activeView === 'ai-agents' && (
                      <div className="flex gap-3">
                        <Button variant="outline" className="bg-black border-gray-700 text-white hover:bg-gray-900 hover:text-white">
                          <Upload />
                          Import agent
                        </Button>
                        <Button className="bg-white text-black hover:bg-gray-200 hover:text-black">
                          <Plus />
                          Create agent
                        </Button>
                      </div>
                    )}
                  </div>

                  {activeView === 'ai-agents' ? (
                     <>
                        {filtersContent}
                        
                        {/* KPI Cards Grid - Grouped by Category */}
                        <div className={`flex gap-4 ${showFilterBar ? '' : ''}`}>
                          {/* Filter Bar - Conditionally rendered */}
                          {showFilterBar && (
                            <FilterBar 
                              agentNames={agentData.map(agent => agent.agentName)} 
                              onAgentClick={(agentName) => setSelectedAgent(agentName)}
                            />
                          )}
                          
                          <AIAgentsView 
                            filteredKpiData={filteredKpiData} 
                            dateRange={dateRange}
                            customDateRange={customDateRange}
                            selectedMetricIds={selectedMetricIds}
                            pinnedCardIds={pinnedCardIds}
                            onPinToggle={togglePin}
                            onDateRangeChange={(range, custom) => {
                              setDateRange(range);
                              if (custom) setCustomDateRange(custom);
                            }}
                            onAgentClick={(agentName) => setSelectedAgent(agentName)}
                          />
                        </div>
                     </>
                  ) : (
                     <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="flex gap-1 mb-6 bg-transparent w-auto justify-start p-0 h-auto">
                           <TabsTrigger value="dashboard" className="flex-none px-4 py-2 rounded-lg text-sm transition-colors text-[rgba(255,255,255,0.7)] bg-transparent hover:text-white hover:bg-[rgba(255,255,255,0.05)] data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm border-none shadow-none">
                              Dashboard
                           </TabsTrigger>
                           <TabsTrigger value="interactions" className="flex-none px-4 py-2 rounded-lg text-sm transition-colors text-[rgba(255,255,255,0.7)] bg-transparent hover:text-white hover:bg-[rgba(255,255,255,0.05)] data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm border-none shadow-none">
                              Interactions
                           </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="dashboard" className="space-y-6">
                           {filtersContent}
                           
                           {/* Sticky Chart (shown when a card is active and stickyChart is true) */}
                           {activeCardId && activeKPI && stickyChart && (
                             <div className="sticky top-[-24px] z-10 bg-[rgba(10,10,10,0.98)] backdrop-blur-xl pt-4 pb-8 -mt-4 border-b border-gray-900">
                               <KPIChart 
                                 heading={activeKPI.heading}
                                 description={activeKPI.description}
                                 chartType={activeKPI.chartType}
                                 dateRange={dateRange}
                                 customDateRange={customDateRange}
                                 sparklineData={activeKPI.sparklineData}
                                 unit={activeKPI.unit}
                                 value={activeKPI.value}
                                 yDomain={activeKPI.id === 'ce1' ? [0, 5] : undefined}
                                 ticks={activeKPI.id === 'ce1' ? [0, 1, 2, 3, 4, 5] : undefined}
                               />
                             </div>
                           )}
                           
                           <div className={`flex gap-4 ${showFilterBar ? '' : ''}`}>
                              {/* Filter Bar - Conditionally rendered */}
                              {showFilterBar && (
                                <FilterBar 
                                  agentNames={agentData.map(agent => agent.agentName)} 
                                  onAgentClick={(agentName) => setSelectedAgent(agentName)}
                                />
                              )}
                              
                              <ObservabilityView 
                                filteredKpiData={filteredKpiData}
                                categories={categories}
                                dateRange={dateRange}
                                customDateRange={customDateRange}
                                pinnedCardIds={pinnedCardIds}
                                onPinToggle={togglePin}
                                onMoveCard={movePinnedCard}
                                activeCardId={activeCardId}
                                onActiveCardChange={setActiveCardId}
                                onDateRangeChange={(range, custom) => {
                                  setDateRange(range);
                                  if (custom) setCustomDateRange(custom);
                                }}
                              />
                           </div>

                           {/* Agent Table */}
                           <AgentTable onAgentClick={(agentName) => setSelectedAgent(agentName)} />
                        </TabsContent>
                        
                        <TabsContent value="interactions">
                           <InteractionsTab 
                             dateRange={dateRange}
                             customDateRange={customDateRange}
                             interactionId={selectedInteraction}
                             onBack={() => {
                               setSelectedInteraction(null);
                               window.location.hash = '#/';
                             }}
                             onDateRangeChange={(range, custom) => {
                               setDateRange(range);
                               if (custom) setCustomDateRange(custom);
                             }}
                           />
                        </TabsContent>
                     </Tabs>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}