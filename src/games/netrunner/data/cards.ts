import type { StatusEffectId } from "../store/gameStore";

// ─── 타입 ──────────────────────────────────────────────────

export type CombatAction =
  | { type: "deal_damage"; target: "player" | "enemy"; amount: number }
  | { type: "add_block"; target: "player" | "enemy"; amount: number }
  | { type: "apply_status"; target: "player" | "enemy"; status: StatusEffectId; stacks: number }
  | { type: "draw_cards"; amount: number }
  | { type: "draw_from_discard"; amount: number }
  | { type: "gain_energy"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "negate_next_intent" };

export interface CombatContext {
  playerHp: number;
  playerMaxHp: number;
  playerBlock: number;
  playerEnergy: number;
  playerHandSize: number;
  playerCardsPlayedThisTurn: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyBlock: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  type: "attack" | "skill" | "power";
  rarity: "common" | "uncommon" | "rare";
  classes: ("ghost" | "tank" | "hacker" | "neutral")[];
  description: (upgraded: boolean) => string;
  effect: (ctx: CombatContext, upgraded: boolean) => CombatAction[];
}

// ─── 카드 정의 ──────────────────────────────────────────────

const cardDefs: CardDefinition[] = [
  // ── Ghost 시작 덱 ──────────────────────────────────────

  {
    id: "ghost_swift_strike",
    name: "신속 타격",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `${u ? 9 : 6} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 9 : 6 }],
  },
  {
    id: "ghost_dodge",
    name: "회피 기동",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `블록 ${u ? 6 : 4}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 6 : 4 }],
  },
  {
    id: "ghost_dual_blades",
    name: "쌍검",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `${u ? 5 : 4} 피해 2회`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 5 : 4 },
      { type: "deal_damage", target: "enemy", amount: u ? 5 : 4 },
    ],
  },
  {
    id: "ghost_fade",
    name: "페이드",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `다음 공격 ${u ? 2 : 1}회 회피`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "player", status: "dodge", stacks: u ? 2 : 1 },
    ],
  },
  {
    id: "ghost_rapid_combo",
    name: "연속 공격",
    cost: 2,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `카드 1장 드로우 후 ${u ? 6 : 5} 피해 2회`,
    effect: (_ctx, u) => [
      { type: "draw_cards", amount: 1 },
      { type: "deal_damage", target: "enemy", amount: u ? 6 : 5 },
      { type: "deal_damage", target: "enemy", amount: u ? 6 : 5 },
    ],
  },

  // ── Ghost 카드 풀 — Common ──────────────────────────────

  {
    id: "ghost_finisher",
    name: "마무리 일격",
    cost: 2,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `${u ? 30 : 20} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 30 : 20 }],
  },
  {
    id: "ghost_rapid_fire",
    name: "고속 난무",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `${u ? 4 : 3} 피해 3회`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 4 : 3 },
      { type: "deal_damage", target: "enemy", amount: u ? 4 : 3 },
      { type: "deal_damage", target: "enemy", amount: u ? 4 : 3 },
    ],
  },
  {
    id: "ghost_smoke_bomb",
    name: "연막탄",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `블록 ${u ? 7 : 5}, 다음 공격 1회 회피`,
    effect: (_ctx, u) => [
      { type: "add_block", target: "player", amount: u ? 7 : 5 },
      { type: "apply_status", target: "player", status: "dodge", stacks: 1 },
    ],
  },
  {
    id: "ghost_combo_strike",
    name: "연속 찌르기",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `${u ? 5 : 4} 피해 + 이번 턴 플레이한 카드 수 × 1 추가 피해`,
    effect: (ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: (u ? 5 : 4) + ctx.playerCardsPlayedThisTurn },
    ],
  },
  {
    id: "ghost_reload",
    name: "재장전",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["ghost"],
    description: (_u) => `버린 더미에서 카드 1장 패로`,
    effect: (_ctx, _u) => [{ type: "draw_from_discard", amount: 1 }],
  },
  {
    id: "ghost_confuse",
    name: "혼란",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `적에게 잠금 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "lock", stacks: u ? 3 : 2 },
    ],
  },
  {
    id: "ghost_flank",
    name: "측면 공격",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["ghost"],
    description: (u) => `블록 2 + ${u ? 10 : 7} 피해`,
    effect: (_ctx, u) => [
      { type: "add_block", target: "player", amount: 2 },
      { type: "deal_damage", target: "enemy", amount: u ? 10 : 7 },
    ],
  },

  // ── Ghost 카드 풀 — Uncommon ────────────────────────────

  {
    id: "ghost_vital_strike",
    name: "급소 타격",
    cost: 1,
    type: "attack",
    rarity: "uncommon",
    classes: ["ghost"],
    description: (u) => `${u ? 11 : 8} 피해, 출혈 ${u ? 4 : 3} 부여`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 11 : 8 },
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 4 : 3 },
    ],
  },
  {
    id: "ghost_clone",
    name: "분신",
    cost: 2,
    type: "skill",
    rarity: "uncommon",
    classes: ["ghost"],
    description: (_u) => `패의 카드 1장 복사본 생성`,
    effect: (_ctx, _u) => [{ type: "draw_cards", amount: 1 }],
  },
  {
    id: "ghost_poison_mist",
    name: "독무",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    classes: ["ghost"],
    description: (u) => `출혈 ${u ? 7 : 5} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 7 : 5 },
    ],
  },
  {
    id: "ghost_shadow_step",
    name: "그림자 이동",
    cost: 1,
    type: "skill",
    rarity: "uncommon",
    classes: ["ghost"],
    description: (u) => `블록 ${u ? 10 : 7}, 다음 턴 카드 1장 추가 드로우`,
    effect: (_ctx, u) => [
      { type: "add_block", target: "player", amount: u ? 10 : 7 },
      { type: "draw_cards", amount: 1 },
    ],
  },
  {
    id: "ghost_chain_reaction",
    name: "연쇄 반응",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    classes: ["ghost"],
    description: (u) => `이번 턴 플레이한 공격 카드 수 × ${u ? 7 : 5} 피해`,
    effect: (ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: Math.max(1, ctx.playerCardsPlayedThisTurn) * (u ? 7 : 5) },
    ],
  },

  // ── Ghost 카드 풀 — Rare ────────────────────────────────

  {
    id: "ghost_execution",
    name: "처형",
    cost: 2,
    type: "attack",
    rarity: "rare",
    classes: ["ghost"],
    description: (u) => `${u ? 25 : 20} 피해, 출혈 상태 적에게 2배 적용`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 25 : 20 },
    ],
    // bleed 2배는 gameStore playCard에서 처리
  },
  {
    id: "ghost_assassin_mark",
    name: "암살자의 표식",
    cost: 1,
    type: "power",
    rarity: "rare",
    classes: ["ghost"],
    description: (_u) => `[파워] 턴 시작마다 카드 1장 드로우`,
    effect: (_ctx, _u) => [],
  },
  {
    id: "ghost_perfect_dodge",
    name: "무결 회피",
    cost: 2,
    type: "power",
    rarity: "rare",
    classes: ["ghost"],
    description: (_u) => `[파워] 매 턴 첫 피해 1회 회피`,
    effect: (_ctx, _u) => [],
  },

  // ── 공용 카드 (neutral) ─────────────────────────────────

  {
    id: "neutral_patch",
    name: "비상 패치",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["neutral"],
    description: (u) => `HP ${u ? 12 : 8} 회복`,
    effect: (_ctx, u) => [{ type: "heal", amount: u ? 12 : 8 }],
  },
  {
    id: "neutral_packet",
    name: "데이터 패킷",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["neutral"],
    description: (_u) => `카드 1장 드로우`,
    effect: (_ctx, _u) => [{ type: "draw_cards", amount: 1 }],
  },
  {
    id: "neutral_guard",
    name: "임시 방어",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["neutral"],
    description: (u) => `블록 ${u ? 9 : 6}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 9 : 6 }],
  },
  {
    id: "neutral_precise",
    name: "정밀 타격",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["neutral"],
    description: (u) => `${u ? 11 : 8} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 11 : 8 }],
  },
];

// ─── 룩업 맵 ────────────────────────────────────────────────

const cardMap = new Map<string, CardDefinition>(cardDefs.map((c) => [c.id, c]));

export function getCardDef(id: string): CardDefinition {
  const def = cardMap.get(id);
  if (!def) throw new Error(`Card definition not found: ${id}`);
  return def;
}

export function getAllCardDefs(): CardDefinition[] {
  return cardDefs;
}

// ── Ghost 시작 덱 구성 ──────────────────────────────────────

export function buildStarterDeck(playerClass: "ghost" | "tank" | "hacker"): import("../store/gameStore").CardInstance[] {
  const decks: Record<string, Array<{ id: string; count: number }>> = {
    ghost: [
      { id: "ghost_swift_strike", count: 3 },
      { id: "ghost_dodge", count: 3 },
      { id: "ghost_dual_blades", count: 2 },
      { id: "ghost_fade", count: 1 },
      { id: "ghost_rapid_combo", count: 1 },
    ],
    tank: [],
    hacker: [],
  };

  const entries = decks[playerClass] ?? [];
  return entries.flatMap(({ id, count }) =>
    Array.from({ length: count }, () => ({ id, upgraded: false }))
  );
}
