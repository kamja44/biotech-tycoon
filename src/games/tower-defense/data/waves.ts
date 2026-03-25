import type { WaveDef, SpawnGroup } from "../types/wave";
import type { EnemyTypeId } from "../types/enemy";

// Helper to make a simple spawn group
function g(
  enemyDefId: EnemyTypeId,
  count: number,
  intervalMs = 1000,
  delayMs = 0,
  hpMult = 1,
  speedMult = 1
): SpawnGroup {
  return {
    enemyDefId,
    count,
    intervalMs,
    delayMs,
    modifiers: hpMult !== 1 || speedMult !== 1 ? { hpMult, speedMult } : undefined,
  };
}

// 10 waves per map, 10 maps = 100 wave definitions
export const STORY_WAVES: Record<string, WaveDef[]> = {
  map_01: [
    { waveNumber: 1, groups: [g("grunt", 8, 1200)], isBossWave: false },
    { waveNumber: 2, groups: [g("grunt", 10, 1000), g("runner", 3, 800, 4000)], isBossWave: false },
    { waveNumber: 3, groups: [g("runner", 8, 700), g("grunt", 6, 1000, 3000)], isBossWave: false },
    { waveNumber: 4, groups: [g("grunt", 12, 900), g("runner", 5, 600, 5000)], isBossWave: false },
    { waveNumber: 5, groups: [g("armored", 4, 2000), g("grunt", 8, 800, 6000)], isBossWave: false },
    { waveNumber: 6, groups: [g("runner", 10, 600), g("armored", 3, 1800, 4000)], isBossWave: false },
    { waveNumber: 7, groups: [g("grunt", 15, 700), g("runner", 8, 500, 6000)], isBossWave: false },
    { waveNumber: 8, groups: [g("armored", 5, 1500), g("runner", 10, 600, 7000)], isBossWave: false },
    { waveNumber: 9, groups: [g("grunt", 20, 500), g("armored", 4, 1500, 8000), g("runner", 6, 600, 12000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_ice", 1, 0), g("grunt", 10, 800, 3000)], isBossWave: true },
  ],

  map_02: [
    { waveNumber: 1, groups: [g("grunt", 10, 1000)], isBossWave: false },
    { waveNumber: 2, groups: [g("runner", 8, 700)], isBossWave: false },
    { waveNumber: 3, groups: [g("grunt", 8, 900), g("drone", 5, 600, 4000)], isBossWave: false },
    { waveNumber: 4, groups: [g("runner", 10, 650), g("grunt", 5, 900, 5000)], isBossWave: false },
    { waveNumber: 5, groups: [g("armored", 5, 1600), g("drone", 6, 500, 5000)], isBossWave: false },
    { waveNumber: 6, groups: [g("drone", 12, 400), g("armored", 3, 1600, 5000)], isBossWave: false },
    { waveNumber: 7, groups: [g("runner", 12, 550), g("grunt", 8, 800, 5000), g("drone", 5, 500, 10000)], isBossWave: false },
    { waveNumber: 8, groups: [g("armored", 6, 1400), g("drone", 8, 450, 7000)], isBossWave: false },
    { waveNumber: 9, groups: [g("runner", 15, 450), g("armored", 5, 1200, 7000), g("drone", 8, 400, 12000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_ice", 1, 0, 0, 1.2), g("drone", 12, 400, 4000)], isBossWave: true },
  ],

  map_03: [
    { waveNumber: 1, groups: [g("grunt", 10, 1000), g("runner", 4, 700, 6000)], isBossWave: false },
    { waveNumber: 2, groups: [g("runner", 10, 650), g("grunt", 6, 900, 5000)], isBossWave: false },
    { waveNumber: 3, groups: [g("armored", 4, 1600), g("runner", 6, 600, 5000)], isBossWave: false },
    { waveNumber: 4, groups: [g("stealth", 5, 1200)], isBossWave: false },
    { waveNumber: 5, groups: [g("grunt", 15, 700), g("stealth", 4, 1000, 7000)], isBossWave: false },
    { waveNumber: 6, groups: [g("armored", 5, 1400), g("stealth", 4, 900, 6000)], isBossWave: false },
    { waveNumber: 7, groups: [g("runner", 14, 500), g("armored", 4, 1300, 7000)], isBossWave: false },
    { waveNumber: 8, groups: [g("stealth", 8, 800), g("grunt", 10, 700, 7000)], isBossWave: false },
    { waveNumber: 9, groups: [g("armored", 6, 1200), g("stealth", 6, 700, 7000), g("runner", 8, 500, 12000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_nexus", 1, 0), g("stealth", 6, 700, 5000)], isBossWave: true },
  ],

  map_04: [
    { waveNumber: 1, groups: [g("grunt", 12, 900)], isBossWave: false },
    { waveNumber: 2, groups: [g("runner", 10, 600), g("drone", 6, 500, 5000)], isBossWave: false },
    { waveNumber: 3, groups: [g("splitter", 4, 1800)], isBossWave: false },
    { waveNumber: 4, groups: [g("armored", 5, 1400), g("runner", 8, 550, 6000)], isBossWave: false },
    { waveNumber: 5, groups: [g("splitter", 5, 1500), g("grunt", 10, 700, 7000)], isBossWave: false },
    { waveNumber: 6, groups: [g("runner", 14, 500), g("splitter", 4, 1300, 7000)], isBossWave: false },
    { waveNumber: 7, groups: [g("armored", 6, 1200), g("drone", 10, 400, 6000)], isBossWave: false },
    { waveNumber: 8, groups: [g("splitter", 6, 1200), g("runner", 10, 500, 7000)], isBossWave: false },
    { waveNumber: 9, groups: [g("armored", 7, 1100), g("splitter", 5, 1100, 7000), g("runner", 10, 450, 12000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_nexus", 1, 0, 0, 1.1), g("splitter", 5, 1000, 5000)], isBossWave: true },
  ],

  map_05: [
    { waveNumber: 1, groups: [g("runner", 12, 600)], isBossWave: false },
    { waveNumber: 2, groups: [g("armored", 5, 1400), g("grunt", 8, 800, 5000)], isBossWave: false },
    { waveNumber: 3, groups: [g("stealth", 6, 1000), g("runner", 8, 550, 5000)], isBossWave: false },
    { waveNumber: 4, groups: [g("regenerator", 3, 2000)], isBossWave: false },
    { waveNumber: 5, groups: [g("runner", 15, 500), g("regenerator", 2, 1800, 8000)], isBossWave: false },
    { waveNumber: 6, groups: [g("armored", 6, 1200), g("stealth", 6, 800, 6000)], isBossWave: false },
    { waveNumber: 7, groups: [g("regenerator", 4, 1600), g("runner", 12, 500, 7000)], isBossWave: false },
    { waveNumber: 8, groups: [g("stealth", 8, 700), g("armored", 6, 1100, 7000)], isBossWave: false },
    { waveNumber: 9, groups: [g("regenerator", 5, 1400), g("stealth", 6, 700, 8000), g("armored", 5, 1100, 14000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_nexus", 1, 0, 0, 1.3), g("regenerator", 3, 1400, 5000)], isBossWave: true },
  ],

  map_06: [
    { waveNumber: 1, groups: [g("grunt", 14, 800), g("drone", 6, 500, 6000)], isBossWave: false },
    { waveNumber: 2, groups: [g("armored", 6, 1300), g("runner", 8, 550, 6000)], isBossWave: false },
    { waveNumber: 3, groups: [g("splitter", 5, 1400), g("stealth", 4, 900, 7000)], isBossWave: false },
    { waveNumber: 4, groups: [g("regenerator", 4, 1600), g("drone", 10, 400, 7000)], isBossWave: false },
    { waveNumber: 5, groups: [g("armored", 7, 1200, 0, 1.2), g("runner", 12, 500, 7000)], isBossWave: false },
    { waveNumber: 6, groups: [g("stealth", 10, 700), g("regenerator", 3, 1500, 8000)], isBossWave: false },
    { waveNumber: 7, groups: [g("splitter", 7, 1200), g("armored", 5, 1200, 7000)], isBossWave: false },
    { waveNumber: 8, groups: [g("regenerator", 5, 1300), g("stealth", 8, 650, 7000), g("drone", 10, 400, 13000)], isBossWave: false },
    { waveNumber: 9, groups: [g("armored", 8, 1100, 0, 1.3), g("splitter", 5, 1000, 7000), g("stealth", 6, 650, 13000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_megacorp", 1, 0, 0, 0.7), g("armored", 6, 1100, 6000)], isBossWave: true },
  ],

  map_07: [
    { waveNumber: 1, groups: [g("runner", 14, 550), g("stealth", 5, 900, 7000)], isBossWave: false },
    { waveNumber: 2, groups: [g("armored", 7, 1200), g("splitter", 4, 1300, 6000)], isBossWave: false },
    { waveNumber: 3, groups: [g("regenerator", 5, 1400), g("runner", 10, 500, 7000)], isBossWave: false },
    { waveNumber: 4, groups: [g("stealth", 10, 650), g("armored", 5, 1200, 7000)], isBossWave: false },
    { waveNumber: 5, groups: [g("splitter", 7, 1100), g("regenerator", 4, 1300, 8000)], isBossWave: false },
    { waveNumber: 6, groups: [g("armored", 8, 1100, 0, 1.3), g("stealth", 8, 600, 8000)], isBossWave: false },
    { waveNumber: 7, groups: [g("regenerator", 6, 1200), g("splitter", 6, 1000, 8000), g("runner", 10, 480, 14000)], isBossWave: false },
    { waveNumber: 8, groups: [g("stealth", 12, 600), g("armored", 6, 1000, 8000)], isBossWave: false },
    { waveNumber: 9, groups: [g("regenerator", 7, 1100, 0, 1.4), g("splitter", 6, 900, 8000), g("armored", 6, 1000, 14000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_megacorp", 1, 0, 0, 0.8), g("regenerator", 4, 1200, 6000)], isBossWave: true },
  ],

  map_08: [
    { waveNumber: 1, groups: [g("armored", 8, 1100, 0, 1.1), g("drone", 10, 400, 7000)], isBossWave: false },
    { waveNumber: 2, groups: [g("stealth", 8, 700), g("regenerator", 4, 1300, 7000)], isBossWave: false },
    { waveNumber: 3, groups: [g("splitter", 7, 1000), g("runner", 12, 480, 7000)], isBossWave: false },
    { waveNumber: 4, groups: [g("armored", 8, 1000, 0, 1.3), g("stealth", 7, 620, 7000)], isBossWave: false },
    { waveNumber: 5, groups: [g("regenerator", 7, 1100), g("splitter", 5, 950, 8000), g("drone", 8, 380, 14000)], isBossWave: false },
    { waveNumber: 6, groups: [g("stealth", 12, 580), g("armored", 7, 950, 8000)], isBossWave: false },
    { waveNumber: 7, groups: [g("splitter", 8, 900, 0, 1.2), g("regenerator", 5, 1000, 9000)], isBossWave: false },
    { waveNumber: 8, groups: [g("armored", 9, 950, 0, 1.4), g("stealth", 9, 560, 8000), g("regenerator", 4, 1000, 14000)], isBossWave: false },
    { waveNumber: 9, groups: [g("regenerator", 8, 1000, 0, 1.5), g("splitter", 7, 850, 9000), g("stealth", 8, 550, 15000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_megacorp", 1, 0, 0, 0.9), g("stealth", 8, 580, 6000), g("armored", 6, 950, 12000)], isBossWave: true },
  ],

  map_09: [
    { waveNumber: 1, groups: [g("armored", 9, 1000, 0, 1.2), g("stealth", 7, 620, 6000)], isBossWave: false },
    { waveNumber: 2, groups: [g("regenerator", 7, 1000), g("runner", 14, 460, 7000)], isBossWave: false },
    { waveNumber: 3, groups: [g("splitter", 8, 880, 0, 1.2), g("armored", 6, 970, 7000)], isBossWave: false },
    { waveNumber: 4, groups: [g("stealth", 12, 560), g("regenerator", 5, 950, 8000)], isBossWave: false },
    { waveNumber: 5, groups: [g("armored", 10, 930, 0, 1.4), g("splitter", 7, 820, 8000), g("drone", 10, 360, 14000)], isBossWave: false },
    { waveNumber: 6, groups: [g("regenerator", 8, 950, 0, 1.5), g("stealth", 10, 540, 9000)], isBossWave: false },
    { waveNumber: 7, groups: [g("splitter", 9, 820, 0, 1.3), g("armored", 8, 900, 9000), g("runner", 12, 440, 15000)], isBossWave: false },
    { waveNumber: 8, groups: [g("stealth", 14, 520), g("regenerator", 7, 880, 9000), g("splitter", 6, 800, 15000)], isBossWave: false },
    { waveNumber: 9, groups: [g("armored", 12, 880, 0, 1.6), g("regenerator", 8, 860, 10000), g("stealth", 10, 510, 16000)], isBossWave: false },
    { waveNumber: 10, groups: [g("boss_megacorp", 1, 0, 0, 1.0), g("regenerator", 5, 900, 5000), g("stealth", 8, 540, 11000)], isBossWave: true },
  ],

  map_10: [
    { waveNumber: 1, groups: [g("armored", 10, 950, 0, 1.3), g("regenerator", 5, 950, 8000)], isBossWave: false },
    { waveNumber: 2, groups: [g("stealth", 12, 540), g("splitter", 8, 800, 7000)], isBossWave: false },
    { waveNumber: 3, groups: [g("regenerator", 8, 900, 0, 1.5), g("armored", 8, 900, 8000)], isBossWave: false },
    { waveNumber: 4, groups: [g("splitter", 10, 780, 0, 1.3), g("stealth", 10, 520, 9000)], isBossWave: false },
    { waveNumber: 5, groups: [g("boss_ice", 1, 0, 0, 1.5), g("armored", 8, 880, 5000)], isBossWave: true },
    { waveNumber: 6, groups: [g("regenerator", 9, 860, 0, 1.6), g("splitter", 8, 760, 9000), g("stealth", 8, 500, 15000)], isBossWave: false },
    { waveNumber: 7, groups: [g("armored", 12, 860, 0, 1.7), g("regenerator", 7, 840, 10000)], isBossWave: false },
    { waveNumber: 8, groups: [g("stealth", 15, 500), g("splitter", 9, 740, 9000), g("armored", 8, 840, 16000)], isBossWave: false },
    { waveNumber: 9, groups: [g("boss_nexus", 1, 0, 0, 1.5), g("regenerator", 8, 820, 5000), g("stealth", 10, 490, 11000)], isBossWave: true },
    { waveNumber: 10, groups: [g("boss_megacorp", 1, 0, 0, 1.2), g("boss_ice", 1, 0, 5000, 1.2), g("regenerator", 8, 800, 10000)], isBossWave: true },
  ],
};

// Endless mode wave generator
export function buildEndlessWave(waveNumber: number): WaveDef {
  const isBossWave = waveNumber % 5 === 0;

  let budget: number;
  if (waveNumber <= 20) {
    budget = 100 + (waveNumber - 1) * 35;
  } else if (waveNumber <= 60) {
    budget = 765 + Math.sqrt(waveNumber - 20) * 120;
  } else {
    budget = 1524 + Math.log(waveNumber - 59) * 300;
  }

  const hpMult = Math.min(1 + (waveNumber - 1) * 0.12, 8.0);
  const speedMult = waveNumber > 30 ? 1 + Math.log(waveNumber - 29) * 0.15 : 1.0;

  const groups: SpawnGroup[] = [];

  if (isBossWave) {
    const bossId: EnemyTypeId = waveNumber >= 30 ? "boss_megacorp"
      : waveNumber >= 15 ? "boss_nexus"
      : "boss_ice";
    groups.push(g(bossId, 1, 0, 0, hpMult, speedMult));
    const escortCount = Math.floor(budget / 3 / 15);
    if (escortCount > 0) {
      groups.push(g("armored", Math.min(escortCount, 12), 800, 3000, hpMult * 0.8, speedMult));
    }
  } else {
    const availableTypes: EnemyTypeId[] = ["grunt", "runner"];
    if (waveNumber >= 3) availableTypes.push("armored");
    if (waveNumber >= 5) availableTypes.push("drone");
    if (waveNumber >= 8) availableTypes.push("stealth");
    if (waveNumber >= 12) availableTypes.push("splitter");
    if (waveNumber >= 18) availableTypes.push("regenerator");

    const costs: Partial<Record<EnemyTypeId, number>> = {
      grunt: 10, runner: 15, armored: 25, drone: 20,
      stealth: 30, splitter: 35, regenerator: 40,
    };

    let remaining = budget;
    let delay = 0;
    while (remaining > 10 && groups.length < 3) {
      const typeIdx = Math.floor((waveNumber * 7 + groups.length * 13) % availableTypes.length);
      const enemyId = availableTypes[typeIdx];
      const cost = costs[enemyId] ?? 15;
      const count = Math.min(Math.floor(remaining / cost), 15);
      if (count <= 0) break;
      groups.push(g(enemyId, count, Math.max(300, 900 - waveNumber * 10), delay, hpMult, speedMult));
      remaining -= count * cost;
      delay += count * Math.max(300, 900 - waveNumber * 10) + 2000;
    }
  }

  return { waveNumber, groups, isBossWave };
}

export function getStoryWaves(mapId: string): WaveDef[] {
  return STORY_WAVES[mapId] ?? [];
}
