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
}

// Generate sparkline data based on trend and date range
function generateSparkline(changePercent: string, isPositive: boolean, dateRange: string, seed: number = 0): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;
  
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
  
  const data: number[] = [];
  
  // Use seed for consistent randomness per card
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  
  // Start value
  let currentValue = 50;
  data.push(currentValue);
  
  // Generate trend with some variance
  for (let i = 1; i < points; i++) {
    const progress = i / (points - 1);
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStrength = Math.abs(change) / 10;
    const randomVariance = (seededRandom(i) - 0.5) * 3;
    
    currentValue += (trendDirection * trendStrength) + randomVariance;
    currentValue = Math.max(30, Math.min(70, currentValue)); // Keep within bounds
    data.push(currentValue);
  }
  
  return data;
}

// Generate sparkline data for ratings (0-5 scale)
function generateRatingSparkline(changePercent: string, isPositive: boolean, dateRange: string, seed: number = 0): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;
  
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
  
  // Start value (between 3.5 and 4.5)
  let currentValue = 3.5 + Math.abs(seededRandom(0)); 
  data.push(currentValue);
  
  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    // Smaller trend for rating
    const trendStrength = (Math.abs(change) / 100) * 0.2; 
    const randomVariance = (seededRandom(i) - 0.5) * 0.5;
    
    currentValue += (trendDirection * trendStrength) + randomVariance;
    currentValue = Math.max(3.0, Math.min(5.0, currentValue)); // Keep between 3 and 5
    data.push(currentValue);
  }
  
  return data;
}

export const kpiData: KPIData[] = [
  // Customer Experience
  { id: 'ce1', category: 'Customer Experience', heading: 'CSAT', description: 'How satisfied customers are with the interaction', value: '4.2', unit: '/5', change: '+8%', isPositive: true, chartType: 'line', sparklineData: generateRatingSparkline('+8%', true, '24h', 1) },
  { id: 'ce2', category: 'Customer Experience', heading: 'Customer Effort Score', description: 'How easy it was for the customer to get help', value: '3.8', unit: '/5', change: '+12%', isPositive: true, chartType: 'line', sparklineData: generateRatingSparkline('+12%', true, '24h', 2) },
  { id: 'ce3', category: 'Customer Experience', heading: 'Containment Rate', description: 'Percent of interactions resolved without human intervention', value: '76%', unit: '', change: '+5%', isPositive: true, chartType: 'area', sparklineData: generateSparkline('+5%', true, '24h', 3) },
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
