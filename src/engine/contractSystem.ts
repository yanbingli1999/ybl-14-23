import { StationOrder, OrderItem, Station, CandyType, BASIC_CANDY_TYPES, Batch } from '@/types';
import { STATIONS, GAME_CONFIG } from '@/data/config';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateOrder(stationId: string, reputation: number): StationOrder {
  const station = STATIONS.find(s => s.id === stationId);
  if (!station) {
    throw new Error(`Station not found: ${stationId}`);
  }

  const difficultyLevel = getDifficultyLevel(stationId, reputation);

  if (shouldGenerateBatchContract(difficultyLevel)) {
    return generateBatchOrder(stationId, reputation);
  }

  const itemCount = getItemCount(difficultyLevel);
  const baseQuantity = getBaseQuantity(difficultyLevel);

  const availableTypes = shuffle([...BASIC_CANDY_TYPES]);
  const selectedTypes = availableTypes.slice(0, itemCount);

  const items: OrderItem[] = selectedTypes.map(type => ({
    candyType: type,
    quantity: baseQuantity + Math.floor(Math.random() * 5),
  }));

  const baseReward = items.reduce((sum, item) => sum + item.quantity * 5, 0);
  const isUrgent = Math.random() < getUrgentChance(difficultyLevel);
  const urgentBonus = isUrgent ? Math.floor(baseReward * GAME_CONFIG.URGENT_BONUS_RATE) : 0;

  const order: StationOrder = {
    id: generateId(),
    stationId,
    stationName: station.name,
    items,
    reward: baseReward,
    penalty: Math.floor(baseReward * GAME_CONFIG.MISMATCH_PENALTY_RATE) * itemCount,
    isUrgent,
    urgentBonus,
  };

  return order;
}

function getDifficultyLevel(stationId: string, reputation: number): number {
  const stationIndex = STATIONS.findIndex(s => s.id === stationId);
  const baseLevel = stationIndex + 1;

  const repBonus = Math.floor(reputation / 200);

  return Math.min(baseLevel + repBonus, 5);
}

function getItemCount(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 2;
    case 2: return 2;
    case 3: return 3;
    case 4: return 3;
    case 5: return 4;
    default: return 2;
  }
}

function getBaseQuantity(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 5;
    case 2: return 8;
    case 3: return 10;
    case 4: return 12;
    case 5: return 15;
    default: return 5;
  }
}

function getUrgentChance(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 0.1;
    case 2: return 0.2;
    case 3: return 0.35;
    case 4: return 0.4;
    case 5: return 0.5;
    default: return 0.2;
  }
}

export function getAvailableStations(reputation: number): Station[] {
  return STATIONS.filter(s => s.reputationRequired <= reputation);
}

export function getNextStation(reputation: number): Station | null {
  const locked = STATIONS.filter(s => s.reputationRequired > reputation);
  if (locked.length === 0) return null;
  return locked[0];
}

export function getStationProgress(reputation: number): { current: Station | null; next: Station | null; progress: number } {
  const available = getAvailableStations(reputation);
  const current = available.length > 0 ? available[available.length - 1] : null;
  const next = getNextStation(reputation);

  let progress = 0;
  if (current && next) {
    const range = next.reputationRequired - current.reputationRequired;
    const earned = reputation - current.reputationRequired;
    progress = range > 0 ? (earned / range) * 100 : 100;
  } else if (next) {
    progress = (reputation / next.reputationRequired) * 100;
  } else {
    progress = 100;
  }

  return { current, next, progress: Math.min(progress, 100) };
}

export function shouldGenerateBatchContract(difficultyLevel: number): boolean {
  if (difficultyLevel < 3) return false;
  return Math.random() < GAME_CONFIG.BATCH_CONTRACT_CHANCE;
}

export function generateBatchOrder(stationId: string, reputation: number): StationOrder {
  const baseOrder = generateOrder(stationId, reputation);
  const difficultyLevel = getDifficultyLevel(stationId, reputation);
  const batchCount = Math.min(
    GAME_CONFIG.BATCH_MAX_COUNT,
    Math.max(GAME_CONFIG.BATCH_MIN_COUNT, Math.floor(difficultyLevel / 2) + 1)
  );

  const batches = splitOrderIntoBatches(baseOrder, batchCount);
  const totalReward = batches.reduce((sum, b) => sum + b.reward, 0);
  const totalPenalty = batches.reduce((sum, b) => sum + b.penalty, 0);

  return {
    ...baseOrder,
    isBatchContract: true,
    totalBatches: batchCount,
    currentBatchIndex: 0,
    batches,
    reward: totalReward,
    penalty: totalPenalty,
    accumulatedReward: 0,
    accumulatedPenalty: 0,
  };
}

function splitOrderIntoBatches(order: StationOrder, batchCount: number): Batch[] {
  const batches: Batch[] = [];
  const totalReward = order.reward;
  const baseBatchReward = Math.floor(totalReward / batchCount);

  for (let i = 0; i < batchCount; i++) {
    const batchItems: OrderItem[] = order.items.map(item => {
      const baseQty = Math.floor(item.quantity / batchCount);
      const remainder = item.quantity % batchCount;
      const extra = i < remainder ? 1 : 0;
      return {
        candyType: item.candyType,
        quantity: baseQty + extra,
      };
    }).filter(item => item.quantity > 0);

    const batchReward = i === batchCount - 1
      ? totalReward - baseBatchReward * (batchCount - 1)
      : baseBatchReward;

    const batchPenalty = Math.floor(
      batchItems.reduce((sum, item) => sum + item.quantity * 5, 0) *
      GAME_CONFIG.MISMATCH_PENALTY_RATE * batchItems.length
    );

    batches.push({
      id: generateId(),
      batchNumber: i + 1,
      items: batchItems,
      reward: batchReward,
      penalty: batchPenalty,
      isDelivered: false,
      isLate: false,
      lockedReward: 0,
    });
  }

  return batches;
}

export function getCurrentBatch(order: StationOrder): Batch | null {
  if (!order.isBatchContract || !order.batches || order.currentBatchIndex === undefined) {
    return null;
  }
  if (order.currentBatchIndex >= order.batches.length) {
    return null;
  }
  return order.batches[order.currentBatchIndex];
}

export function calculateBatchLockedReward(batch: Batch, matchRate: number): number {
  if (matchRate >= 0.8) {
    return Math.floor(batch.reward * GAME_CONFIG.BATCH_LOCK_REWARD_RATE);
  }
  return 0;
}

export function calculateReclaimedReward(lockedReward: number): number {
  return Math.floor(lockedReward * GAME_CONFIG.BATCH_RECLAIM_RATE);
}

export function isLastBatch(order: StationOrder): boolean {
  if (!order.isBatchContract || !order.batches || order.currentBatchIndex === undefined) {
    return true;
  }
  return order.currentBatchIndex >= order.batches.length - 1;
}

export function getContractCompletionBonus(totalReward: number): number {
  return Math.floor(totalReward * GAME_CONFIG.BATCH_COMPLETION_BONUS_RATE);
}
