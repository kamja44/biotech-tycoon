import type { EnemyTypeId } from "./enemy";

export interface EnemyModifier {
  hpMult?: number;
  speedMult?: number;
  rewardMult?: number;
}

export interface SpawnGroup {
  enemyDefId: EnemyTypeId;
  count: number;
  intervalMs: number;  // ms between spawns within group
  delayMs: number;     // ms delay before group starts
  modifiers?: EnemyModifier;
}

export interface WaveDef {
  waveNumber: number;  // 1-10 for story
  groups: SpawnGroup[];
  isBossWave: boolean;
}
