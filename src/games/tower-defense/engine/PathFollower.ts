import type { EnemyInstance } from "../types/enemy";
import type { Waypoint } from "../types/map";
import { ENEMY_DEFS } from "../data/enemies";

export interface PathFollowerResult {
  exitedIds: string[];
}

export class PathFollower {
  private pathPx: Array<{ x: number; y: number }>;

  constructor(path: Waypoint[], cellSize: number) {
    // Convert grid waypoints to pixel centers
    this.pathPx = path.map((wp) => ({
      x: wp.x * cellSize + cellSize / 2,
      y: wp.y * cellSize + cellSize / 2,
    }));
  }

  /** Returns pixel position for a given waypoint index */
  getWaypointPx(index: number): { x: number; y: number } {
    return this.pathPx[Math.min(index, this.pathPx.length - 1)];
  }

  /** Spawn point pixel position */
  get spawnPx(): { x: number; y: number } {
    return this.pathPx[0];
  }

  /**
   * Advance all living enemies along the path.
   * globalSlowFactor: extra slow applied to all enemies (from roguelike upgrades), 0-0.8
   * Returns ids of enemies that reached the exit.
   */
  tick(
    enemies: Map<string, EnemyInstance>,
    deltaMs: number,
    globalSlowFactor: number
  ): PathFollowerResult {
    const exitedIds: string[] = [];

    for (const enemy of enemies.values()) {
      if (!enemy.isAlive) continue;

      const def = ENEMY_DEFS[enemy.defId];
      // effectiveSlowFactor: 1.0 = full speed, 0 = stopped
      const combinedSlow = Math.min(enemy.slowFactor, 1.0 - globalSlowFactor);
      const speed = def.speed * Math.max(0, combinedSlow);
      const distToMove = speed * (deltaMs / 1000);

      let remaining = distToMove;
      while (remaining > 0 && enemy.pathIndex < this.pathPx.length) {
        const target = this.pathPx[enemy.pathIndex];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distToTarget <= remaining) {
          enemy.x = target.x;
          enemy.y = target.y;
          enemy.distanceTraveled += distToTarget;
          remaining -= distToTarget;
          enemy.pathIndex++;
        } else {
          const ratio = remaining / distToTarget;
          enemy.x += dx * ratio;
          enemy.y += dy * ratio;
          enemy.distanceTraveled += remaining;
          remaining = 0;
        }
      }

      if (enemy.pathIndex >= this.pathPx.length) {
        enemy.isAlive = false;
        exitedIds.push(enemy.id);
      }
    }

    return { exitedIds };
  }
}
