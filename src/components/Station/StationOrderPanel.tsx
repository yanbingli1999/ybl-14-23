import useGameStore from '@/store/useGameStore';
import { CANDY_CONFIG, STATIONS } from '@/data/config';
import { getCandyLoad } from '@/engine/loadingSystem';
import { getCurrentBatch } from '@/engine/contractSystem';
import { MapPin, Flame, Coins, AlertTriangle, Package, Clock, Lock } from 'lucide-react';

export default function StationOrderPanel() {
  const { currentOrder, train, currentStationId, profile, changeStation } = useGameStore();

  if (!currentOrder) return null;

  const station = STATIONS.find(s => s.id === currentStationId);
  const availableStations = STATIONS.filter(
    s => s.reputationRequired <= profile.reputation
  );

  const currentBatch = currentOrder.isBatchContract ? getCurrentBatch(currentOrder) : null;
  const displayItems = currentBatch?.items || currentOrder.items;
  const totalReward = currentOrder.reward;
  const lockedReward = currentOrder.batches?.reduce((sum, b) => sum + b.lockedReward, 0) || 0;

  return (
    <div
      className="rounded-2xl p-4 shadow-lg border-2"
      style={{
        background: `linear-gradient(135deg, ${station?.themeColor}15, ${station?.themeColor}05)`,
        borderColor: station?.themeColor + '40',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5" style={{ color: station?.themeColor }} />
        <h3 className="text-lg font-bold text-gray-800">{station?.name}</h3>
        {currentOrder.isUrgent && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            <Flame className="w-3 h-3" />
            急单
          </span>
        )}
        {currentOrder.isBatchContract && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
            <Package className="w-3 h-3" />
            分批合同
          </span>
        )}
      </div>

      {currentOrder.isBatchContract && currentOrder.batches && (
        <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">
                第 {currentOrder.currentBatchIndex! + 1} / {currentOrder.totalBatches} 批
              </span>
            </div>
            {lockedReward > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Lock className="w-3 h-3" />
                <span className="text-xs font-medium">已锁定 +{lockedReward}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {currentOrder.batches.map((batch, idx) => (
              <div
                key={batch.id}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  batch.isDelivered
                    ? batch.isLate
                      ? 'bg-red-400'
                      : 'bg-green-500'
                    : idx === currentOrder.currentBatchIndex
                    ? 'bg-purple-400 animate-pulse'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          {(currentOrder.accumulatedReward || 0) > 0 && (
            <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              累计奖励: +{currentOrder.accumulatedReward}
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">
          {currentOrder.isBatchContract ? `本批需求` : `订单需求`}
        </h4>
        <div className="space-y-2">
          {displayItems.map((item, index) => {
            const config = CANDY_CONFIG[item.candyType];
            const loaded = getCandyLoad(train, item.candyType);
            const progress = Math.min((loaded / item.quantity) * 100, 100);
            const isComplete = loaded >= item.quantity;

            return (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xl">{config.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{config.name}</span>
                    <span className={isComplete ? 'text-green-600 font-bold' : 'text-gray-500'}>
                      {loaded}/{item.quantity}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isComplete ? '#6BCB77' : config.color,
                      }}
                    />
                  </div>
                </div>
                {isComplete && <span className="text-green-500">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-yellow-600">
          <Coins className="w-4 h-4" />
          <span className="font-bold">
            +{currentBatch ? currentBatch.reward : totalReward}
            {currentOrder.isUrgent && (
              <span className="text-red-500 ml-1">(+{currentOrder.urgentBonus} 加急)</span>
            )}
            {currentOrder.isBatchContract && (
              <span className="text-purple-500 ml-1 text-xs">/ 总计 +{totalReward}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span>罚金 -{currentBatch ? currentBatch.penalty : currentOrder.penalty}</span>
        </div>
      </div>

      {availableStations.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">切换车站</h4>
          <div className="flex gap-2 flex-wrap">
            {availableStations.map(s => (
              <button
                key={s.id}
                onClick={() => changeStation(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${s.id === currentStationId
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                style={
                  s.id === currentStationId
                    ? { backgroundColor: s.themeColor }
                    : {}
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
