"use client";
import { useTDStore } from "../store/gameStore";

interface HUDProps {
  totalWaves: number;
  onStartWave: () => void;
  onPause: () => void;
  onSpeedChange: (speed: 1 | 2 | 3) => void;
  currentSpeed: 1 | 2 | 3;
  waveInProgress: boolean;
}

export default function HUD({
  totalWaves,
  onStartWave,
  onPause,
  onSpeedChange,
  currentSpeed,
  waveInProgress,
}: HUDProps) {
  const credits = useTDStore((s) => s.credits);
  const lives = useTDStore((s) => s.lives);
  const currentWave = useTDStore((s) => s.currentWave);
  const score = useTDStore((s) => s.score);
  const mode = useTDStore((s) => s.mode);

  return (
    <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-2 bg-background/90 border-b border-card-border backdrop-blur-sm z-20">
      {/* Lives */}
      <div className="flex items-center gap-1.5 text-sm font-mono">
        <span className="text-danger">❤️</span>
        <span className={`font-bold ${lives <= 5 ? "text-danger" : "text-foreground"}`}>{lives}</span>
      </div>

      {/* Credits */}
      <div className="flex items-center gap-1.5 text-sm font-mono">
        <span>💰</span>
        <span className="font-bold text-warning">{credits}</span>
      </div>

      {/* Wave */}
      <div className="flex items-center gap-1.5 text-sm font-mono">
        <span className="text-foreground/40">웨이브</span>
        <span className="font-bold text-primary">
          {currentWave}/{mode === "endless" ? "∞" : totalWaves}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5 text-sm font-mono ml-1">
        <span className="text-foreground/40">점수</span>
        <span className="font-bold text-accent">{score.toLocaleString()}</span>
      </div>

      <div className="flex-1" />

      {/* Speed controls */}
      <div className="flex gap-1">
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
              currentSpeed === s
                ? "bg-primary text-background border-primary"
                : "bg-card-bg text-foreground/60 border-card-border hover:border-primary/50"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Pause */}
      <button
        onClick={onPause}
        className="px-3 py-1 text-xs font-mono rounded border border-card-border bg-card-bg text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        ⏸
      </button>

      {/* Start Wave */}
      {!waveInProgress && (
        <button
          onClick={onStartWave}
          className="px-4 py-1.5 text-sm font-bold rounded-lg bg-primary hover:bg-primary-dark text-background transition-colors"
        >
          웨이브 시작 ▶
        </button>
      )}
      {waveInProgress && (
        <div className="px-4 py-1.5 text-sm font-mono text-foreground/40 border border-card-border rounded-lg">
          진행 중...
        </div>
      )}
    </div>
  );
}
