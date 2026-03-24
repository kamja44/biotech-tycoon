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
  isElite?: boolean;
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

  {
    id: "spam_bot",
    name: "스팸 봇",
    emoji: "📧",
    hpMin: 30,
    hpMax: 38,
    goldMin: 12,
    goldMax: 18,
    isBoss: false,
    patterns: [
      {
        actions: [{ type: "apply_status", status: "bleed", stacks: 2 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 6 }], intent: { type: "attack", value: 6 } },
      {
        actions: [{ type: "apply_status", status: "shock", stacks: 1 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 8 }], intent: { type: "attack", value: 8 } },
    ],
  },
  {
    id: "armored_guard",
    name: "장갑 경비",
    emoji: "🛡️",
    hpMin: 40,
    hpMax: 50,
    goldMin: 18,
    goldMax: 24,
    isBoss: false,
    patterns: [
      { actions: [{ type: "defend", amount: 12 }], intent: { type: "defend" } },
      { actions: [{ type: "defend", amount: 12 }], intent: { type: "defend" } },
      { actions: [{ type: "attack", amount: 20 }], intent: { type: "attack", value: 20 } },
    ],
  },
  {
    id: "shock_trooper",
    name: "충격 부대원",
    emoji: "⚡",
    hpMin: 38,
    hpMax: 48,
    goldMin: 16,
    goldMax: 22,
    isBoss: false,
    patterns: [
      {
        actions: [{ type: "apply_status", status: "shock", stacks: 2 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 12 }], intent: { type: "attack", value: 12 } },
      {
        actions: [{ type: "apply_status", status: "overload", stacks: 1 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 15 }], intent: { type: "attack", value: 15 } },
    ],
  },

  // ── 엘리트 적 ──────────────────────────────────────────

  {
    id: "cyber_hound",
    name: "사이버 하운드",
    emoji: "🐕",
    hpMin: 60,
    hpMax: 60,
    goldMin: 30,
    goldMax: 40,
    isBoss: false,
    isElite: true,
    patterns: [
      { actions: [{ type: "attack", amount: 12 }], intent: { type: "attack", value: 12 } },
      {
        actions: [
          { type: "attack", amount: 10 },
          { type: "apply_status", status: "bleed", stacks: 2 },
        ],
        intent: { type: "attack", value: 10 },
      },
      { actions: [{ type: "defend", amount: 10 }], intent: { type: "defend" } },
    ],
  },
  {
    id: "corp_enforcer",
    name: "코퍼 집행관",
    emoji: "👮",
    hpMin: 70,
    hpMax: 70,
    goldMin: 35,
    goldMax: 45,
    isBoss: false,
    isElite: true,
    patterns: [
      { actions: [{ type: "defend", amount: 12 }], intent: { type: "defend" } },
      {
        actions: [{ type: "apply_status", status: "overload", stacks: 2 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 22 }], intent: { type: "attack", value: 22 } },
    ],
  },
  {
    id: "defense_turret",
    name: "방어 터렛",
    emoji: "🔫",
    hpMin: 65,
    hpMax: 65,
    goldMin: 30,
    goldMax: 40,
    isBoss: false,
    isElite: true,
    patterns: [
      { actions: [{ type: "defend", amount: 18 }], intent: { type: "defend" } },
      { actions: [{ type: "defend", amount: 18 }], intent: { type: "defend" } },
      { actions: [{ type: "attack", amount: 20 }], intent: { type: "attack", value: 20 } },
    ],
  },
  {
    id: "nexus_hacker",
    name: "넥서스 해커",
    emoji: "💻",
    hpMin: 55,
    hpMax: 55,
    goldMin: 28,
    goldMax: 38,
    isBoss: false,
    isElite: true,
    patterns: [
      {
        actions: [{ type: "apply_status", status: "lock", stacks: 2 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 14 }], intent: { type: "attack", value: 14 } },
      { actions: [{ type: "buff", label: "공격력 +8" }], intent: { type: "buff" } },
      { actions: [{ type: "attack", amount: 20 }], intent: { type: "attack", value: 20 } },
    ],
  },
  {
    id: "enhanced_warrior",
    name: "강화 전사",
    emoji: "⚔️",
    hpMin: 75,
    hpMax: 75,
    goldMin: 32,
    goldMax: 42,
    isBoss: false,
    isElite: true,
    enrageHpPercent: 0.4,
    enrageAttackBonus: 8,
    patterns: [
      { actions: [{ type: "buff", label: "공격력 +4" }], intent: { type: "buff" } },
      { actions: [{ type: "attack", amount: 16 }], intent: { type: "attack", value: 16 } },
      { actions: [{ type: "defend", amount: 10 }], intent: { type: "defend" } },
    ],
  },
  {
    id: "security_ai",
    name: "보안 AI",
    emoji: "🤖",
    hpMin: 68,
    hpMax: 68,
    goldMin: 30,
    goldMax: 40,
    isBoss: false,
    isElite: true,
    enrageHpPercent: 0.5,
    enrageAttackBonus: 5,
    patterns: [
      { actions: [{ type: "attack", amount: 15 }], intent: { type: "attack", value: 15 } },
      {
        actions: [
          { type: "apply_status", status: "shock", stacks: 2 },
          { type: "attack", amount: 10 },
        ],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "defend", amount: 20 }], intent: { type: "defend" } },
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

  // ── Act 2 보스 ─────────────────────────────────────────

  {
    id: "nexus_guardian",
    name: "넥서스 가디언",
    emoji: "🔮",
    hpMin: 130,
    hpMax: 130,
    goldMin: 80,
    goldMax: 80,
    isBoss: true,
    patterns: [
      { actions: [{ type: "defend", amount: 20 }], intent: { type: "defend" } },
      { actions: [{ type: "attack", amount: 20 }], intent: { type: "attack", value: 20 } },
      {
        actions: [
          { type: "apply_status", status: "lock", stacks: 3 },
          { type: "apply_status", status: "shock", stacks: 2 },
        ],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 25 }], intent: { type: "attack", value: 25 } },
    ],
  },

  // ── Act 3 최종 보스 ────────────────────────────────────

  {
    id: "megacorp_os",
    name: "MEGACORP OS",
    emoji: "🖥️",
    hpMin: 220,
    hpMax: 220,
    goldMin: 0,
    goldMax: 0,
    isBoss: true,
    enrageHpPercent: 0.36,
    enrageAttackBonus: 5,
    patterns: [
      { actions: [{ type: "attack", amount: 15 }], intent: { type: "attack", value: 15 } },
      {
        actions: [{ type: "apply_status", status: "overload", stacks: 3 }],
        intent: { type: "debuff" },
      },
      { actions: [{ type: "attack", amount: 20 }], intent: { type: "attack", value: 20 } },
      { actions: [{ type: "attack", amount: 30 }], intent: { type: "attack", value: 30 } },
      {
        actions: [
          { type: "apply_status", status: "bleed", stacks: 3 },
          { type: "apply_status", status: "shock", stacks: 2 },
          { type: "apply_status", status: "lock", stacks: 2 },
        ],
        intent: { type: "debuff" },
      },
      {
        actions: [
          { type: "attack", amount: 25 },
          { type: "apply_status", status: "overload", stacks: 2 },
        ],
        intent: { type: "attack", value: 25 },
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
  const pool = ["guard_drone", "corp_agent", "scout_bot", "spam_bot", "armored_guard", "shock_trooper"];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── 엘리트 / 보스 헬퍼 ─────────────────────────────────────

export function getEliteEnemyId(): string {
  const pool = ["cyber_hound", "corp_enforcer", "defense_turret", "nexus_hacker", "enhanced_warrior", "security_ai"];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBossIdForAct(act: number): string {
  if (act === 1) return "ice_warden";
  if (act === 2) return "nexus_guardian";
  return "megacorp_os";
}
