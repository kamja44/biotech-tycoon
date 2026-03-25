"use client";
import { useTDStore } from "../store/gameStore";
import Link from "next/link";

export default function VictoryScreen() {
  const score = useTDStore((s) => s.score);
  const currentWave = useTDStore((s) => s.currentWave);
  const mode = useTDStore((s) => s.mode);
  const selectedMapId = useTDStore((s) => s.selectedMapId);
  const highScores = useTDStore((s) => s.highScores);
  const endlessHighScore = useTDStore((s) => s.endlessHighScore);
  const resetRun = useTDStore((s) => s.resetRun);
  const setPhase = useTDStore((s) => s.setPhase);
  const activeUpgrades = useTDStore((s) => s.activeUpgrades);

  const bestScore = selectedMapId
    ? (highScores[selectedMapId] ?? 0)
    : endlessHighScore;

  const isNewRecord = score > 0 && score >= bestScore;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background pulse */}
      <div className="absolute inset-0 bg-accent/5 animate-pulse" />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Icon */}
        <div className="text-6xl mb-4">🏆</div>

        {/* Title */}
        <h1 className="text-4xl font-black text-accent mb-2">방어 성공!</h1>
        <p className="text-foreground/40 text-sm mb-8">
          {mode === "story"
            ? "메가코프의 침공을 막아냈습니다."
            : `${currentWave}웨이브까지 방어에 성공했습니다!`}
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase("map_select")}
            className="w-full py-3 bg-accent hover:bg-accent/80 text-background font-bold rounded-xl transition-colors"
          >
            다음 맵으로 →
          </button>
          <button
            onClick={resetRun}
            className="w-full py-3 bg-card-bg border border-card-border hover:border-accent/40 text-foreground font-bold rounded-xl transition-colors"
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
