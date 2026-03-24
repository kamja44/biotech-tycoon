import StatusBadge from "./StatusBadge";
import type { NetrunnerState } from "../../store/gameStore";

interface Props {
  player: NetrunnerState["player"];
}

export default function PlayerHUD({ player }: Props) {
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
  const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 space-y-3 min-w-[220px]">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🗡️</span>
        <div>
          <p className="text-white font-bold text-sm">GHOST</p>
          <p className="text-gray-400 text-xs">넷러너</p>
        </div>
      </div>

      {/* HP 바 */}
      <div>
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>HP</span>
          <span>{player.hp} / {player.maxHp}</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${hpColor} transition-all duration-300`} style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      {/* 블록 */}
      {player.block > 0 && (
        <div className="flex items-center gap-1 text-sm text-blue-300">
          <span>🛡️</span> <span>블록 {player.block}</span>
        </div>
      )}

      {/* 에너지 */}
      <div className="flex items-center gap-1">
        {Array.from({ length: player.maxEnergy }).map((_, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
              ${i < player.energy ? "bg-cyan-500 border-cyan-300 text-white" : "bg-gray-700 border-gray-600 text-gray-500"}`}
          >
            ⚡
          </div>
        ))}
        <span className="text-gray-400 text-xs ml-1">{player.energy}/{player.maxEnergy}</span>
      </div>

      {/* 덱 상태 */}
      <div className="flex gap-3 text-xs text-gray-400">
        <span>🃏 드로우 {player.drawPile.length}</span>
        <span>🗑️ 버림 {player.discardPile.length}</span>
      </div>

      {/* 상태이상 */}
      <StatusBadge effects={player.statusEffects} />
    </div>
  );
}
