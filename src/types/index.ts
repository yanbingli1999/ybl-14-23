export type CandyType =
  | 'strawberry'
  | 'lemon'
  | 'mint'
  | 'blueberry'
  | 'grape'
  | 'rainbow'
  | 'bomb';

export type SpecialCandyType = 'rainbow' | 'bomb' | null;

export interface Candy {
  id: string;
  type: CandyType;
  row: number;
  col: number;
  isSpecial: boolean;
  specialType: SpecialCandyType;
  isMatched: boolean;
  isFalling: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  candies: Candy[];
  positions: Position[];
  matchType: 'horizontal' | 'vertical' | 'both' | 'special';
  specialGenerated: SpecialCandyType;
  specialPosition: Position | null;
}

export interface Carriage {
  id: string;
  candyType: CandyType;
  capacity: number;
  currentLoad: number;
}

export interface Train {
  id: string;
  name: string;
  carriages: Carriage[];
}

export interface OrderItem {
  candyType: CandyType;
  quantity: number;
}

export interface Batch {
  id: string;
  batchNumber: number;
  items: OrderItem[];
  reward: number;
  penalty: number;
  isDelivered: boolean;
  isLate: boolean;
  lockedReward: number;
}

export interface BatchResult {
  batchId: string;
  batchNumber: number;
  success: boolean;
  matchRate: number;
  reward: number;
  penalty: number;
  lockedReward: number;
  reclaimedReward: number;
  mismatches: OrderItem[];
  correctItems: OrderItem[];
  reputationChange: number;
}

export interface StationOrder {
  id: string;
  stationId: string;
  stationName: string;
  items: OrderItem[];
  reward: number;
  penalty: number;
  isUrgent: boolean;
  urgentBonus: number;
  isBatchContract?: boolean;
  totalBatches?: number;
  currentBatchIndex?: number;
  batches?: Batch[];
  accumulatedReward?: number;
  accumulatedPenalty?: number;
}

export type ContractStatus = 'in_progress' | 'completed' | 'failed';

export interface ContractProgress {
  orderId: string;
  status: ContractStatus;
  currentBatchIndex: number;
  batches: Batch[];
  accumulatedReward: number;
  accumulatedPenalty: number;
  totalReward: number;
  totalPenalty: number;
}

export interface Station {
  id: string;
  name: string;
  reputationRequired: number;
  themeColor: string;
  description: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  coins: number;
  reputation: number;
  level: number;
  unlockedStations: string[];
}

export interface GameState {
  board: (Candy | null)[][];
  selectedCandy: Position | null;
  score: number;
  moves: number;
  combo: number;
  maxCombo: number;
  train: Train;
  currentOrder: StationOrder | null;
  currentStationId: string;
  isAnimating: boolean;
  gamePhase: 'playing' | 'dispatching' | 'result' | 'gameover';
  dispatchResult: DispatchResult | null;
}

export interface DispatchResult {
  success: boolean;
  matchRate: number;
  reward: number;
  penalty: number;
  mismatches: OrderItem[];
  correctItems: OrderItem[];
  reputationChange: number;
  isBatchContract?: boolean;
  batchResult?: BatchResult;
  contractProgress?: ContractProgress;
  allBatchesCompleted?: boolean;
}

export interface StatsStep {
  id: string;
  date: string;
  totalMoves: number;
  bestMoves: number;
  gamesPlayed: number;
}

export interface StatsCombo {
  id: string;
  date: string;
  totalCombos: number;
  maxCombo: number;
  avgCombo: number;
}

export interface StatsMismatch {
  id: string;
  date: string;
  mismatchCount: number;
  totalPenalty: number;
  dispatches: number;
}

export interface StatsUrgent {
  id: string;
  date: string;
  urgentCount: number;
  successCount: number;
  successRate: number;
}

export interface StatsReputation {
  id: string;
  date: string;
  reputation: number;
  changeAmount: number;
}

export interface AllStats {
  steps: StatsStep[];
  combos: StatsCombo[];
  mismatches: StatsMismatch[];
  urgents: StatsUrgent[];
  reputations: StatsReputation[];
}

export const BOARD_SIZE = 8;
export const BASIC_CANDY_TYPES: CandyType[] = ['strawberry', 'lemon', 'mint', 'blueberry', 'grape'];
