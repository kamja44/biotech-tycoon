import type { TowerInstance, PlacedTowerSave } from "../types/tower";
import type { EnemyInstance } from "../types/enemy";
import type { Projectile } from "../types/projectile";
import type { MapDef } from "../types/map";
import type { WaveDef } from "../types/wave";
import type { RunModifiers } from "../types/roguelike";
import { TOWER_DEFS } from "../data/towers";
import { ENEMY_DEFS } from "../data/enemies";
import { createEnemyInstance } from "../data/enemies";
import { tickStatusEffects } from "./combat";
import { PathFollower } from "./PathFollower";
import { WaveDirector } from "./WaveDirector";
import { TowerSystem } from "./TowerSystem";
import { ProjectileSystem } from "./ProjectileSystem";
import { renderFrame } from "../renderer/CanvasRenderer";

export interface EngineCallbacks {
  onEnemyKilled: (reward: number) => void;
  onEnemyLeaked: (leakDamage: number) => void;
  onWaveComplete: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private lastTime = 0;
  private paused = false;
  private speedMult: 1 | 2 | 3 = 1;

  // Game world state
  private towers: Map<string, TowerInstance> = new Map();
  private enemies: Map<string, EnemyInstance> = new Map();
  private projectiles: Map<string, Projectile> = new Map();

  // Subsystems
  private pathFollower!: PathFollower;
  private waveDirector!: WaveDirector;
  private towerSystem!: TowerSystem;
  private projectileSystem: ProjectileSystem;

  // Current map & modifiers
  private mapDef!: MapDef;
  private runMods: RunModifiers;
  private callbacks: EngineCallbacks;

  // Accumulated scaled game time (advances faster at 2x/3x speed)
  private _gameTimeMs = 0;

