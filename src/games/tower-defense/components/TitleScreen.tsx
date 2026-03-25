"use client";
import { useTDStore } from "../store/gameStore";
import { MAP_DEFS } from "../data/maps";
import Link from "next/link";

export default function TitleScreen() {
  const setPhase = useTDStore((s) => s.setPhase);
  const endlessHighScore = useTDStore((s) => s.endlessHighScore);
  const highScores = useTDStore((s) => s.highScores);

  const bestStoryScore = Object.values(highScores).reduce((a, b) => Math.max(a, b), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Title */}
        <div className="mb-2 text-primary/60 text-sm font-mono tracking-[0.3em] uppercase">
          넷러너 세계관
        </div>
        <h1 className="text-5xl font-black tracking-tight text-foreground mb-1">
          <span className="text-primary">사이버</span> 디펜스
        </h1>
        <p className="text-foreground/50 text-sm mb-8 font-mono">
          CYBER DEFENSE v2.0.77
        </p>

        {/* High scores */}
        <div className="flex gap-4 justify-center mb-10">
          <div className="bg-card-bg border border-card-border rounded-lg px-5 py-3 text-center">
            <div className="text-xs text-foreground/40 font-mono mb-1">스토리 최고점</div>
            <div className="text-xl font-bold text-primary">{bestStoryScore.toLocaleString()}</div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-lg px-5 py-3 text-center">
            <div className="text-xs text-foreground/40 font-mono mb-1">엔드리스 최고점</div>
            <div className="text-xl font-bold text-accent">{endlessHighScore.toLocaleString()}</div>
          </div>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => setPhase("map_select")}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-background font-bold text-lg rounded-xl transition-colors"
          >
            🗺️ 스토리 모드
          </button>
          <button
            onClick={() => useTDStore.getState().startGame("map_01", "endless", 150, 20)}
            className="w-full py-4 px-6 bg-card-bg hover:bg-card-border border border-primary/30 hover:border-primary text-primary font-bold text-lg rounded-xl transition-colors"
          >
            ∞ 엔드리스 모드
          </button>
        </div>

        {/* Info */}
        <p className="text-foreground/30 text-xs font-mono">
          {MAP_DEFS.length}개 맵 · 12종 포탑 · 로그라이크 강화
        </p>

        {/* Home link */}
        <div className="mt-6">
          <Link href="/" className="text-foreground/30 hover:text-foreground/60 text-sm transition-colors">
            ← 허브로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
