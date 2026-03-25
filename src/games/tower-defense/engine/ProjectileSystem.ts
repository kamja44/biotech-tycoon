import type { Projectile } from "../types/projectile";
import type { EnemyInstance } from "../types/enemy";
import type { RunModifiers } from "../types/roguelike";
import { ENEMY_DEFS } from "../data/enemies";
import { applyDamage, applyStatusEffect, dist } from "./combat";

export interface ProjectileHitResult {
  killedEnemyIds: string[];
}

export class ProjectileSystem {
  tick(
    projectiles: Map<string, Projectile>,
    enemies: Map<string, EnemyInstance>,
    deltaMs: number,
    runMods: RunModifiers
  ): ProjectileHitResult {
    const killedEnemyIds: string[] = [];

    for (const proj of projectiles.values()) {
      if (!proj.isAlive) continue;

      const target = enemies.get(proj.targetEnemyId);

      // Target dead or missing — remove projectile
      if (!target || !target.isAlive) {
        proj.isAlive = false;
        continue;
      }

      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const distToTarget = Math.sqrt(dx * dx + dy * dy);
      const travelDist = proj.speed * (deltaMs / 1000);

      if (travelDist >= distToTarget) {
        // Hit!
        proj.isAlive = false;
        const killed = this.applyHit(proj, target, enemies, runMods);
        for (const id of killed) killedEnemyIds.push(id);
      } else {
        // Move toward target
        const ratio = travelDist / distToTarget;
        proj.x += dx * ratio;
        proj.y += dy * ratio;
      }
    }

    // Clean up dead projectiles
    for (const [id, proj] of projectiles) {
      if (!proj.isAlive) projectiles.delete(id);
    }

    return { killedEnemyIds };
  }

  private applyHit(
    proj: Projectile,
    primaryTarget: EnemyInstance,
    enemies: Map<string, EnemyInstance>,
    runMods: RunModifiers
  ): string[] {
    const killed: string[] = [];
    const special = proj.special;

    if (!special) {
      // Simple single-target
      if (applyDamage(primaryTarget, proj.damage)) {
        killed.push(primaryTarget.id);
        this.handleDeath(primaryTarget, enemies, killed);
      }
      return killed;
    }

    switch (special.type) {
      case "aoe": {
        // Damage all enemies within AoE radius
        for (const enemy of enemies.values()) {
          if (!enemy.isAlive) continue;
          if (dist(proj.x, proj.y, enemy.x, enemy.y) <= special.radius) {
            if (applyDamage(enemy, proj.damage)) {
              killed.push(enemy.id);
              this.handleDeath(enemy, enemies, killed);
            }
          }
        }
        break;
      }

      case "chain": {
        // Chain to nearest enemies
        const chained = new Set<string>([primaryTarget.id]);
        let damage = proj.damage;
        let currentTarget = primaryTarget;

        if (applyDamage(primaryTarget, damage)) {
          killed.push(primaryTarget.id);
          this.handleDeath(primaryTarget, enemies, killed);
        }

        for (let i = 0; i < special.bounces; i++) {
          damage = Math.round(damage * special.damageFalloff);
          if (damage < 1) break;

          const next = this.findNearestUnchained(currentTarget, enemies, chained, 200);
          if (!next) break;
          chained.add(next.id);
          if (applyDamage(next, damage)) {
            killed.push(next.id);
            this.handleDeath(next, enemies, killed);
          }
          currentTarget = next;
        }
        break;
      }

      case "slow": {
        if (applyDamage(primaryTarget, proj.damage)) {
          killed.push(primaryTarget.id);
          this.handleDeath(primaryTarget, enemies, killed);
        } else {
          applyStatusEffect(primaryTarget, {
            type: "slow",
            remainingMs: special.duration,
            value: special.factor,
          });
        }
        break;
      }

      case "dot": {
        if (applyDamage(primaryTarget, proj.damage)) {
          killed.push(primaryTarget.id);
          this.handleDeath(primaryTarget, enemies, killed);
        } else {
          applyStatusEffect(primaryTarget, {
            type: "dot",
            remainingMs: special.duration,
            value: special.dps,
          });
        }
        break;
      }

      case "laser": {
        // Pierce through multiple enemies in direction of travel
        let piercesLeft = special.pierceCount;
        const pierced = new Set<string>();
        for (const enemy of enemies.values()) {
          if (!enemy.isAlive || piercesLeft <= 0) break;
          if (pierced.has(enemy.id)) continue;
          if (dist(proj.x, proj.y, enemy.x, enemy.y) <= 30) {
            pierced.add(enemy.id);
            piercesLeft--;
            if (applyDamage(enemy, proj.damage)) {
              killed.push(enemy.id);
              this.handleDeath(enemy, enemies, killed);
            }
          }
        }
        // Always hit primary target
        if (!pierced.has(primaryTarget.id)) {
          if (applyDamage(primaryTarget, proj.damage)) {
            killed.push(primaryTarget.id);
            this.handleDeath(primaryTarget, enemies, killed);
          }
        }
        break;
      }

      case "emp": {
        if (applyDamage(primaryTarget, proj.damage)) {
          killed.push(primaryTarget.id);
          this.handleDeath(primaryTarget, enemies, killed);
        } else {
          applyStatusEffect(primaryTarget, {
            type: "stun",
            remainingMs: special.stunDuration,
            value: 0,
          });
        }
        break;
      }

      case "overload": {
        // Check if charged
        const chargeStart = primaryTarget.statusEffects.find((e) => e.type === "dot");
        const isDischarged = proj.damage >= special.burstDamage;
        if (isDischarged) {
          // Burst damage
          if (applyDamage(primaryTarget, special.burstDamage)) {
            killed.push(primaryTarget.id);
            this.handleDeath(primaryTarget, enemies, killed);
          }
        } else {
          if (applyDamage(primaryTarget, proj.damage)) {
            killed.push(primaryTarget.id);
            this.handleDeath(primaryTarget, enemies, killed);
          }
        }
        break;
      }

      default: {
        // Fallback: plain damage
        if (applyDamage(primaryTarget, proj.damage)) {
          killed.push(primaryTarget.id);
          this.handleDeath(primaryTarget, enemies, killed);
        }
      }
    }

    return killed;
  }

  private handleDeath(
    enemy: EnemyInstance,
    enemies: Map<string, EnemyInstance>,
    killed: string[]
  ): void {
    const def = ENEMY_DEFS[enemy.defId];
    if (def.special?.type === "split") {
      // Spawn children at same position (WaveDirector handles actual spawn via callback)
      // We mark the split data on the enemy for the engine to handle
      (enemy as EnemyInstance & { _splitPending?: boolean })._splitPending = true;
    }
  }

  private findNearestUnchained(
    from: EnemyInstance,
    enemies: Map<string, EnemyInstance>,
    exclude: Set<string>,
    maxRange: number
  ): EnemyInstance | null {
    let nearest: EnemyInstance | null = null;
    let nearestDist = maxRange;
    for (const enemy of enemies.values()) {
      if (!enemy.isAlive || exclude.has(enemy.id)) continue;
      const d = dist(from.x, from.y, enemy.x, enemy.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    }
    return nearest;
  }
}