  // UI state (read by React via getUIState)
  private _hoveredCell: { gridX: number; gridY: number } | null = null;
  private _selectedTowerDefId: string | null = null;
  private _waveCompleteFired = false;
  private _waveEverStarted = false;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: EngineCallbacks,
    runMods: RunModifiers
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.runMods = runMods;
    this.projectileSystem = new ProjectileSystem();
    this.tick = this.tick.bind(this);
  }

  loadMap(mapDef: MapDef): void {
    this.mapDef = mapDef;
    this.canvas.width = mapDef.gridWidth * mapDef.cellSize;
    this.canvas.height = mapDef.gridHeight * mapDef.cellSize;
    this.pathFollower = new PathFollower(mapDef.path, mapDef.cellSize);
    this.towerSystem = new TowerSystem(mapDef.cellSize);
    const spawnPx = this.pathFollower.spawnPx;
    this.waveDirector = new WaveDirector(spawnPx, (enemy) => {
      this.enemies.set(enemy.id, enemy);
    });
    this.towers.clear();
    this.enemies.clear();
    this.projectiles.clear();
    this._gameTimeMs = 0;
    // Start idle render loop so map/path is visible before first wave
    if (this.rafId === 0) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  loadTowers(saved: PlacedTowerSave[]): void {
    this.towers.clear();
    for (const s of saved) {
      this.towers.set(s.id, {
        id: s.id,
        defId: s.defId,
        gridX: s.gridX,
        gridY: s.gridY,
        level: s.level,
        lastFireTime: 0,
        targetId: null,
        specialState: {},
      });
    }
  }

  addTower(saved: PlacedTowerSave): void {
    this.towers.set(saved.id, {
      id: saved.id,
      defId: saved.defId,
      gridX: saved.gridX,
      gridY: saved.gridY,
      level: saved.level,
      lastFireTime: 0,
      targetId: null,
      specialState: {},
    });
  }

  removeTower(towerId: string): void {
    this.towers.delete(towerId);
  }

  upgradeTower(towerId: string): void {
    const tower = this.towers.get(towerId);
    if (tower && tower.level < 3) {
      tower.level = (tower.level + 1) as 1 | 2 | 3;
    }
  }

  startWave(wave: WaveDef): void {
    this._waveEverStarted = true;
    this._waveCompleteFired = false;
    this.waveDirector.startWave(wave);
    if (this.rafId === 0) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  applyRunModifiers(mods: RunModifiers): void {
    this.runMods = mods;
  }

  setHoveredCell(gridX: number | null, gridY: number | null): void {
    this._hoveredCell = gridX !== null && gridY !== null ? { gridX, gridY } : null;
  }

  setSelectedTowerDefId(id: string | null): void {
    this._selectedTowerDefId = id;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
      if (this.rafId === 0) {
        this.rafId = requestAnimationFrame(this.tick);
      }
    }
  }

  setSpeed(mult: 1 | 2 | 3): void {
    this.speedMult = mult;
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick(timestamp: number): void {
    const rawDelta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    // Clamp to 100ms to prevent spiral-of-death on tab switch
    const deltaMs = Math.min(rawDelta, 100) * this.speedMult;

    if (!this.paused) {
      this.update(deltaMs);
    }

    this.draw();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private update(deltaMs: number): void {
    this._gameTimeMs += deltaMs;
    const now = this._gameTimeMs;

    // 1. Spawn new enemies
    this.waveDirector.tick(deltaMs, this.mapDef.path, this.mapDef.cellSize);

    // 2. Tick status effects (DoT damage)
    for (const enemy of this.enemies.values()) {
      if (!enemy.isAlive) continue;
      const dotDmg = tickStatusEffects(enemy, deltaMs);
      if (dotDmg > 0) {
        enemy.hp = Math.max(0, enemy.hp - dotDmg);
        if (enemy.hp <= 0) {
          enemy.isAlive = false;
          const def = ENEMY_DEFS[enemy.defId];
          this.callbacks.onEnemyKilled(def.reward);
          this.handleSplit(enemy);
        }
      }
      // Regeneration
      const def = ENEMY_DEFS[enemy.defId];
      if (def.special?.type === "regen") {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + (def.special.hpPerSecond * deltaMs) / 1000);
      }
    }

    // 3. Move enemies along path
    const { exitedIds } = this.pathFollower.tick(
      this.enemies,
      deltaMs,
      this.runMods.enemySlowGlobal
    );
    for (const id of exitedIds) {
      const enemy = this.enemies.get(id);
      if (enemy) {
        const def = ENEMY_DEFS[enemy.defId];
        this.callbacks.onEnemyLeaked(def.leakDamage);
      }
    }

    // 4. Tower targeting & firing
    this.towerSystem.tick(this.towers, this.enemies, this.projectiles, now, this.runMods);

    // 5. Move projectiles & resolve hits
    const { killedEnemyIds } = this.projectileSystem.tick(
      this.projectiles,
      this.enemies,
      deltaMs,
      this.runMods
    );
    for (const id of killedEnemyIds) {
      const enemy = this.enemies.get(id);
      if (enemy) {
        const def = ENEMY_DEFS[enemy.defId];
        this.callbacks.onEnemyKilled(def.reward);
        this.handleSplit(enemy);
      }
    }

    // 6. Clean up dead enemies
    for (const [id, enemy] of this.enemies) {
      if (!enemy.isAlive) this.enemies.delete(id);
    }

    // 7. Check wave complete: spawning done + no enemies alive (fire only once, only after a wave actually started)
    if (this._waveEverStarted && this.waveDirector.isDone && this.enemies.size === 0 && !this._waveCompleteFired) {
      this._waveCompleteFired = true;
      this.callbacks.onWaveComplete();
    }
  }

  private handleSplit(enemy: EnemyInstance): void {
    const def = ENEMY_DEFS[enemy.defId];
    if (def.special?.type === "split") {
      for (let i = 0; i < def.special.count; i++) {
        const child = createEnemyInstance(def.special.childId, enemy.x, enemy.y);
        child.pathIndex = enemy.pathIndex;
        child.distanceTraveled = enemy.distanceTraveled;
        this.enemies.set(child.id, child);
      }
    }
  }

  private draw(): void {
    renderFrame(
      this.ctx,
      this.canvas,
      this.mapDef,
      this.towers,
      this.enemies,
      this.projectiles,
      this._hoveredCell,
      this._selectedTowerDefId,
      this.runMods
    );
  }
}
