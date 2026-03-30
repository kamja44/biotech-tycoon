"use client";
import { useTDStore } from "../store/gameStore";
import { TOWER_DEFS, TOWER_ORDER } from "../data/towers";

interface TowerPaletteProps {
  isMobile: boolean;
  isDrawerOpen: boolean;
  onClose: () => void;
}

export default function TowerPalette({ isMobile, isDrawerOpen, onClose }: TowerPaletteProps) {
  const selectedTowerType = useTDStore((s) => s.selectedTowerType);
  const credits = useTDStore((s) => s.credits);
  const runModifiers = useTDStore((s) => s.runModifiers);
  const selectTowerType = useTDStore((s) => s.selectTowerType);

  const towerList = (
    <>
      <div className="flex-1 py-1 overflow-y-auto">
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
                <span className="flex items-center gap-1">
                  <span className="text-sm leading-none">{def.emoji}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: def.color }}
                  >
                    {def.name}
                  </span>
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

      {selectedTowerType && (
        <button
          onClick={() => { selectTowerType(null); onClose(); }}
          className="w-full py-2 text-sm font-bold text-danger border-t border-card-border hover:bg-danger/10 transition-colors"
        >
          취소 (선택 해제)
        </button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-background/98 border-t border-card-border flex flex-col max-h-[60vh] transition-transform duration-300 ${
          isDrawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-card-border">
          <span className="text-xs font-mono text-foreground/60">포탑 선택 (탭하여 배치)</span>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>
        {towerList}
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-[49px] bottom-0 w-[180px] bg-background/95 border-r border-card-border flex flex-col overflow-y-auto z-10">
      <div className="px-3 py-2 text-xs font-mono text-foreground/40 border-b border-card-border">
        포탑 선택 (우클릭 취소)
      </div>
      {towerList}
    </div>
  );
}
