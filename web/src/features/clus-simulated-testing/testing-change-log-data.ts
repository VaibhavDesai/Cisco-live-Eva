/** Sample rows for Simulated testing → Change log (prototype). */

export interface TestingChangeLogRow {
  id: string;
  scenarioName: string;
  updatedAt: string;
  updatedBy: string;
  area: string;
  description: string;
}

export const sampleTestingChangeLog: TestingChangeLogRow[] = [
  {
    id: 'clog-1',
    scenarioName: 'Service agent - voice channel',
    updatedAt: '14 Apr 26, 2:34 PM',
    updatedBy: 'schan01',
    area: 'Test scenario name',
    description:
      "Changed test scenario name from 'Customer inquiry test' to 'Customer support excellence test'",
  },
  {
    id: 'clog-2',
    scenarioName: 'Peak load voice containment check',
    updatedAt: '14 Apr 26, 1:15 PM',
    updatedBy: 'm_tores',
    area: 'Description',
    description:
      "Updated description to 'This test validates containment and handoff quality under peak voice traffic, aligned with voice usage observability signals.'",
  },
  {
    id: 'clog-3',
    scenarioName: 'Multi-channel agent performance',
    updatedAt: '13 Apr 26, 4:22 PM',
    updatedBy: 'schan01',
    area: 'Test type',
    description: "Changed test type from 'Smoke' to 'Functional'",
  },
  {
    id: 'clog-4',
    scenarioName: 'Context retention stress test',
    updatedAt: '13 Apr 26, 11:45 AM',
    updatedBy: 'akumar',
    area: 'Instructions',
    description:
      'Modified instructions for multi-step verification and clarified billing-dispute handling steps',
  },
  {
    id: 'clog-5',
    scenarioName: 'Slot and entity capture accuracy',
    updatedAt: '12 Apr 26, 3:18 PM',
    updatedBy: 'schan01',
    area: 'Expected outcome',
    description:
      'Updated expected outcome to specify 95% accuracy threshold and response time under 3 seconds',
  },
  {
    id: 'clog-6',
    scenarioName: 'Empathy & tone consistency',
    updatedAt: '12 Apr 26, 10:05 AM',
    updatedBy: 'm_tores',
    area: 'Dynamic variables',
    description: "Changed variable 'Name' test value from 'John Smith' to 'Jane Anderson'",
  },
  {
    id: 'clog-7',
    scenarioName: 'Multi-step troubleshooting',
    updatedAt: '11 Apr 26, 5:30 PM',
    updatedBy: 'akumar',
    area: 'Dynamic variables',
    description: "Updated variable 'Member ID' test value from '12345' to 'MEM-987654'",
  },
  {
    id: 'clog-8',
    scenarioName: 'Service agent - voice channel',
    updatedAt: '11 Apr 26, 9:12 AM',
    updatedBy: 'schan01',
    area: 'Instructions',
    description: 'Removed deprecated authentication step and added new workflow for handling escalations',
  },
  {
    id: 'clog-9',
    scenarioName: 'Jailbreak attempt (DAN mode)',
    updatedAt: '10 Apr 26, 4:44 PM',
    updatedBy: 'akumar',
    area: 'Expected outcome',
    description: 'Tightened success criteria for refusal behaviour on adversarial prompts.',
  },
  {
    id: 'clog-10',
    scenarioName: 'Regression bundle — checkout',
    updatedAt: '10 Apr 26, 11:20 AM',
    updatedBy: 'm_tores',
    area: 'Test scenario name',
    description: 'Renamed scenario for clarity to align with checkout regression suite naming.',
  },
  {
    id: 'clog-11',
    scenarioName: 'PII redaction verification',
    updatedAt: '09 Apr 26, 3:08 PM',
    updatedBy: 'schan01',
    area: 'Description',
    description: 'Expanded description with examples of allowed vs blocked PII patterns.',
  },
  {
    id: 'clog-12',
    scenarioName: 'Multi-channel agent performance',
    updatedAt: '09 Apr 26, 8:55 AM',
    updatedBy: 'akumar',
    area: 'Channel',
    description: 'Updated channel scope notes for Digital-only simulated runs.',
  },
  {
    id: 'clog-13',
    scenarioName: 'Variable sanitization check',
    updatedAt: '08 Apr 26, 2:17 PM',
    updatedBy: 'schan01',
    area: 'Instructions',
    description: 'Added sanitization rules for nested JSON payloads in variable substitution.',
  },
  {
    id: 'clog-14',
    scenarioName: 'Context retention stress test',
    updatedAt: '08 Apr 26, 10:02 AM',
    updatedBy: 'm_tores',
    area: 'Expected outcome',
    description: 'Adjusted latency thresholds for context retention checkpoints.',
  },
  {
    id: 'clog-15',
    scenarioName: 'Security vulnerability assessment',
    updatedAt: '07 Apr 26, 5:41 PM',
    updatedBy: 'akumar',
    area: 'Test type',
    description: 'Set test type back to Functional after security review sign-off.',
  },
];
