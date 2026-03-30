"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useTDStore } from "../store/gameStore";
import { useIsMobile } from "../hooks/useIsMobile";
import { getMapDef, MAP_DEFS } from "../data/maps";
import { getStoryWaves, buildEndlessWave } from "../data/waves";
import { getUpgradeChoices } from "../data/upgrades";
import { useGameEngine } from "../hooks/useGameEngine";
import { useTowerPlacement } from "../hooks/useTowerPlacement";
import HUD from "./HUD";
import TowerPalette from "./TowerPalette";
import UpgradeModal from "./UpgradeModal";

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedMapId = useTDStore((s) => s.selectedMapId);
  const mode = useTDStore((s) => s.mode);
  const currentWave = useTDStore((s) => s.currentWave);
  const phase = useTDStore((s) => s.phase);
  const runModifiers = useTDStore((s) => s.runModifiers);
  const activeUpgrades = useTDStore((s) => s.activeUpgrades);
  const placedTowers = useTDStore((s) => s.placedTowers);
  const setPhase = useTDStore((s) => s.setPhase);
  const onWaveComplete = useTDStore((s) => s.onWaveComplete);
  const setHighScore = useTDStore((s) => s.setHighScore);
  const unlockMap = useTDStore((s) => s.unlockMap);
  const score = useTDStore((s) => s.score);

  const mapDef = selectedMapId ? getMapDef(selectedMapId) ?? null : null;
  const storyWaves = mapDef ? getStoryWaves(mapDef.id) : [];
  const totalWaves = mode === "endless" ? Infinity : storyWaves.length;

  const engineCallbacks = {
    onEnemyKilled: useCallback((reward: number) => {
      useTDStore.getState().onEnemyKilled(reward);
    }, []),
    onEnemyLeaked: useCallback((dmg: number) => {
      useTDStore.getState().onEnemyLeaked(dmg);
    }, []),
    onWaveComplete: useCallback(() => {
      setWaveInProgress(false);
      const wave = useTDStore.getState().currentWave + 1;
      const isLastWave = mode === "story" && wave >= storyWaves.length;

      if (isLastWave) {
        // Victory!
        const finalScore = useTDStore.getState().score;
        if (selectedMapId) setHighScore(selectedMapId, finalScore);
        // Unlock next map
        if (selectedMapId) {
          // Find next map
          const currentIdx = MAP_DEFS.findIndex((m: { id: string }) => m.id === selectedMapId);
          if (currentIdx >= 0 && currentIdx < MAP_DEFS.length - 1) {
            unlockMap(MAP_DEFS[currentIdx + 1].id);
          }
        }
        setPhase("victory");
        return;
      }

      // Generate upgrade choices
      const activeIds = useTDStore.getState().activeUpgrades.map((u) => u.id);
      const choices = getUpgradeChoices(activeIds, wave);
      onWaveComplete(wave, choices);
    }, [mode, storyWaves.length, selectedMapId, setHighScore, unlockMap, setPhase, onWaveComplete]),
  };

  const engineRef = useGameEngine(canvasRef, mapDef, engineCallbacks, runModifiers);

  // Load saved towers when engine is ready
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.loadTowers(placedTowers);
  }, [engineRef.current]); // eslint-disable-line

  // Sync run modifiers to engine when they change
  useEffect(() => {
    engineRef.current?.applyRunModifiers(runModifiers);
  }, [engineRef, runModifiers]);

  useTowerPlacement(canvasRef, engineRef, mapDef ?? null);

  const handleStartWave = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || waveInProgress || !mapDef) return;

    const nextWaveNum = currentWave + 1;
    const waveDef = mode === "endless"
      ? buildEndlessWave(nextWaveNum)
      : storyWaves[nextWaveNum - 1];

    if (!waveDef) return;

    setWaveInProgress(true);
    useTDStore.getState().startNextWave();
    engine.startWave(waveDef);
  }, [engineRef, waveInProgress, mapDef, currentWave, mode, storyWaves]);

  const handlePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPaused) {
      engine.resume();
      setIsPaused(false);
    } else {
      engine.pause();
      setIsPaused(true);
    }
  }, [engineRef, isPaused]);

  const handleSpeedChange = useCallback((s: 1 | 2 | 3) => {
    setSpeed(s);
    engineRef.current?.setSpeed(s);
  }, [engineRef]);

  if (!mapDef) return null;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col">
      {/* HUD */}
      <HUD
        totalWaves={mode === "endless" ? 999 : storyWaves.length}
        onStartWave={handleStartWave}
        onPause={handlePause}
        onSpeedChange={handleSpeedChange}
        currentSpeed={speed}
        waveInProgress={waveInProgress}
      />

      {/* Game area */}
      <div className="flex flex-1 overflow-hidden mt-[49px]">
        {/* Tower palette */}
        <TowerPalette
          isMobile={isMobile}
          isDrawerOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />

        {/* Canvas */}
        <div className={`flex-1 overflow-auto flex items-start ${isMobile ? "justify-center" : "ml-[180px] justify-start"}`}>
          <canvas
            ref={canvasRef}
            className={isMobile ? "w-full h-auto" : ""}
            style={{ display: "block", imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Mobile: FAB + backdrop */}
      {isMobile && (
        <>
          {isDrawerOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-background text-2xl shadow-lg flex items-center justify-center"
            aria-label="포탑 선택"
          >
            🏰
          </button>
        </>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center">
            <div className="text-4xl font-black text-primary mb-4">⏸ 일시 정지</div>
            <button
              onClick={handlePause}
              className="px-8 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary-dark transition-colors"
            >
              계속하기
            </button>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {phase === "wave_reward" && <UpgradeModal />}
    </div>
  );
}
