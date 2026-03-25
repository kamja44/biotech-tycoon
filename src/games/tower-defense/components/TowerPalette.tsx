"use client";
import { useTDStore } from "../store/gameStore";
import { TOWER_DEFS, TOWER_ORDER } from "../data/towers";

export default function TowerPalette() {
  const selectedTowerType = useTDStore((s) => s.selectedTowerType);
  const credits = useTDStore((s) => s.credits);
  const runModifiers = useTDStore((s) => s.runModifiers);
  const selectTowerType = useTDStore((s) => s.selectTowerType);

  return (
    <div className="absolute left-0 top-[49px] bottom-0 w-[180px] bg-background/95 border-r border-card-border flex flex-col overflow-y-auto z-10">
      <div className="px-3 py-2 text-xs font-mono text-foreground/40 border-b border-card-border">
        포탑 선택 (우클릭 취소)
      </div>
      <div className="flex-1 py-1">
        {TOWER_ORDER.map((id) => {
          const def = TOWER_DEFS[id];
          const cost = Math.round(def.cost * runModifiers.towerCostMult);
          const canAfford = credits >= cost;
          const isSelected = selectedTowerType === id;

          return (
            <button
              key={id}
              onClick={() => selectTowerType(isSelected ? null : id)}
              className={`
                w-full px-3 py-2 text-left transition-colors border-b border-card-border/50
                ${isSelected
                  ? "bg-primary/20 border-l-2 border-l-primary"
                  : canAfford
                  ? "hover:bg-card-bg"
                  : "opacity-40 cursor-not-allowed"}
              `}
              disabled={!canAfford && !isSelected}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className="text-xs font-bold"
                  style={{ color: def.color }}
                >
                  {def.name}
                </span>
                <span className={`text-xs font-mono ${canAfford ? "text-warning" : "text-foreground/30"}`}>
                  {cost}
                </span>
              </div>
              <div className="flex gap-2 text-[10px] text-foreground/40 font-mono">
                <span>DMG {def.damage}</span>
                <span>RNG {def.range}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
