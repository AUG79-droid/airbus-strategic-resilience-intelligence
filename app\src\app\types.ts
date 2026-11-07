export type Locale = 'en' | 'es';

export type ViewId = 'investigate' | 'challenge' | 'validate' | 'translate';

export type CausalStatus = 'documented' | 'hypothesis' | 'modelled' | 'notQuantified';

export interface CausalStage {
  id: string;
  short: string;
  title: string;
  description: string;
  status: CausalStatus;
}
