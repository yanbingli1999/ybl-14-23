import useGameStore from '@/store/useGameStore';
import { CANDY_CONFIG, GAME_CONFIG } from '@/data/config';
import { Coins, Star, CheckCircle, XCircle, TrendingUp, TrendingDown, Lock, Unlock, Package } from 'lucide-react';

export default function DispatchResultModal() {
  const { gamePhase, dispatchResult, nextOrder, closeResult, currentOrder } = useGameStore();

  if (gamePhase !== 'result' || !dispatchResult || !currentOrder) return null;

  const { success, matchRate, reward, penalty, mismatches, correctItems, reputationChange, isBatchContract, batchResult, contractProgress, allBatchesCompleted } =
    dispatchResult;

  const hasMoreBatches = isBatchContract && !allBatchesCompleted && success;
  const isContractSuccess = allBatchesCompleted && contractProgress?.status === 'completed';
  const completionBonus = isContractSuccess
    ? Math.floor((contractProgress?.totalReward || 0) * GAME_CONFIG.BATCH_COMPLETION_BONUS_RATE)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform animate-bounce-in
          ${isContractSuccess
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : success
              ? 'bg-gradient-to-br from-green-400 to-emerald-600'
              : 'bg-gradient-to-br from-red-400 to-rose-600'
          }`}
      >
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">
            {isContractSuccess ? '🏆' : success ? '🎉' : '😅'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isContractSuccess
              ? '合同完成！'
              : isBatchContract && batchResult
                ? success
                  ? `第 ${batchResult.batchNumber} 批送达成功！`
                  : `第 ${batchResult.batchNumber} 批出了差错...`
                : success
                  ? '发车成功！'
                  : '有点小差错...'
            }
          </h2>
          <p className="text-white/80 text-sm">
            {isContractSuccess
              ? '所有批次按时送达，太棒了！'
              : success
                ? isBatchContract
                  ? '本批糖果已安全送达，继续加油！'
                  : '糖果已安全送达目的地'
                : isBatchContract
                  ? '本批延误，奖金已被追回...'
                  : '下次一定能做得更好！'
            }
          </p>
        </div>

        <div className="bg-white rounded-t-3xl p-6 -mt-2">
          {isBatchContract && batchResult && (
            <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">
                    分批合同 · 第 {batchResult.batchNumber} / {currentOrder.totalBatches} 批
                  </span>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {contractProgress?.batches.map((batch, idx) => (
                  <div
                    key={batch.id}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      batch.isDelivered
                        ? batch.isLate
                          ? 'bg-red-400'
                          : 'bg-green-500'
                        : idx < (contractProgress?.currentBatchIndex || 0)
                          ? 'bg-gray-400'
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-purple-600">
                  累计奖励: +{contractProgress?.accumulatedReward || 0}
                </div>
                <div className="text-purple-600">
                  累计罚金: -{contractProgress?.accumulatedPenalty || 0}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {Math.round(matchRate * 100)}%
              </div>
              <div className="text-xs text-gray-500">匹配度</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className={`text-3xl font-bold ${reward > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                +{reward}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" />
                奖励
              </div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className={`text-3xl font-bold ${reputationChange >= 0 ? 'text-purple-500' : 'text-red-500'}`}>
                {reputationChange >= 0 ? '+' : ''}{reputationChange}
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                信誉
              </div>
            </div>
          </div>

          {isBatchContract && batchResult && batchResult.lockedReward > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 text-sm">
                阶段奖励已锁定: +{batchResult.lockedReward} 金币
                <span className="text-xs text-yellow-600 ml-1">
                  (全部完成后解锁剩余 {(GAME_CONFIG.BATCH_LOCK_REWARD_RATE * 100).toFixed(0)}%)
                </span>
              </span>
            </div>
          )}

          {isBatchContract && batchResult && batchResult.reclaimedReward > 0 && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
              <Unlock className="w-5 h-5 text-red-500" />
              <span className="text-red-600 text-sm">
                延误追回奖金: -{batchResult.reclaimedReward} 金币
              </span>
            </div>
          )}

          {isContractSuccess && completionBonus > 0 && (
            <div className="mb-4 p-3 bg-green-50 rounded-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">
                合同完成奖励: +{completionBonus} 金币
              </span>
            </div>
          )}

          {penalty > 0 && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 text-sm">
                错装罚金: -{penalty} 金币
              </span>
            </div>
          )}

          {correctItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                正确送达
              </h4>
              <div className="flex flex-wrap gap-2">
                {correctItems.map((item, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm"
                  >
                    {CANDY_CONFIG[item.candyType].emoji}
                    {item.quantity}个
                  </span>
                ))}
              </div>
            </div>
          )}

          {mismatches.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" />
                错装或缺货
              </h4>
              <div className="flex flex-wrap gap-2">
                {mismatches.map((item, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-sm"
                  >
                    {CANDY_CONFIG[item.candyType].emoji}
                    差{item.quantity}个
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeResult}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {hasMoreBatches ? '继续装填下一批' : '继续装填'}
            </button>
            <button
              onClick={nextOrder}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 active:scale-95
                ${hasMoreBatches
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                  : isContractSuccess
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                    : success
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                }`}
            >
              {hasMoreBatches ? '发送下一批' : '接下一单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
