"use client";
import { useTDStore } from "../store/gameStore";
import { MAP_DEFS } from "../data/maps";

const THEME_COLORS: Record<string, string> = {
  neon_city: "from-cyan-900/40 to-blue-900/40",
  corp_server: "from-green-900/40 to-emerald-900/40",
  underground: "from-orange-900/40 to-amber-900/40",
  orbital: "from-purple-900/40 to-violet-900/40",
};

const THEME_EMOJI: Record<string, string> = {
  neon_city: "🌆",
  corp_server: "🖥️",
  underground: "🌑",
  orbital: "🛸",
};

export default function MapSelectScreen() {
  const unlockedMapIds = useTDStore((s) => s.unlockedMapIds);
  const highScores = useTDStore((s) => s.highScores);
  const setPhase = useTDStore((s) => s.setPhase);
  const startGame = useTDStore((s) => s.startGame);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setPhase("title")}
            className="text-foreground/40 hover:text-foreground/80 transition-colors text-sm font-mono"
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold text-foreground">맵 선택</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MAP_DEFS.map((map, idx) => {
            const isUnlocked = unlockedMapIds.includes(map.id);
            const bestScore = highScores[map.id] ?? 0;
            const gradient = THEME_COLORS[map.backgroundTheme] ?? "from-gray-900/40 to-gray-800/40";

            return (
              <button
                key={map.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) startGame(map.id, "story", map.startingGold, map.startingLives);
                }}
                className={`
                  relative text-left rounded-xl border p-4 transition-all
                  bg-gradient-to-br ${gradient}
                  ${isUnlocked
                    ? "border-card-border hover:border-primary/50 cursor-pointer"
                    : "border-card-border/30 cursor-not-allowed opacity-40"}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{THEME_EMOJI[map.backgroundTheme]}</span>
                  <span className="text-xs font-mono text-foreground/30">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-bold text-foreground mb-1">{map.name}</h3>
                <p className="text-xs text-foreground/50 mb-3 line-clamp-2">{map.description}</p>

                <div className="flex items-center justify-between text-xs text-foreground/40 font-mono">
                  <span>❤️ {map.startingLives}  💰 {map.startingGold}</span>
                  {bestScore > 0 && (
                    <span className="text-primary">{bestScore.toLocaleString()}점</span>
                  )}
                </div>

                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                    <span className="text-foreground/20 text-3xl">🔒</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
