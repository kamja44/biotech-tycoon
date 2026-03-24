"use client";
import { useNetrunnerStore } from "../store/gameStore";
import CardComponent from "./ui/CardComponent";

export default function RewardScreen() {
  const pendingRewardCards = useNetrunnerStore((s) => s.pendingRewardCards);
  const run = useNetrunnerStore((s) => s.run);
  const selectRewardCard = useNetrunnerStore((s) => s.selectRewardCard);
  const skipReward = useNetrunnerStore((s) => s.skipReward);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 text-white p-6">
      <div className="text-center">
        <h2 className="text-3xl font-black text-yellow-400">전투 승리!</h2>
        <p className="text-gray-400 mt-1">카드 1장을 선택하세요 (층 {run.floor - 1} 클리어)</p>
      </div>

      <div className="flex gap-6">
        {pendingRewardCards.map((cardId) => {
          const card = { id: cardId, upgraded: false };
          return (
            <div key={cardId} className="flex flex-col items-center gap-2">
              <CardComponent
                card={card}
                index={0}
                isSelected={false}
                isPlayable={true}
                onClick={() => selectRewardCard(cardId)}
              />
              <button
                onClick={() => selectRewardCard(cardId)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                선택
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={skipReward}
        className="text-gray-500 hover:text-gray-300 text-sm underline"
      >
        카드 없이 계속
      </button>
    </div>
  );
}
