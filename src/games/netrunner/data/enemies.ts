import type { EnemyInstance, EnemyIntent } from "../store/gameStore";

// ─── 타입 ──────────────────────────────────────────────────

export type EnemyAction =
  | { type: "attack"; amount: number }
  | { type: "defend"; amount: number }
  | { type: "buff"; label: string }
  | { type: "apply_status"; status: "bleed" | "shock" | "lock" | "overload"; stacks: number };

export interface EnemyPattern {
  actions: EnemyAction[];
  intent: EnemyIntent;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  emoji: string;
  hpMin: number;
  hpMax: number;
  goldMin: number;
  goldMax: number;
  isBoss: boolean;
  patterns: EnemyPattern[];
  enrageHpPercent?: number;
  enrageAttackBonus?: number;
}

const enemyDefs: EnemyDefinition[] = [
  // ── 일반 적 ────────────────────────────────────────────

  {
    id: "guard_drone",
    name: "경비 드론",
    emoji: "🤖",
    hpMin: 25,
    hpMax: 35,
    goldMin: 10,
    goldMax: 15,
    isBoss: false,
    patterns: [
      { actions: [{ type: "attack", amount: 8 }], intent: { type: "attack", value: 8 } },
      { actions: [{ type: "defend", amount: 5 }], intent: { type: "defend" } },
      { actions: [{ type: "attack", amount: 8 }], intent: { type: "attack", value: 8 } },
    ],
  },
  {
    id: "corp_agent",
    name: "코퍼 에이전트",
    emoji: "🕵️",
    hpMin: 35,
    hpMax: 45,
    goldMin: 15,
    goldMax: 20,
    isBoss: false,
    patterns: [
      { actions: [{ type: "buff", label: "공격력 +5" }], intent: { type: "buff" } },
      { actions: [{ type: "attack", amount: 14 }], intent: { type: "attack", value: 14 } },
      { actions: [{ type: "defend", amount: 8 }], intent: { type: "defend" } },
    ],
  },
  {
    id: "scout_bot",
    name: "정찰 봇",
    emoji: "🔍",
    hpMin: 20,
    hpMax: 28,
    goldMin: 8,
    goldMax: 12,
    isBoss: false,
    patterns: [
      { actions: [{ type: "attack", amount: 4 }], intent: { type: "attack", value: 4 } },
      { actions: [{ type: "attack", amount: 4 }], intent: { type: "attack", value: 4 } },
      { actions: [{ type: "attack", amount: 4 }], intent: { type: "attack", value: 4 } },
      { actions: [{ type: "defend", amount: 3 }], intent: { type: "defend" } },
    ],
  },

  // ── Act 1 보스 ─────────────────────────────────────────

  {
    id: "ice_warden",
    name: "ICE 워든",
    emoji: "🧊",
    hpMin: 80,
    hpMax: 80,
    goldMin: 50,
    goldMax: 50,
    isBoss: true,
    enrageHpPercent: 0.5,
    enrageAttackBonus: 6,
    patterns: [
      { actions: [{ type: "defend", amount: 15 }], intent: { type: "defend" } },
      { actions: [{ type: "attack", amount: 18 }], intent: { type: "attack", value: 18 } },
      {
        actions: [
          { type: "apply_status", status: "shock", stacks: 2 },
          { type: "attack", amount: 10 },
        ],
        intent: { type: "debuff" },
      },
      {
        actions: [
          { type: "apply_status", status: "overload", stacks: 2 },
          { type: "attack", amount: 12 },
        ],
        intent: { type: "debuff" },
      },
    ],
  },
];

// ─── 룩업 맵 ────────────────────────────────────────────────

const enemyMap = new Map<string, EnemyDefinition>(enemyDefs.map((e) => [e.id, e]));

export function getEnemyDef(id: string): EnemyDefinition {
  const def = enemyMap.get(id);
  if (!def) throw new Error(`Enemy definition not found: ${id}`);
  return def;
}

// ─── 전투용 EnemyInstance 생성 ──────────────────────────────

export function createEnemyInstance(definitionId: string): EnemyInstance {
  const def = getEnemyDef(definitionId);
  const hp = def.hpMin + Math.floor(Math.random() * (def.hpMax - def.hpMin + 1));
  const firstPattern = def.patterns[0];

  return {
    definitionId,
    hp,
    maxHp: hp,
    block: 0,
    statusEffects: [],
    intent: firstPattern.intent,
    patternIndex: 0,
    enraged: false,
  };
}

// ─── Phase 1 전투 시퀀스 (맵 없이 선형) ─────────────────────
// 층 1~2: 일반 적, 층 3: 보스

export function getEnemyIdForFloor(floor: number): string {
  if (floor >= 3) return "ice_warden";
  const pool = ["guard_drone", "corp_agent", "scout_bot"];
  return pool[Math.floor(Math.random() * pool.length)];
}
