import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TowerTypeId, PlacedTowerSave } from "../types/tower";
import type { UpgradeDef, RunModifiers } from "../types/roguelike";
import { DEFAULT_RUN_MODIFIERS } from "../types/roguelike";

export type TDPhase =
  | "title"
  | "map_select"
  | "playing"
  | "wave_reward"
  | "paused"
  | "gameover"
  | "victory";

export type GameMode = "story" | "endless";

interface TDState {
  phase: TDPhase;
  mode: GameMode;
  selectedMapId: string | null;

  credits: number;
  lives: number;
  currentWave: number;
  score: number;

  placedTowers: PlacedTowerSave[];
  selectedTowerType: TowerTypeId | null;

  activeUpgrades: UpgradeDef[];
  runModifiers: RunModifiers;
  pendingUpgradeChoices: UpgradeDef[];

  // Persistent
  unlockedMapIds: string[];
  highScores: Record<string, number>;
  endlessHighScore: number;

  // Actions
  setPhase: (phase: TDPhase) => void;
  startGame: (mapId: string, mode: GameMode, startingGold: number, startingLives: number) => void;
  selectTowerType: (type: TowerTypeId | null) => void;
  placeTower: (tower: PlacedTowerSave) => void;
  sellTower: (towerId: string, refundAmount: number) => void;
  upgradeTower: (towerId: string) => void;
  spendCredits: (amount: number) => void;
  onEnemyKilled: (reward: number) => void;
  onEnemyLeaked: (leakDamage: number) => void;
  onWaveComplete: (waveNumber: number, choices: UpgradeDef[]) => void;
  pickUpgrade: (upgrade: UpgradeDef) => void;
  startNextWave: () => void;
  resetRun: () => void;
  unlockMap: (mapId: string) => void;
  setHighScore: (mapId: string, score: number) => void;
  setEndlessHighScore: (score: number) => void;
}

export const useTDStore = create<TDState>()(
  persist(
    (set, get) => ({
      phase: "title",
      mode: "story",
      selectedMapId: null,
      credits: 0,
      lives: 20,
      currentWave: 0,
      score: 0,
      placedTowers: [],
      selectedTowerType: null,
      activeUpgrades: [],
      runModifiers: { ...DEFAULT_RUN_MODIFIERS },
      pendingUpgradeChoices: [],
      unlockedMapIds: ["map_01"],
      highScores: {},
      endlessHighScore: 0,

      setPhase: (phase) => set({ phase }),

      startGame: (mapId, mode, startingGold, startingLives) => {
        set({
          phase: "playing",
          mode,
          selectedMapId: mapId,
          credits: startingGold,
          lives: startingLives,
          currentWave: 0,
          score: 0,
          placedTowers: [],
          selectedTowerType: null,
          activeUpgrades: [],
          runModifiers: { ...DEFAULT_RUN_MODIFIERS },
          pendingUpgradeChoices: [],
        });
      },

      selectTowerType: (type) => set({ selectedTowerType: type }),

      placeTower: (tower) => set({ placedTowers: [...get().placedTowers, tower] }),

      sellTower: (towerId, refundAmount) =>
        set({
          placedTowers: get().placedTowers.filter((t) => t.id !== towerId),
          credits: get().credits + refundAmount,
        }),

      upgradeTower: (towerId) =>
        set({
          placedTowers: get().placedTowers.map((t) =>
            t.id === towerId && t.level < 3
              ? { ...t, level: (t.level + 1) as 1 | 2 | 3 }
              : t
          ),
        }),

      spendCredits: (amount) => set({ credits: Math.max(0, get().credits - amount) }),

      onEnemyKilled: (reward) =>
        set({ credits: get().credits + reward, score: get().score + 10 }),

      onEnemyLeaked: (leakDamage) => {
        const newLives = get().lives - leakDamage;
        if (newLives <= 0) {
          const { mode, score, endlessHighScore } = get();
          const newEndlessHighScore =
            mode === "endless" && score > endlessHighScore ? score : endlessHighScore;
          set({ lives: 0, phase: "gameover", endlessHighScore: newEndlessHighScore });
        } else {
          set({ lives: newLives });
        }
      },

      onWaveComplete: (waveNumber, choices) =>
        set({
          currentWave: waveNumber,
          score: get().score + waveNumber * 100,
          pendingUpgradeChoices: choices,
          phase: "wave_reward",
        }),

      pickUpgrade: (upgrade) => {
        const newUpgrades = [...get().activeUpgrades, upgrade];
        const newMods: RunModifiers = { ...DEFAULT_RUN_MODIFIERS };
        let extraCredits = 0;
        let extraLives = 0;

        for (const u of newUpgrades) {
          const e = u.effect;
          if (e.type === "all_damage_mult") newMods.allDamageMult *= e.value;
          else if (e.type === "all_range_mult") newMods.allRangeMult *= e.value;
          else if (e.type === "all_firerate_mult") newMods.allFireRateMult *= e.value;
          else if (e.type === "sell_refund_bonus") newMods.sellRefundBonus += e.value;
          else if (e.type === "passive_income") newMods.passiveIncomePerWave += e.creditsPerWave;
          else if (e.type === "tower_cost_reduction") newMods.towerCostMult *= e.value;
          else if (e.type === "enemy_slow_global")
            newMods.enemySlowGlobal = Math.min(0.8, newMods.enemySlowGlobal + e.factor);
          else if (e.type === "tower_type_buff") {
            const existing = newMods.towerTypeBuffs[e.towerId] ?? {};
            if (e.stat === "damage") existing.damage = (existing.damage ?? 1) * e.mult;
            else if (e.stat === "range") existing.range = (existing.range ?? 1) * e.mult;
            else if (e.stat === "firerate") existing.firerate = (existing.firerate ?? 1) * e.mult;
            newMods.towerTypeBuffs[e.towerId] = existing;
          }
        }

        // Immediate one-time effects from the newly picked upgrade
        if (upgrade.effect.type === "credits_bonus") extraCredits = upgrade.effect.value;
        if (upgrade.effect.type === "lives_restore") extraLives = upgrade.effect.value;

        set({
          activeUpgrades: newUpgrades,
          runModifiers: newMods,
          pendingUpgradeChoices: [],
          phase: "playing",
          credits: get().credits + extraCredits,
          lives: Math.min(20, get().lives + extraLives),
        });
      },

      startNextWave: () =>
        set({ credits: get().credits + get().runModifiers.passiveIncomePerWave }),

      resetRun: () =>
        set({
          phase: "title",
          mode: "story",
          selectedMapId: null,
          credits: 0,
          lives: 20,
          currentWave: 0,
          score: 0,
          placedTowers: [],
          selectedTowerType: null,
          activeUpgrades: [],
          runModifiers: { ...DEFAULT_RUN_MODIFIERS },
          pendingUpgradeChoices: [],
        }),

      unlockMap: (mapId) => {
        if (!get().unlockedMapIds.includes(mapId)) {
          set({ unlockedMapIds: [...get().unlockedMapIds, mapId] });
        }
      },

      setHighScore: (mapId, score) => {
        const current = get().highScores[mapId] ?? 0;
        if (score > current) {
          set({ highScores: { ...get().highScores, [mapId]: score } });
        }
      },

      setEndlessHighScore: (score) => {
        if (score > get().endlessHighScore) {
          set({ endlessHighScore: score });
        }
      },
    }),
    {
      name: "td-save",
      partialize: (state) => ({
        unlockedMapIds: state.unlockedMapIds,
        highScores: state.highScores,
        endlessHighScore: state.endlessHighScore,
      }),
    }
  )
);
