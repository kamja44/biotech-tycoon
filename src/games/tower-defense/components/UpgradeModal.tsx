"use client";
import { useTDStore } from "../store/gameStore";
import type { UpgradeDef } from "../types/roguelike";

const RARITY_COLORS: Record<string, string> = {
  common: "border-card-border",
  uncommon: "border-primary/50",
  rare: "border-warning/70",
};

const RARITY_LABELS: Record<string, string> = {
  common: "일반",
  uncommon: "희귀",
  rare: "전설",
};

export default function UpgradeModal() {
  const choices = useTDStore((s) => s.pendingUpgradeChoices);
  const currentWave = useTDStore((s) => s.currentWave);
  const pickUpgrade = useTDStore((s) => s.pickUpgrade);

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-primary font-mono text-sm mb-1">웨이브 {currentWave} 클리어!</div>
          <h2 className="text-2xl font-bold text-foreground">강화 선택</h2>
          <p className="text-foreground/40 text-sm mt-1">1가지를 선택하세요</p>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {choices.map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} onPick={pickUpgrade} />
          ))}
        </div>

        {/* Skip */}
        <div className="text-center mt-6">
          <button
            onClick={() => pickUpgrade({
              id: "_skip",
              name: "건너뛰기",
              description: "",
              category: "economy",
              rarity: "common",
              effect: { type: "credits_bonus", value: 0 },
              emoji: "",
            })}
            className="text-foreground/30 hover:text-foreground/60 text-sm transition-colors"
          >
            강화 건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradeCard({
  upgrade,
  onPick,
}: {
  upgrade: UpgradeDef;
  onPick: (u: UpgradeDef) => void;
}) {
  const border = RARITY_COLORS[upgrade.rarity] ?? "border-card-border";
  const rarityLabel = RARITY_LABELS[upgrade.rarity] ?? upgrade.rarity;

  return (
    <button
      onClick={() => onPick(upgrade)}
      className={`
        text-left rounded-xl border-2 ${border} bg-card-bg
        p-5 hover:bg-card-border transition-all hover:scale-[1.02]
      `}
    >
      <div className="text-3xl mb-3">{upgrade.emoji}</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-foreground text-sm">{upgrade.name}</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${border} text-foreground/50`}>
          {rarityLabel}
        </span>
      </div>
      <p className="text-xs text-foreground/60 leading-relaxed">{upgrade.description}</p>
    </button>
  );
}
