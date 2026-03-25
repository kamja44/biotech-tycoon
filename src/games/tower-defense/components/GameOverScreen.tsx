"use client";
import { useTDStore } from "../store/gameStore";
import { getMapDef } from "../data/maps";
import Link from "next/link";

export default function GameOverScreen() {
  const score = useTDStore((s) => s.score);
  const currentWave = useTDStore((s) => s.currentWave);
  const mode = useTDStore((s) => s.mode);
  const selectedMapId = useTDStore((s) => s.selectedMapId);
  const highScores = useTDStore((s) => s.highScores);
  const endlessHighScore = useTDStore((s) => s.endlessHighScore);
  const resetRun = useTDStore((s) => s.resetRun);
  const startGame = useTDStore((s) => s.startGame);
  const setPhase = useTDStore((s) => s.setPhase);

  const bestScore = selectedMapId
    ? (highScores[selectedMapId] ?? 0)
    : endlessHighScore;

  const isNewRecord = score > 0 && score > bestScore;

  const handleRetry = () => {
    if (selectedMapId) {
      const mapDef = getMapDef(selectedMapId);
      if (mapDef) startGame(selectedMapId, mode, mapDef.startingGold, mapDef.startingLives);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="text-6xl mb-4">💀</div>

        {/* Title */}
        <h1 className="text-4xl font-black text-danger mb-2">기지 함락</h1>
        <p className="text-foreground/40 text-sm mb-8">메가코프가 침투에 성공했습니다.</p>

        {/* Stats */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-foreground/40 font-mono mb-1">달성 웨이브</div>
              <div className="text-2xl font-bold text-foreground">{currentWave}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/40 font-mono mb-1">최종 점수</div>
              <div className="text-2xl font-bold text-primary">{score.toLocaleString()}</div>
            </div>
          </div>

          {isNewRecord && (
            <div className="mt-4 text-center text-warning font-bold text-sm">
              🏆 새 기록 달성!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {selectedMapId && (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl transition-colors"
            >
              🔄 다시 시도
            </button>
          )}
          <button
            onClick={() => setPhase(mode === "story" ? "map_select" : "title")}
            className="w-full py-3 bg-card-bg border border-card-border hover:border-primary/40 text-foreground font-bold rounded-xl transition-colors"
          >
            맵 선택으로
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
