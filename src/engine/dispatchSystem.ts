import { Train, StationOrder, DispatchResult, OrderItem, CandyType, BatchResult, Batch, ContractProgress, ContractStatus } from '@/types';
import { GAME_CONFIG } from '@/data/config';
import { getCandyLoad } from './loadingSystem';
import { getCurrentBatch, calculateBatchLockedReward, calculateReclaimedReward, isLastBatch, getContractCompletionBonus } from './contractSystem';

export function calculateDispatchResult(
  train: Train,
  order: StationOrder
): DispatchResult {
  if (order.isBatchContract && order.batches) {
    return calculateBatchDispatchResult(train, order);
  }

  return calculateSingleDispatchResult(train, order);
}

function calculateSingleDispatchResult(
  train: Train,
  order: StationOrder
): DispatchResult {
  const correctItems: OrderItem[] = [];
  const mismatches: OrderItem[] = [];
  let matchPoints = 0;
  let totalRequired = 0;

  for (const item of order.items) {
    const loaded = getCandyLoad(train, item.candyType);
    totalRequired += item.quantity;

    if (loaded >= item.quantity) {
      correctItems.push({ ...item });
      matchPoints += item.quantity;
    } else if (loaded > 0) {
      correctItems.push({ candyType: item.candyType, quantity: loaded });
      mismatches.push({ candyType: item.candyType, quantity: item.quantity - loaded });
      matchPoints += loaded;
    } else {
      mismatches.push({ ...item });
    }
  }

  for (const carriage of train.carriages) {
    const inOrder = order.items.find(i => i.candyType === carriage.candyType);
    if (!inOrder && carriage.currentLoad > 0) {
      mismatches.push({ candyType: carriage.candyType, quantity: carriage.currentLoad });
    }
  }

  const matchRate = totalRequired > 0 ? matchPoints / totalRequired : 0;
  const success = matchRate >= 0.8;

  let reward = 0;
  if (success) {
    reward = order.reward;
    if (order.isUrgent) {
      reward += Math.floor(order.reward * GAME_CONFIG.URGENT_BONUS_RATE);
    }
  }

  let penalty = 0;
  if (mismatches.length > 0) {
    penalty = Math.floor(order.reward * GAME_CONFIG.MISMATCH_PENALTY_RATE) * mismatches.length;
    penalty = Math.min(penalty, order.penalty);
  }

  const reputationChange = success
    ? GAME_CONFIG.REPUTATION_PER_SUCCESS
    : GAME_CONFIG.REPUTATION_PER_FAIL;

  return {
    success,
    matchRate,
    reward,
    penalty,
    mismatches,
    correctItems,
    reputationChange,
  };
}

function calculateBatchDispatchResult(
  train: Train,
  order: StationOrder
): DispatchResult {
  const currentBatch = getCurrentBatch(order);
  if (!currentBatch) {
    return calculateSingleDispatchResult(train, order);
  }

  const batchResult = calculateSingleBatchResult(train, currentBatch, order);
  const contractProgress = updateContractProgress(order, batchResult);
  const allBatchesCompleted = contractProgress.status === 'completed' || contractProgress.status === 'failed';

  let totalReward = batchResult.reward;
  let totalPenalty = batchResult.penalty;
  let totalRepChange = batchResult.reputationChange;

  if (allBatchesCompleted && contractProgress.status === 'completed') {
    const completionBonus = getContractCompletionBonus(order.reward);
    totalReward += completionBonus;
    totalRepChange += GAME_CONFIG.BATCH_REPUTATION_PER_SUCCESS;
  }

  return {
    success: batchResult.success,
    matchRate: batchResult.matchRate,
    reward: totalReward,
    penalty: totalPenalty,
    mismatches: batchResult.mismatches,
    correctItems: batchResult.correctItems,
    reputationChange: totalRepChange,
    isBatchContract: true,
    batchResult,
    contractProgress,
    allBatchesCompleted,
  };
}

