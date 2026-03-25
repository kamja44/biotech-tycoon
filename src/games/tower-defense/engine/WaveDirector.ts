import type { WaveDef, SpawnGroup } from "../types/wave";
import type { EnemyInstance } from "../types/enemy";
import type { Waypoint } from "../types/map";
import { createEnemyInstance } from "../data/enemies";

interface PendingSpawn {
  group: SpawnGroup;
  spawnedCount: number;
  nextSpawnAt: number; // ms since wave start
}

export class WaveDirector {
  private pendingSpawns: PendingSpawn[] = [];
  private elapsedMs = 0;
  private waveActive = false;
  private spawnPoint: { x: number; y: number };
  private onSpawn: (enemy: EnemyInstance) => void;

  constructor(
    spawnPoint: { x: number; y: number },
    onSpawn: (enemy: EnemyInstance) => void
  ) {
    this.spawnPoint = spawnPoint;
    this.onSpawn = onSpawn;
  }

  startWave(wave: WaveDef): void {
    this.elapsedMs = 0;
    this.waveActive = true;
    this.pendingSpawns = wave.groups.map((group) => ({
      group,
      spawnedCount: 0,
      nextSpawnAt: group.delayMs,
    }));
  }

  get isActive(): boolean {
    return this.waveActive;
  }

  get isDone(): boolean {
    if (!this.waveActive) return true;
    return this.pendingSpawns.every((p) => p.spawnedCount >= p.group.count);
  }

  tick(deltaMs: number, path: Waypoint[], cellSize: number): void {
    if (!this.waveActive || this.isDone) return;
    this.elapsedMs += deltaMs;

    for (const pending of this.pendingSpawns) {
      if (pending.spawnedCount >= pending.group.count) continue;

      while (
        pending.spawnedCount < pending.group.count &&
        this.elapsedMs >= pending.nextSpawnAt
      ) {
        const enemy = createEnemyInstance(
          pending.group.enemyDefId,
          this.spawnPoint.x,
          this.spawnPoint.y,
          pending.group.modifiers
        );
        this.onSpawn(enemy);
        pending.spawnedCount++;
        pending.nextSpawnAt += pending.group.intervalMs;
      }
    }

    if (this.isDone) {
      this.waveActive = false;
    }
  }

  reset(): void {
    this.pendingSpawns = [];
    this.elapsedMs = 0;
    this.waveActive = false;
  }
}
