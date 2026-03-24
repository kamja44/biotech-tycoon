"use client";
import { useNetrunnerStore } from "../store/gameStore";

export default function VictoryScreen() {
  const run = useNetrunnerStore((s) => s.run);
  const highScore = useNetrunnerStore((s) => s.highScore);
  const resetGame = useNetrunnerStore((s) => s.resetGame);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-8xl">🏆</div>
      <h2 className="text-4xl font-black text-cyan-400">MEGACORP 무너뜨림</h2>
      <p className="text-gray-300">당신은 메가코프를 해킹했습니다!</p>
      <div className="bg-gray-900 rounded-xl px-6 py-4 text-center space-y-1">
        <p className="text-yellow-400 font-bold">Act {run.act} 클리어</p>
        <p className="text-gray-400 text-sm mt-1">처치 {run.enemiesDefeated}마리 · 점수 {run.score}</p>
        <p className="text-cyan-400 text-sm">최고 기록: {highScore}점</p>
      </div>
      <button
        onClick={resetGame}
        className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-xl font-bold transition-all"
      >
        다시 플레이
      </button>
    </div>
  );
}
