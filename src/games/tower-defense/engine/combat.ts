import type { EnemyInstance, EnemyStatusEffect } from "../types/enemy";
import type { TowerDef } from "../types/tower";
import type { RunModifiers } from "../types/roguelike";
import { ENEMY_DEFS } from "../data/enemies";

/** Returns effective damage after armor reduction */
export function calcDamage(
  rawDamage: number,
  towerDef: TowerDef,
  enemy: EnemyInstance,
  runMods: RunModifiers
): number {
  const enemyDef = ENEMY_DEFS[enemy.defId];
  let dmg = rawDamage * runMods.allDamageMult;

  // Tower-specific buff
  const towerBuff = runMods.towerTypeBuffs[towerDef.id];
  if (towerBuff?.damage) dmg *= towerBuff.damage;

  // Armor: 50% reduction if enemy is resistant to this damage type
  if (enemyDef.armorType === towerDef.damageType) {
    dmg *= 0.5;
  }
  // EMP ignores all armor
  if (towerDef.damageType === "emp") {
    dmg = rawDamage * runMods.allDamageMult;
    if (towerBuff?.damage) dmg *= towerBuff.damage;
  }

  return Math.max(1, Math.round(dmg));
}

/** Apply damage to an enemy, returns true if enemy died */
export function applyDamage(enemy: EnemyInstance, damage: number): boolean {
  enemy.hp = Math.max(0, enemy.hp - damage);
  if (enemy.hp <= 0) {
    enemy.isAlive = false;
    return true;
  }
  return false;
}

/** Apply or refresh a status effect on an enemy */
export function applyStatusEffect(
  enemy: EnemyInstance,
  effect: EnemyStatusEffect
): void {
  const existing = enemy.statusEffects.find((e) => e.type === effect.type);
  if (existing) {
    // Refresh duration, take max value
    existing.remainingMs = Math.max(existing.remainingMs, effect.remainingMs);
    existing.value = Math.max(existing.value, effect.value);
  } else {
    enemy.statusEffects.push({ ...effect });
  }
  recalcSlowFactor(enemy);
}

/** Tick all status effects on an enemy, removing expired ones */
export function tickStatusEffects(
  enemy: EnemyInstance,
  deltaMs: number
): number {
  let dotDamage = 0;
  enemy.statusEffects = enemy.statusEffects.filter((effect) => {
    effect.remainingMs -= deltaMs;
    if (effect.type === "dot" || effect.type === "firewall") {
      dotDamage += (effect.value * deltaMs) / 1000;
    }
    return effect.remainingMs > 0;
  });
  recalcSlowFactor(enemy);
  return Math.round(dotDamage);
}

function recalcSlowFactor(enemy: EnemyInstance): void {
  let minFactor = 1.0;
  for (const e of enemy.statusEffects) {
    if (e.type === "slow" || e.type === "firewall") {
      minFactor = Math.min(minFactor, e.value);
    }
    if (e.type === "stun") {
      minFactor = 0;
    }
  }
  enemy.slowFactor = minFactor;
}

/** Get effective tower range including run modifier */
export function getEffectiveRange(towerDef: TowerDef, runMods: RunModifiers): number {
  let range = towerDef.range * runMods.allRangeMult;
  const towerBuff = runMods.towerTypeBuffs[towerDef.id];
  if (towerBuff?.range) range *= towerBuff.range;
  return range;
}

/** Get effective tower fire rate including run modifier */
export function getEffectiveFireRate(towerDef: TowerDef, level: 1 | 2 | 3, runMods: RunModifiers): number {
  let rate = towerDef.fireRate;
  if (level >= 2) rate *= towerDef.upgrades[0].fireRateMult;
  if (level >= 3) rate *= towerDef.upgrades[1].fireRateMult;
  rate *= runMods.allFireRateMult;
  const towerBuff = runMods.towerTypeBuffs[towerDef.id];
  if (towerBuff?.firerate) rate *= towerBuff.firerate;
  return rate;
}

/** Get effective tower damage at a given upgrade level */
export function getEffectiveDamage(towerDef: TowerDef, level: 1 | 2 | 3): number {
  let dmg = towerDef.damage;
  if (level >= 2) dmg *= towerDef.upgrades[0].damageMult;
  if (level >= 3) dmg *= towerDef.upgrades[1].damageMult;
  return Math.round(dmg);
}

/** Distance between two points */
export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
