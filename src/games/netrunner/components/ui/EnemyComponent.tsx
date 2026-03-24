import { getEnemyDef } from "../../data/enemies";
import StatusBadge from "./StatusBadge";
import type { EnemyInstance } from "../../store/gameStore";

interface Props {
  enemy: EnemyInstance;
}

const INTENT_META: Record<string, { emoji: string; label: string; color: string }> = {
  attack: { emoji: "⚔️", label: "공격", color: "text-red-400" },
  defend: { emoji: "🛡️", label: "방어", color: "text-blue-400" },
  buff: { emoji: "💪", label: "버프", color: "text-yellow-400" },
  debuff: { emoji: "☠️", label: "디버프", color: "text-purple-400" },
};

export default function EnemyComponent({ enemy }: Props) {
  const def = getEnemyDef(enemy.definitionId);
  const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const intent = INTENT_META[enemy.intent.type];

  return (
    <div className={`flex flex-col items-center gap-3 ${enemy.enraged ? "animate-pulse" : ""}`}>
      {/* 의도 표시 */}
      <div className={`flex items-center gap-1 text-sm font-semibold ${intent.color} bg-gray-900/60 px-3 py-1 rounded-full`}>
        <span>{intent.emoji}</span>
        <span>
          {enemy.intent.type === "attack" && enemy.intent.value != null
            ? `${enemy.intent.value + (enemy.enraged ? (def.enrageAttackBonus ?? 0) : 0)} 피해 예고`
            : intent.label}
        </span>
      </div>

      {/* 적 이모지 */}
      <div className="text-8xl select-none">
        {def.emoji}
        {enemy.enraged && <span className="text-3xl">🔥</span>}
      </div>

      {/* 이름 + 블록 */}
      <div className="text-center">
        <p className="text-white font-bold">{def.name}</p>
        {enemy.block > 0 && (
          <p className="text-blue-300 text-sm">🛡️ 블록 {enemy.block}</p>
        )}
      </div>

      {/* HP 바 */}
      <div className="w-48">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>HP</span>
          <span>{Math.max(0, enemy.hp)} / {enemy.maxHp}</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      {/* 상태이상 */}
      <StatusBadge effects={enemy.statusEffects} />
    </div>
  );
}