function calculateSingleBatchResult(
  train: Train,
  batch: Batch,
  order: StationOrder
): BatchResult {
  const correctItems: OrderItem[] = [];
  const mismatches: OrderItem[] = [];
  let matchPoints = 0;
  let totalRequired = 0;

  for (const item of batch.items) {
    const loaded = getCandyLoad(train, item.candyType);
    totalRequired += item.quantity;

    if (loaded >= item.quantity) {
      correctItems.push({ ...item });
      matchPoints += item.quantity;
    } else if (loaded > 0) {
      correctItems.push({ candyType: item.candyType, quantity: loaded });
      mismatches.push({ candyType: item.candyType, quantity: item.quantity - loaded });
      matchPoints += loaded;
    } else {
      mismatches.push({ ...item });
    }
  }

  for (const carriage of train.carriages) {
    const inBatch = batch.items.find(i => i.candyType === carriage.candyType);
    if (!inBatch && carriage.currentLoad > 0) {
      mismatches.push({ candyType: carriage.candyType, quantity: carriage.currentLoad });
    }
  }

  const matchRate = totalRequired > 0 ? matchPoints / totalRequired : 0;
  const success = matchRate >= 0.8;

  const lockedReward = calculateBatchLockedReward(batch, matchRate);

  let reclaimedReward = 0;
  if (!success && batch.lockedReward > 0) {
    reclaimedReward = calculateReclaimedReward(batch.lockedReward);
  }

  let reward = 0;
  if (success) {
    reward = batch.reward - lockedReward;
    if (order.isUrgent) {
      reward += Math.floor(batch.reward * GAME_CONFIG.URGENT_BONUS_RATE);
    }
  }

  let penalty = 0;
  if (mismatches.length > 0) {
    penalty = Math.floor(batch.reward * GAME_CONFIG.MISMATCH_PENALTY_RATE) * mismatches.length;
    penalty = Math.min(penalty, batch.penalty);
  }

  const reputationChange = success
    ? GAME_CONFIG.BATCH_REPUTATION_PER_SUCCESS
    : GAME_CONFIG.BATCH_REPUTATION_PER_FAIL;

  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    success,
    matchRate,
    reward,
    penalty,
    lockedReward,
    reclaimedReward,
    mismatches,
    correctItems,
    reputationChange,
  };
}

function updateContractProgress(
  order: StationOrder,
  batchResult: BatchResult
): ContractProgress {
  if (!order.batches || order.currentBatchIndex === undefined) {
    return {
      orderId: order.id,
      status: 'failed',
      currentBatchIndex: 0,
      batches: [],
      accumulatedReward: 0,
      accumulatedPenalty: 0,
      totalReward: order.reward,
      totalPenalty: order.penalty,
    };
  }

  const updatedBatches = [...order.batches];
  const currentBatch = updatedBatches[order.currentBatchIndex];
  if (currentBatch) {
    currentBatch.isDelivered = true;
    currentBatch.isLate = !batchResult.success;
    currentBatch.lockedReward = batchResult.lockedReward;
  }

  let accumulatedReward = (order.accumulatedReward || 0) + batchResult.reward - batchResult.reclaimedReward;
  let accumulatedPenalty = (order.accumulatedPenalty || 0) + batchResult.penalty;

  const nextBatchIndex = order.currentBatchIndex + 1;
  const isLast = nextBatchIndex >= order.batches.length;

  let status: ContractStatus = 'in_progress';
  if (!batchResult.success) {
    status = 'failed';
  } else if (isLast) {
    status = 'completed';
  }

  return {
    orderId: order.id,
    status,
    currentBatchIndex: nextBatchIndex,
    batches: updatedBatches,
    accumulatedReward,
    accumulatedPenalty,
    totalReward: order.reward,
    totalPenalty: order.penalty,
  };
}

export function advanceToNextBatch(order: StationOrder, progress: ContractProgress): StationOrder {
  return {
    ...order,
    currentBatchIndex: progress.currentBatchIndex,
    batches: progress.batches,
    accumulatedReward: progress.accumulatedReward,
    accumulatedPenalty: progress.accumulatedPenalty,
  };
}

export function canDispatch(train: Train): boolean {
  const totalLoad = train.carriages.reduce((sum, c) => sum + c.currentLoad, 0);
  return totalLoad > 0;
}

export function getMatchColor(matchRate: number): string {
  if (matchRate >= 0.9) return '#6BCB77';
  if (matchRate >= 0.7) return '#FFD93D';
  if (matchRate >= 0.5) return '#FF9F43';
  return '#FF4757';
}
