"use client";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { GameEngine } from "../engine/GameEngine";
import type { EngineCallbacks } from "../engine/GameEngine";
import type { MapDef } from "../types/map";
import type { RunModifiers } from "../types/roguelike";

export function useGameEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  mapDef: MapDef | null,
  callbacks: EngineCallbacks,
  runMods: RunModifiers
): RefObject<GameEngine | null> {
  const engineRef = useRef<GameEngine | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const runModsRef = useRef(runMods);
  runModsRef.current = runMods;

  useEffect(() => {
    if (!canvasRef.current || !mapDef) return;

    const engine = new GameEngine(
      canvasRef.current,
      {
        onEnemyKilled: (reward) => callbacksRef.current.onEnemyKilled(reward),
        onEnemyLeaked: (dmg) => callbacksRef.current.onEnemyLeaked(dmg),
        onWaveComplete: () => callbacksRef.current.onWaveComplete(),
      },
      runModsRef.current
    );
    engine.loadMap(mapDef);
    engineRef.current = engine;

    // Start idle render loop so map is visible before first wave
    const canvas = canvasRef.current;
    canvas.width = mapDef.gridWidth * mapDef.cellSize;
    canvas.height = mapDef.gridHeight * mapDef.cellSize;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [mapDef?.id]); // Re-create when map changes

  return engineRef;
}
