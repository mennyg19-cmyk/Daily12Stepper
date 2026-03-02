export const AFFECTS = [
  'Self-esteem',
  'Security',
  'Ambitions',
  'Personal relations',
  'Sex relations',
  'Pride',
  'Finances',
  'Emotional security',
];

export const DEFECTS = [
  'Anger',
  'Fear',
  'Dishonesty',
  'Selfishness',
  'Jealousy',
  'Resentment',
  'People-pleasing',
  'Control',
  'Perfectionism',
  'Blaming',
  'Avoidance',
  'Entitlement',
  'Judgment',
  'Pride',
  'Dishonor',
  'Self-pity',
];

export const ASSETS = [
  'Honesty',
  'Humility',
  'Courage',
  'Compassion',
  'Patience',
  'Accountability',
  'Willingness',
  'Gratitude',
  'Acceptance',
  'Forgiveness',
  'Service',
  'Open-mindedness',
  'Self-care',
  'Boundaries',
  'Faith',
  'Calm',
];

export const DEFECT_TO_ASSET: Record<string, string> = {
  Anger: 'Calm',
  Fear: 'Courage',
  Dishonesty: 'Honesty',
  Selfishness: 'Service',
  Jealousy: 'Gratitude',
  Resentment: 'Forgiveness',
  'People-pleasing': 'Boundaries',
  Control: 'Acceptance',
  Perfectionism: 'Humility',
  Blaming: 'Accountability',
  Avoidance: 'Willingness',
  Entitlement: 'Humility',
  Judgment: 'Compassion',
  Pride: 'Humility',
  Dishonor: 'Honesty',
  'Self-pity': 'Gratitude',
};

export type HelperType = 'affects' | 'defects' | 'assets';
