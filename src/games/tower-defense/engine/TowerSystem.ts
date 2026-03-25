import type { TowerInstance } from "../types/tower";
import type { EnemyInstance } from "../types/enemy";
import type { Projectile } from "../types/projectile";
import type { RunModifiers } from "../types/roguelike";
import { TOWER_DEFS } from "../data/towers";
import { ENEMY_DEFS } from "../data/enemies";
import {
  dist,
  calcDamage,
  getEffectiveRange,
  getEffectiveFireRate,
  getEffectiveDamage,
} from "./combat";

let _projIdCounter = 0;

export class TowerSystem {
  constructor(private readonly cellSize: number) {}

  tick(
    towers: Map<string, TowerInstance>,
    enemies: Map<string, EnemyInstance>,
    projectiles: Map<string, Projectile>,
    nowMs: number,
    runMods: RunModifiers
  ): void {
    for (const tower of towers.values()) {
      const def = TOWER_DEFS[tower.defId];

      // Shield towers don't fire projectiles
      if (def.special?.type === "shield") continue;
      // Firewall towers don't fire projectiles (handled separately as area effect)
      if (def.special?.type === "firewall") {
        this.tickFirewall(tower, enemies, nowMs, runMods);
        continue;
      }
      // Pulse towers fire periodically
      if (def.special?.type === "pulse") {
        this.tickPulse(tower, enemies, projectiles, nowMs, runMods);
        continue;
      }

      const fireRate = getEffectiveFireRate(def, tower.level, runMods);
      const cooldownMs = 1000 / fireRate;
      if (nowMs - tower.lastFireTime < cooldownMs) continue;

      const range = getEffectiveRange(def, runMods);
      const towerX = tower.gridX * this.cellSize + this.cellSize / 2;
      const towerY = tower.gridY * this.cellSize + this.cellSize / 2;

      const target = this.findTarget(tower, enemies, towerX, towerY, range);
      if (!target) continue;

      tower.targetId = target.id;
      tower.lastFireTime = nowMs;

      const damage = getEffectiveDamage(def, tower.level);
      const finalDamage = calcDamage(damage, def, target, runMods);

      const proj: Projectile = {
        id: `proj_${++_projIdCounter}`,
        towerId: tower.id,
        targetEnemyId: target.id,
        x: towerX,
        y: towerY,
        speed: def.projectileSpeed,
        damage: finalDamage,
        damageType: def.damageType,
        special: def.special,
        isAlive: true,
        color: def.color,
      };
      projectiles.set(proj.id, proj);
    }
  }

  private findTarget(
    tower: TowerInstance,
    enemies: Map<string, EnemyInstance>,
    towerX: number,
    towerY: number,
    range: number
  ): EnemyInstance | null {
    let best: EnemyInstance | null = null;
    let bestDist = Infinity;

    for (const enemy of enemies.values()) {
      if (!enemy.isAlive) continue;

      const def = ENEMY_DEFS[enemy.defId];
      // Stealth enemies: only targetable if within 2 cells (reveal range)
      if (def.special?.type === "stealth") {
        const revealRange = def.special.revealRange;
        if (dist(towerX, towerY, enemy.x, enemy.y) > revealRange) continue;
      }

      const d = dist(towerX, towerY, enemy.x, enemy.y);
      if (d > range) continue;

      // "First" targeting: enemy furthest along path
      if (enemy.distanceTraveled > (best?.distanceTraveled ?? -1)) {
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  private tickFirewall(
    tower: TowerInstance,
    enemies: Map<string, EnemyInstance>,
    nowMs: number,
    runMods: RunModifiers
  ): void {
    const def = TOWER_DEFS[tower.defId];
    const fireRate = getEffectiveFireRate(def, tower.level, runMods);
    const cooldownMs = 1000 / fireRate;
    if (nowMs - tower.lastFireTime < cooldownMs) return;

    const range = getEffectiveRange(def, runMods);
    const towerX = tower.gridX * this.cellSize + this.cellSize / 2;
    const towerY = tower.gridY * this.cellSize + this.cellSize / 2;

    tower.lastFireTime = nowMs;

    const special = def.special as { type: "firewall"; slowFactor: number; dotDps: number };
    let slowFactor = special.slowFactor;
    let dotDps = special.dotDps;
    if (tower.level >= 2) {
      slowFactor = (def.upgrades[0].specialOverride as typeof special | undefined)?.slowFactor ?? slowFactor;
      dotDps = (def.upgrades[0].specialOverride as typeof special | undefined)?.dotDps ?? dotDps;
    }
    if (tower.level >= 3) {
      slowFactor = (def.upgrades[1].specialOverride as typeof special | undefined)?.slowFactor ?? slowFactor;
      dotDps = (def.upgrades[1].specialOverride as typeof special | undefined)?.dotDps ?? dotDps;
    }

    for (const enemy of enemies.values()) {
      if (!enemy.isAlive) continue;
      if (dist(towerX, towerY, enemy.x, enemy.y) > range) continue;

      // Apply slow
      const existingSlow = enemy.statusEffects.find((e) => e.type === "slow");
      if (!existingSlow || existingSlow.value > slowFactor) {
        const idx = enemy.statusEffects.findIndex((e) => e.type === "slow");
        if (idx >= 0) enemy.statusEffects.splice(idx, 1);
        enemy.statusEffects.push({ type: "slow", remainingMs: 2000, value: slowFactor });
        enemy.slowFactor = Math.min(enemy.slowFactor, slowFactor);
      }
      // Apply firewall DoT
      const existingFw = enemy.statusEffects.find((e) => e.type === "firewall");
      if (existingFw) {
        existingFw.remainingMs = 2000;
        existingFw.value = Math.max(existingFw.value, dotDps);
      } else {
        enemy.statusEffects.push({ type: "firewall", remainingMs: 2000, value: dotDps });
      }
    }
  }

  private tickPulse(
    tower: TowerInstance,
    enemies: Map<string, EnemyInstance>,
    projectiles: Map<string, Projectile>,
    nowMs: number,
    runMods: RunModifiers
  ): void {
    const def = TOWER_DEFS[tower.defId];
    const special = def.special as { type: "pulse"; interval: number; aoeRadius: number };
    let interval = special.interval;
    let aoeRadius = special.aoeRadius;
    if (tower.level >= 2) {
      interval = (def.upgrades[0].specialOverride as typeof special | undefined)?.interval ?? interval;
      aoeRadius = (def.upgrades[0].specialOverride as typeof special | undefined)?.aoeRadius ?? aoeRadius;
    }
    if (tower.level >= 3) {
      interval = (def.upgrades[1].specialOverride as typeof special | undefined)?.interval ?? interval;
      aoeRadius = (def.upgrades[1].specialOverride as typeof special | undefined)?.aoeRadius ?? aoeRadius;
    }

    if (nowMs - tower.lastFireTime < interval) return;
    tower.lastFireTime = nowMs;

    const towerX = tower.gridX * this.cellSize + this.cellSize / 2;
    const towerY = tower.gridY * this.cellSize + this.cellSize / 2;
    const damage = getEffectiveDamage(def, tower.level);

    for (const enemy of enemies.values()) {
      if (!enemy.isAlive) continue;
      if (dist(towerX, towerY, enemy.x, enemy.y) > aoeRadius) continue;

      const finalDamage = calcDamage(damage, def, enemy, runMods);
      enemy.hp = Math.max(0, enemy.hp - finalDamage);
      if (enemy.hp <= 0) enemy.isAlive = false;
    }
  }
}
