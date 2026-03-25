"use client";
import { useEffect, useCallback } from "react";
import type { RefObject } from "react";
import { GameEngine } from "../engine/GameEngine";
import { useTDStore } from "../store/gameStore";
import { TOWER_DEFS } from "../data/towers";
import type { MapDef } from "../types/map";
import type { PlacedTowerSave } from "../types/tower";

let _towerIdCounter = 0;

function isPathCell(mapDef: MapDef, gridX: number, gridY: number): boolean {
  const { path } = mapDef;
  for (let i = 0; i < path.length; i++) {
    const wp = path[i];
    if (i < path.length - 1) {
      const next = path[i + 1];
      const minX = Math.min(wp.x, next.x);
      const maxX = Math.max(wp.x, next.x);
      const minY = Math.min(wp.y, next.y);
      const maxY = Math.max(wp.y, next.y);
      if (gridX >= minX && gridX <= maxX && gridY >= minY && gridY <= maxY) return true;
    } else {
      if (wp.x === gridX && wp.y === gridY) return true;
    }
  }
  return false;
}

export function useTowerPlacement(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  engineRef: RefObject<GameEngine | null>,
  mapDef: MapDef | null
): void {
  const selectedTowerType = useTDStore((s) => s.selectedTowerType);
  const placedTowers = useTDStore((s) => s.placedTowers);
  const credits = useTDStore((s) => s.credits);
  const runModifiers = useTDStore((s) => s.runModifiers);
  const placeTower = useTDStore((s) => s.placeTower);
  const spendCredits = useTDStore((s) => s.spendCredits);
  const selectTowerType = useTDStore((s) => s.selectTowerType);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine || !mapDef) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const gridX = Math.floor(px / mapDef.cellSize);
      const gridY = Math.floor(py / mapDef.cellSize);

      if (gridX < 0 || gridX >= mapDef.gridWidth || gridY < 0 || gridY >= mapDef.gridHeight) return;

      if (selectedTowerType) {
        // Validate placement
        if (isPathCell(mapDef, gridX, gridY)) return;
        if (mapDef.blockedCells.some((c) => c.x === gridX && c.y === gridY)) return;
        if (placedTowers.some((t) => t.gridX === gridX && t.gridY === gridY)) return;

        const def = TOWER_DEFS[selectedTowerType];
        const cost = Math.round(def.cost * runModifiers.towerCostMult);
        if (credits < cost) return;

        const saved: PlacedTowerSave = {
          id: `tower_${++_towerIdCounter}`,
          defId: selectedTowerType,
          gridX,
          gridY,
          level: 1,
        };

        spendCredits(cost);
        placeTower(saved);
        engine.addTower(saved);

        // Deselect after placing (right-click to keep selecting)
        if (e.button === 0 && !e.shiftKey) {
          // Keep selection on shift+click for rapid placement
        }
      }
    },
    [canvasRef, engineRef, mapDef, selectedTowerType, placedTowers, credits, runModifiers, placeTower, spendCredits]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine || !mapDef) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const gridX = Math.floor(px / mapDef.cellSize);
      const gridY = Math.floor(py / mapDef.cellSize);

      if (gridX >= 0 && gridX < mapDef.gridWidth && gridY >= 0 && gridY < mapDef.gridHeight) {
        engine.setHoveredCell(gridX, gridY);
      } else {
        engine.setHoveredCell(null, null);
      }
    },
    [canvasRef, engineRef, mapDef]
  );

  const handleMouseLeave = useCallback(() => {
    engineRef.current?.setHoveredCell(null, null);
  }, [engineRef]);

  const handleRightClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      selectTowerType(null);
    },
    [selectTowerType]
  );

  useEffect(() => {
    engineRef.current?.setSelectedTowerDefId(selectedTowerType);
  }, [engineRef, selectedTowerType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("contextmenu", handleRightClick);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("contextmenu", handleRightClick);
    };
  }, [canvasRef, handleClick, handleMouseMove, handleMouseLeave, handleRightClick]);
}
