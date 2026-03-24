"use client";
import Link from "next/link";
import { useNetrunnerStore } from "../store/gameStore";
import { getCardDef } from "../data/cards";
import PlayerHUD from "./ui/PlayerHUD";
import EnemyComponent from "./ui/EnemyComponent";
import CardComponent from "./ui/CardComponent";

export default function CombatScreen() {
  const player = useNetrunnerStore((s) => s.player);
  const enemy = useNetrunnerStore((s) => s.currentEnemy);
  const selectedCardIndex = useNetrunnerStore((s) => s.selectedCardIndex);
  const run = useNetrunnerStore((s) => s.run);
  const mode = useNetrunnerStore((s) => s.mode);
  const combatLog = useNetrunnerStore((s) => s.combatLog);
  const selectCard = useNetrunnerStore((s) => s.selectCard);
  const playCard = useNetrunnerStore((s) => s.playCard);
  const endTurn = useNetrunnerStore((s) => s.endTurn);

  if (!enemy) return null;

  const handleCardClick = (index: number) => {
    if (selectedCardIndex === index) {
      playCard(index);
    } else {
      selectCard(index);
    }
  };

  const isCardPlayable = (index: number) => {
    const card = player.hand[index];
    if (!card) return false;
    const def = getCardDef(card.id);
    return player.energy >= def.cost;
  };

  const lastLog = combatLog[combatLog.length - 1] ?? "";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            ← 홈
          </Link>
          <div className="text-cyan-400 font-mono text-sm">
            ACT {run.act} — 층 {run.floor} / 3
          </div>
        </div>
        <div className="flex gap-4 text-sm font-mono">
          {mode === "endless" && <span className="text-yellow-300">🏅 {run.score}점</span>}
          <span className="text-gray-400">💰 {player.gold}G</span>
        </div>
      </div>

      {/* 전투 영역 */}
      <div className="flex flex-1 items-center justify-between px-10 py-6 gap-6">
        {/* 플레이어 HUD */}
        <PlayerHUD player={player} />

        {/* 중앙 — 적 + 로그 */}
        <div className="flex flex-col items-center gap-4 flex-1">
          {enemy && <EnemyComponent enemy={enemy} />}
          <div className="mt-4 text-gray-400 text-sm bg-gray-900/60 rounded-lg px-4 py-2 max-w-xs text-center truncate">
            {lastLog}
          </div>
        </div>

        {/* 선택된 카드 플레이 버튼 */}
        <div className="w-44 flex flex-col items-center gap-3">
          {selectedCardIndex !== null && (
            <button
              onClick={() => playCard(selectedCardIndex)}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
            >
              ▶ 카드 사용
            </button>
          )}
          <button
            onClick={endTurn}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm transition-all"
          >
            턴 종료 →
          </button>
        </div>
      </div>

      {/* 패 영역 */}
      <div className="flex justify-center items-end gap-2 pb-6 px-4 pt-2 bg-gray-900/40 border-t border-gray-800 min-h-[160px]">
        {player.hand.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            index={index}
            isSelected={selectedCardIndex === index}
            isPlayable={isCardPlayable(index)}
            onClick={handleCardClick}
          />
        ))}
        {player.hand.length === 0 && (
          <p className="text-gray-600 text-sm">패가 없습니다. 턴 종료 시 드로우됩니다.</p>
        )}
      </div>
    </div>
  );
}
