export type StrategyId = 'new' | 'repairFirst' | 'parallel';
export type PathOutcome = 'new' | 'repair' | 'tie';

export interface TimingInputs {
  inspectionDays: number;
  repairExecutionDays: number;
  newLeadDays: number;
  supplierShockDelayDays: number;
  targetRecoveryDays: number;
}

export interface RiskInputs {
  repairFeasibilityProbability: number;
  supplierShockProbability: number;
  dependence:
    | { mode: 'independent' }
    | { mode: 'joint'; repairFeasibleAndShockProbability: number };
}

export interface RiskState {
  repairFeasible: boolean;
  supplierShock: boolean;
  probability: number;
}

export interface RiskTable {
  mode: RiskInputs['dependence']['mode'];
  jointRepairFeasibleAndShockProbability: number;
  covariance: number;
  phiCorrelation: number | null;
  states: RiskState[];
}

export interface BaseCostInputs {
  inspection: number;
  repair: number;
  newPart: number;
  repairLogistics: number;
  newPartLogistics: number;
  supplierShockSurcharge: number;
}

export type ProcurementContractMode = 'firmOrder' | 'cancellableOrder' | 'capacityReservation';
export type OnRepairWins = 'cancelNew' | 'completeNewToInventory';
export type OnNewWins = 'cancelRepair' | 'completeRepairToInventory';
export type TiePolicy =
  | 'useRepairCancelNew'
  | 'useNewCancelRepair'
  | 'completeBothUseRepair'
  | 'completeBothUseNew';

export type CancelledNewPhysicalOutcome =
  | 'cancelledBeforeManufacture'
  | 'manufacturingStarted'
  | 'unknown';

export type CancelledRepairPhysicalOutcome = 'disposed' | 'unknown';

export interface ParallelPolicy {
  procurementContract: ProcurementContractMode;
  procurementStartsAtDecision: boolean;
  activationFee: number;
  activationCreditOnCompletedPurchase: number;
  newCancellationCommittedFraction: number;
  newCancellationFee: number;
  repairCancellationCommittedFraction: number;
  repairCancellationFee: number;
  onRepairWins: OnRepairWins;
  onNewWins: OnNewWins;
  tiePolicy: TiePolicy;
  cancelledNewPhysicalOutcome: CancelledNewPhysicalOutcome;
  cancelledRepairPhysicalOutcome: CancelledRepairPhysicalOutcome;
  residualValueRecognition: {
    enabled: boolean;
    newPartInventoryValue?: number;
    repairedComponentInventoryValue?: number;
  };
}

export interface ScenarioInputs {
  timing: TimingInputs;
  risks: RiskInputs;
  costs: BaseCostInputs;
  parallel: ParallelPolicy;
  environmentalPolicy: {
    originalComponentOutcomeWhenReplaced: 'disposed' | 'unknown';
    originalComponentOutcomeWhenRepairInfeasible: 'disposed' | 'unknown';
  };
}

export type CostCategory =
  | 'inspection'
  | 'repairCompleted'
  | 'newPartCompleted'
  | 'parallelActivation'
  | 'newCancellationCommitment'
  | 'newCancellationFee'
  | 'repairCancellationCommitment'
  | 'repairCancellationFee'
  | 'repairLogistics'
  | 'newPartLogistics'
  | 'supplierShockSurcharge'
  | 'activationCredit';

export interface CostLineItem {
  id: string;
  category: CostCategory;
  cashImpact: number;
  sunk: boolean;
  explanation: string;
}

export interface ResidualAsset {
  type: 'newPartInventory' | 'repairedComponentInventory';
  declaredValue: number | null;
}

export interface BranchEconomics {
  lineItems: CostLineItem[];
  totalCashOutlay: number;
  sunkCost: number;
  residualAssets: ResidualAsset[];
  recognisedResidualValue: number | null;
  netEconomicCost: number | null;
}

export type NewPartPhysicalOutcome =
  | 'notInitiated'
  | 'cancelledBeforeManufacture'
  | 'manufacturingStarted'
  | 'completedUsed'
  | 'completedInventory'
  | 'unknown';

export type OriginalComponentPhysicalOutcome =
  | 'repairedUsed'
  | 'repairedInventory'
  | 'disposed'
  | 'unknown';

export interface EnvironmentalEvents {
  newPartOutcome: NewPartPhysicalOutcome;
  originalComponentOutcome: OriginalComponentPhysicalOutcome;
  repairCompleted: boolean;
  newPartDelivered: boolean;
}

export interface ModelBranch {
  id: string;
  strategy: StrategyId;
  repairFeasible: boolean | null;
  supplierShock: boolean;
  probability: number;
  recoveryDays: number;
  targetMet: boolean;
  pathOutcome: PathOutcome;
  economics: BranchEconomics;
  environmentalEvents: EnvironmentalEvents;
  assumptions: string[];
}

export interface StrategyResult {
  strategy: StrategyId;
  branches: ModelBranch[];
  expectedRecoveryDays: number;
  probabilityTargetMet: number;
  expectedCashOutlay: number;
  expectedSunkCost: number;
  maximumCashCommitment: number;
  expectedRecognisedResidualValue: number | null;
  expectedNetEconomicCost: number | null;
}

export interface ScenarioResult {
  riskTable: RiskTable;
  strategies: Record<StrategyId, StrategyResult>;
}
