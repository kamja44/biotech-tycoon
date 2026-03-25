"use client";
import { useTDStore } from "../store/gameStore";
import { MAP_DEFS, getMapDef } from "../data/maps";
import Link from "next/link";

export default function VictoryScreen() {
  const score = useTDStore((s) => s.score);
  const currentWave = useTDStore((s) => s.currentWave);
  const mode = useTDStore((s) => s.mode);
  const selectedMapId = useTDStore((s) => s.selectedMapId);
  const highScores = useTDStore((s) => s.highScores);
  const activeUpgrades = useTDStore((s) => s.activeUpgrades);
  const resetRun = useTDStore((s) => s.resetRun);
  const setPhase = useTDStore((s) => s.setPhase);
  const startGame = useTDStore((s) => s.startGame);

  const bestScore = selectedMapId ? (highScores[selectedMapId] ?? 0) : 0;
  const isNewRecord = score > 0 && score >= bestScore;

  // Compute next map
  const currentIdx = MAP_DEFS.findIndex((m) => m.id === selectedMapId);
  const nextMap = currentIdx >= 0 && currentIdx < MAP_DEFS.length - 1
    ? MAP_DEFS[currentIdx + 1]
    : null;
  const isLastMap = !nextMap;

  const handleNextMap = () => {
    if (!nextMap) return;
    startGame(nextMap.id, "story", nextMap.startingGold, nextMap.startingLives);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background pulse */}
      <div className="absolute inset-0 bg-accent/5 animate-pulse" />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Icon */}
        <div className="text-6xl mb-4">{isLastMap ? "🎖️" : "🏆"}</div>

        {/* Title */}
        <h1 className="text-4xl font-black text-accent mb-2">
          {isLastMap ? "모든 구역 해방!" : "방어 성공!"}
        </h1>
        <p className="text-foreground/40 text-sm mb-8">
          {isLastMap
            ? "메가코프의 모든 침공을 막아냈습니다. 넷러너의 전설이 되었습니다."
            : `메가코프의 침공을 막아냈습니다.`}
        </p>

        {/* Stats */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-foreground/40 font-mono mb-1">웨이브</div>
              <div className="text-xl font-bold text-foreground">{currentWave}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/40 font-mono mb-1">최종 점수</div>
              <div className="text-xl font-bold text-primary">{score.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/40 font-mono mb-1">강화 횟수</div>
              <div className="text-xl font-bold text-accent">{activeUpgrades.length}</div>
            </div>
          </div>

          {isNewRecord && (
            <div className="mt-4 text-center text-warning font-bold text-sm">
              🌟 최고 기록 달성!
            </div>
          )}
        </div>

        {/* Next map preview */}
        {nextMap && (
          <div className="bg-card-bg border border-accent/30 rounded-xl p-4 mb-6 text-left">
            <div className="text-xs text-accent font-mono mb-1 uppercase tracking-wider">
              다음 구역 해금됨
            </div>
            <div className="font-bold text-foreground">{nextMap.name}</div>
            <div className="text-xs text-foreground/40 mt-0.5">{nextMap.description}</div>
            <div className="flex gap-3 mt-2 text-xs font-mono text-foreground/50">
              <span>❤️ 체력 {nextMap.startingLives}</span>
              <span>💰 골드 {nextMap.startingGold}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {nextMap && (
            <button
              onClick={handleNextMap}
              className="w-full py-3 bg-accent hover:bg-accent/80 text-background font-bold rounded-xl transition-colors"
            >
              {nextMap.name}으로 →
            </button>
          )}
          <button
            onClick={() => setPhase("map_select")}
            className="w-full py-3 bg-card-bg border border-card-border hover:border-primary/40 text-foreground font-bold rounded-xl transition-colors"
          >
            맵 목록으로
          </button>
          <button
            onClick={resetRun}
            className="text-foreground/30 hover:text-foreground/60 text-sm transition-colors"
          >
            타이틀로
          </button>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-foreground/20 hover:text-foreground/50 text-sm transition-colors">
            ← 허브로
          </Link>
        </div>
      </div>
    </div>
  );
}
