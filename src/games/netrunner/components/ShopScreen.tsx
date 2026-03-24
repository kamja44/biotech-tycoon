"use client";
import { useNetrunnerStore } from "../store/gameStore";

export default function ShopScreen() {
  const enterMap = useNetrunnerStore((s) => s.enterMap);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-6xl">🏪</div>
      <h2 className="text-2xl font-black text-green-400">상점</h2>
      <p className="text-gray-400">Phase 4에서 구현 예정</p>
      <button
        onClick={enterMap}
        className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-xl font-bold transition-all"
      >
        떠나기
      </button>
    </div>
  );
}
