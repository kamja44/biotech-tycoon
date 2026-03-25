import type { TowerTypeId } from "./tower";

export type UpgradeCategory = "global_buff" | "economy" | "tower_specific" | "special_ability";

export type UpgradeEffectType =
  | { type: "all_damage_mult"; value: number }
  | { type: "all_range_mult"; value: number }
  | { type: "all_firerate_mult"; value: number }
  | { type: "sell_refund_bonus"; value: number }
  | { type: "lives_restore"; value: number }
  | { type: "credits_bonus"; value: number }
  | { type: "tower_cost_reduction"; value: number }
  | { type: "passive_income"; creditsPerWave: number }
  | { type: "enemy_slow_global"; factor: number }
  | { type: "tower_type_buff"; towerId: TowerTypeId; stat: "damage" | "range" | "firerate"; mult: number };

export interface UpgradeDef {
  id: string;
  name: string;        // Korean
  description: string; // Korean
  category: UpgradeCategory;
  rarity: "common" | "uncommon" | "rare";
  effect: UpgradeEffectType;
  emoji: string;
}

export interface RunModifiers {
  allDamageMult: number;
  allRangeMult: number;
  allFireRateMult: number;
  sellRefundBonus: number;
  passiveIncomePerWave: number;
  towerCostMult: number;
  enemySlowGlobal: number;
  towerTypeBuffs: Partial<Record<TowerTypeId, { damage?: number; range?: number; firerate?: number }>>;
}

export const DEFAULT_RUN_MODIFIERS: RunModifiers = {
  allDamageMult: 1.0,
  allRangeMult: 1.0,
  allFireRateMult: 1.0,
  sellRefundBonus: 0,
  passiveIncomePerWave: 0,
  towerCostMult: 1.0,
  enemySlowGlobal: 0,
  towerTypeBuffs: {},
};
