"use client";
import { useNetrunnerStore } from "../store/gameStore";

export default function GameOverScreen() {
  const run = useNetrunnerStore((s) => s.run);
  const resetGame = useNetrunnerStore((s) => s.resetGame);
  const combatLog = useNetrunnerStore((s) => s.combatLog);
  const lastLog = combatLog[combatLog.length - 1] ?? "";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-8xl animate-pulse">💀</div>
      <h2 className="text-4xl font-black text-red-400">JACK OUT</h2>
      <p className="text-gray-400">넷러너는 추적당했습니다.</p>
      <div className="bg-gray-900 rounded-xl px-6 py-4 text-center space-y-1">
        <p className="text-gray-300 text-sm">층 {run.floor} / 처치 {run.enemiesDefeated}마리</p>
        <p className="text-gray-500 text-xs">{lastLog}</p>
      </div>
      <button
        onClick={resetGame}
        className="px-8 py-3 bg-red-800 hover:bg-red-700 rounded-xl font-bold transition-all"
      >
        다시 시도
      </button>
    </div>
  );
}
