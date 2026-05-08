/** Preset names for “Add variable” (prototype); excluded when already defined in the workspace. */

export interface SuggestedVariableName {
  name: string;
  description: string;
}

export const suggestedAdditionalVariableNames: SuggestedVariableName[] = [
  {
    name: 'Name',
    description: 'Customer or contact display name used in the scenario.',
  },
  {
    name: 'City',
    description: 'City or locality for regional routing and scripted content.',
  },
  {
    name: 'Phone',
    description: 'Phone number for verification, callback, or SMS-style flows.',
  },
  {
    name: 'Email',
    description: 'Email address for notifications, sign-in, or identity checks.',
  },
  {
    name: 'Member ID',
    description: 'Loyalty or membership identifier for account lookup.',
  },
  {
    name: 'Address',
    description: 'Postal or service address for fulfilment and validation tests.',
  },
  {
    name: 'Date of birth',
    description: 'Date of birth for age-gated or compliance-related scenarios.',
  },
];
