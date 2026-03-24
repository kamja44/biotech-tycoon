"use client";
import { useState } from "react";
import type { PlayerClass, GameMode } from "../store/gameStore";
import { useNetrunnerStore } from "../store/gameStore";

interface Props {
  onStart: (playerClass: PlayerClass, mode: GameMode) => void;
}

const CLASS_INFO = [
  {
    id: "ghost" as PlayerClass,
    name: "Ghost",
    emoji: "🗡️",
    hp: 75,
    style: "공격형",
    desc: "빠른 단타 콤보. 저코스트 카드로 폭딜.",
    active: true,
  },
  {
    id: "tank" as PlayerClass,
    name: "Tank",
    emoji: "🛡️",
    hp: 100,
    style: "방어형",
    desc: "방어막 쌓고 반격. 높은 생존력.",
    active: true,
  },
  {
    id: "hacker" as PlayerClass,
    name: "Hacker",
    emoji: "⚡",
    hp: 70,
    style: "디버프형",
    desc: "상태이상과 카드 조작으로 제압.",
    active: true,
  },
];

export default function TitleScreen({ onStart }: Props) {
  const [selectedClass, setSelectedClass] = useState<PlayerClass>("ghost");
  const [selectedMode, setSelectedMode] = useState<GameMode>("story");
  const highScore = useNetrunnerStore((s) => s.highScore);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* 타이틀 */}
      <div className="text-center mb-10">
        <h1 className="text-6xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
          NETRUNNER
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-wider">
          CYBERPUNK 2087 — CARD ROGUELIKE
        </p>
        {highScore > 0 && (
          <p className="text-gray-500 text-sm mt-1">최고 기록: {highScore}점</p>
        )}
      </div>

      {/* 모드 선택 */}
      <div className="flex gap-4 mb-8">
        {(["story", "endless"] as GameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`px-6 py-2 rounded-lg border font-semibold text-sm transition-all
              ${selectedMode === mode
                ? "bg-cyan-600 border-cyan-400 text-white"
                : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400"}`}
          >
            {mode === "story" ? "📖 스토리" : "♾️ 엔드리스"}
          </button>
        ))}
      </div>

      {/* 클래스 선택 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {CLASS_INFO.map((cls) => (
          <button
            key={cls.id}
            onClick={() => cls.active && setSelectedClass(cls.id)}
            disabled={!cls.active}
            className={`
              relative w-44 rounded-2xl border-2 p-5 text-left transition-all
              ${!cls.active ? "opacity-40 cursor-not-allowed border-gray-700 bg-gray-900/50" :
                selectedClass === cls.id
                  ? "border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20 scale-105"
                  : "border-gray-600 bg-gray-900/60 hover:border-gray-400"}
            `}
          >
            {!cls.active && (
              <span className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                준비 중
              </span>
            )}
            <div className="text-4xl mb-2">{cls.emoji}</div>
            <p className="font-black text-lg">{cls.name}</p>
            <p className="text-cyan-400 text-xs mb-1">{cls.style}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{cls.desc}</p>
            <p className="text-gray-500 text-xs mt-2">HP {cls.hp}</p>
          </button>
        ))}
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={() => onStart(selectedClass, selectedMode)}
        className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl
          rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30
          tracking-wider"
      >
        RUN 시작
      </button>
    </div>
  );
}
