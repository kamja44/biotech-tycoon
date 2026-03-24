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

  // ── Tank 시작 덱 ────────────────────────────────────────

  {
    id: "tank_steel_defense",
    name: "강철 방어",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 12 : 8}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 12 : 8 }],
  },
  {
    id: "tank_iron_fist",
    name: "철권",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `${u ? 10 : 7} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 10 : 7 }],
  },
  {
    id: "tank_counter",
    name: "반격",
    cost: 2,
    type: "attack",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 7 : 5} + 현재 블록 피해`,
    effect: (ctx, u) => [
      { type: "add_block", target: "player", amount: u ? 7 : 5 },
      { type: "deal_damage", target: "enemy", amount: ctx.playerBlock },
    ],
  },
  {
    id: "tank_defensive_stance",
    name: "수비 자세",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 5 : 3}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 5 : 3 }],
  },
  {
    id: "tank_iron_wall",
    name: "철벽",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => u ? "[업그레이드] 이번 턴 블록 턴 종료 시 소멸 안 함 (코스트 0)" : "이번 턴 블록 턴 종료 시 소멸 안 함",
    effect: (_ctx, _u) => [],
  },

  // ── Tank 카드 풀 — Common ───────────────────────────────

  {
    id: "tank_slam",
    name: "강타",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `${u ? 13 : 9} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 13 : 9 }],
  },
  {
    id: "tank_fortify",
    name: "요새화",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 18 : 12}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 18 : 12 }],
  },
  {
    id: "tank_taunt",
    name: "도발",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `적에게 충격 ${u ? 2 : 1} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "shock", stacks: u ? 2 : 1 },
    ],
  },
  {
    id: "tank_shield_boost",
    name: "방패 강화",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 11 : 8}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 11 : 8 }],
  },
  {
    id: "tank_body_slam",
    name: "몸통 박치기",
    cost: 2,
    type: "attack",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `${u ? 15 : 12} 피해 + 블록 ${u ? 6 : 4}`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 15 : 12 },
      { type: "add_block", target: "player", amount: u ? 6 : 4 },
    ],
  },
  {
    id: "tank_endure",
    name: "인내",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 9 : 6} + 카드 1장 드로우`,
    effect: (_ctx, u) => [
      { type: "add_block", target: "player", amount: u ? 9 : 6 },
      { type: "draw_cards", amount: 1 },
    ],
  },
  {
    id: "tank_iron_will",
    name: "철의 의지",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["tank"],
    description: (u) => `회피 ${u ? 2 : 1} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "player", status: "dodge", stacks: u ? 2 : 1 },
    ],
  },

  // ── Tank 카드 풀 — Uncommon ─────────────────────────────

  {
    id: "tank_thorn_armor",
    name: "가시 갑옷",
    cost: 1,
    type: "power",
    rarity: "uncommon",
    classes: ["tank"],
    description: (_u) => `[파워] 피격 시 반사 피해`,
    effect: (_ctx, _u) => [],
  },
  {
    id: "tank_iron_barrier",
    name: "쇠벽",
    cost: 2,
    type: "skill",
    rarity: "uncommon",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 26 : 18}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 26 : 18 }],
  },
  {
    id: "tank_reversal",
    name: "역전의 일격",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    classes: ["tank"],
    description: (u) => `현재 블록 × ${u ? 3 : 2} 피해`,
    effect: (ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: ctx.playerBlock * (u ? 3 : 2) },
    ],
  },
  {
    id: "tank_fierce_counter",
    name: "맹반격",
    cost: 1,
    type: "attack",
    rarity: "uncommon",
    classes: ["tank"],
    description: (u) => `블록 ${u ? 7 : 5} + 출혈 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "add_block", target: "player", amount: u ? 7 : 5 },
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 3 : 2 },
    ],
  },
  {
    id: "tank_steel_skin",
    name: "강철 피부",
    cost: 2,
    type: "power",
    rarity: "uncommon",
    classes: ["tank"],
    description: (_u) => `[파워] 매 턴 시작 시 블록 획득`,
    effect: (_ctx, _u) => [],
  },

  // ── Tank 카드 풀 — Rare ─────────────────────────────────

  {
    id: "tank_invincible_fortress",
    name: "무적 요새",
    cost: 3,
    type: "power",
    rarity: "rare",
    classes: ["tank"],
    description: (_u) => `[파워] 블록이 존재하는 한 받는 피해 50% 감소`,
    effect: (_ctx, _u) => [],
  },
  {
    id: "tank_rage_fist",
    name: "분노의 철권",
    cost: 2,
    type: "attack",
    rarity: "rare",
    classes: ["tank"],
    description: (u) => `(최대 HP - 현재 HP) 피해 (최대 ${u ? 45 : 30})`,
    effect: (ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: Math.min(u ? 45 : 30, ctx.playerMaxHp - ctx.playerHp) },
    ],
  },
  {
    id: "tank_absolute_defense",
    name: "절대 방어",
    cost: 3,
    type: "power",
    rarity: "rare",
    classes: ["tank"],
    description: (_u) => `[파워] 매 턴 시작 시 대량의 블록 획득`,
    effect: (_ctx, _u) => [],
  },

  // ── Hacker 시작 덱 ──────────────────────────────────────

  {
    id: "hacker_virus",
    name: "바이러스 주입",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `적에게 출혈 ${u ? 5 : 3} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 5 : 3 },
    ],
  },
  {
    id: "hacker_packet_scan",
    name: "패킷 스캔",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `카드 ${u ? 3 : 2}장 드로우`,
    effect: (_ctx, u) => [{ type: "draw_cards", amount: u ? 3 : 2 }],
  },
  {
    id: "hacker_shock_induction",
    name: "감전 유도",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `적에게 충격 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "shock", stacks: u ? 3 : 2 },
    ],
  },
  {
    id: "hacker_system_hack",
    name: "시스템 해킹",
    cost: 2,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => u ? "[업그레이드] 적의 다음 행동 무효화 (코스트 1)" : "적의 다음 행동 무효화",
    effect: (_ctx, _u) => [{ type: "negate_next_intent" }],
  },
  {
    id: "hacker_data_analysis",
    name: "데이터 분석",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `카드 ${u ? 4 : 3}장 드로우`,
    effect: (_ctx, u) => [{ type: "draw_cards", amount: u ? 4 : 3 }],
  },

  // ── Hacker 카드 풀 — Common ─────────────────────────────

  {
    id: "hacker_rootkit",
    name: "루트킷",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `적에게 잠금 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "lock", stacks: u ? 3 : 2 },
    ],
  },
  {
    id: "hacker_data_bomb",
    name: "데이터 폭탄",
    cost: 1,
    type: "attack",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `${u ? 11 : 8} 피해 + 출혈 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: u ? 11 : 8 },
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 3 : 2 },
    ],
  },
  {
    id: "hacker_firewall",
    name: "방화벽",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `블록 ${u ? 8 : 5}`,
    effect: (_ctx, u) => [{ type: "add_block", target: "player", amount: u ? 8 : 5 }],
  },
  {
    id: "hacker_overclock",
    name: "오버클럭",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `에너지 ${u ? 3 : 2} 획득`,
    effect: (_ctx, u) => [{ type: "gain_energy", amount: u ? 3 : 2 }],
  },
  {
    id: "hacker_debug",
    name: "디버그",
    cost: 0,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `카드 ${u ? 2 : 1}장 드로우`,
    effect: (_ctx, u) => [{ type: "draw_cards", amount: u ? 2 : 1 }],
  },
  {
    id: "hacker_recursive_code",
    name: "재귀 코드",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `버린 더미에서 카드 ${u ? 2 : 1}장 패로`,
    effect: (_ctx, u) => [{ type: "draw_from_discard", amount: u ? 2 : 1 }],
  },
  {
    id: "hacker_system_overload",
    name: "시스템 과부하",
    cost: 1,
    type: "skill",
    rarity: "common",
    classes: ["hacker"],
    description: (u) => `적에게 과부하 ${u ? 3 : 2} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "overload", stacks: u ? 3 : 2 },
    ],
  },

  // ── Hacker 카드 풀 — Uncommon ───────────────────────────

  {
    id: "hacker_malware",
    name: "악성 코드",
    cost: 2,
    type: "skill",
    rarity: "uncommon",
    classes: ["hacker"],
    description: (u) => `출혈 ${u ? 5 : 3} + 잠금 ${u ? 3 : 2} + 충격 ${u ? 2 : 1} 부여`,
    effect: (_ctx, u) => [
      { type: "apply_status", target: "enemy", status: "bleed", stacks: u ? 5 : 3 },
      { type: "apply_status", target: "enemy", status: "lock", stacks: u ? 3 : 2 },
      { type: "apply_status", target: "enemy", status: "shock", stacks: u ? 2 : 1 },
    ],
  },
  {
    id: "hacker_fork_bomb",
    name: "포크 밤",
    cost: 1,
    type: "attack",
    rarity: "uncommon",
    classes: ["hacker"],
    description: (u) => `${u ? 14 : 10} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 14 : 10 }],
  },
  {
    id: "hacker_loop",
    name: "루프",
    cost: 2,
    type: "power",
    rarity: "uncommon",
    classes: ["hacker"],
    description: (_u) => `[파워] 턴마다 카드 드로우 증가`,
    effect: (_ctx, _u) => [],
  },
  {
    id: "hacker_zero_day",
    name: "제로데이",
    cost: 2,
    type: "attack",
    rarity: "uncommon",
    classes: ["hacker"],
    description: (u) => `적 현재 HP의 ${u ? 25 : 20}% 피해`,
    effect: (ctx, u) => [
      { type: "deal_damage", target: "enemy", amount: Math.floor(ctx.enemyHp * (u ? 0.25 : 0.2)) },
    ],
  },
  {
    id: "hacker_botnet",
    name: "봇넷",
    cost: 1,
    type: "power",
    rarity: "uncommon",
    classes: ["hacker"],
    description: (_u) => `[파워] 턴마다 적에게 상태이상 부여`,
    effect: (_ctx, _u) => [],
  },

  // ── Hacker 카드 풀 — Rare ───────────────────────────────

  {
    id: "hacker_master_hacker",
    name: "마스터 해커",
    cost: 3,
    type: "power",
    rarity: "rare",
    classes: ["hacker"],
    description: (_u) => `[파워] 상태이상 효과 2배`,
    effect: (_ctx, _u) => [],
  },
  {
    id: "hacker_system_collapse",
    name: "시스템 붕괴",
    cost: 3,
    type: "attack",
    rarity: "rare",
    classes: ["hacker"],
    description: (u) => `${u ? 45 : 30} 피해`,
    effect: (_ctx, u) => [{ type: "deal_damage", target: "enemy", amount: u ? 45 : 30 }],
  },
  {
    id: "hacker_rewind",
    name: "리와인드",
    cost: 2,
    type: "skill",
    rarity: "rare",
    classes: ["hacker"],
    description: (u) => `카드 ${u ? 4 : 3}장 드로우`,
    effect: (_ctx, u) => [{ type: "draw_cards", amount: u ? 4 : 3 }],
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
    tank: [
      { id: "tank_steel_defense", count: 3 },
      { id: "tank_iron_fist", count: 3 },
      { id: "tank_counter", count: 2 },
      { id: "tank_defensive_stance", count: 1 },
      { id: "tank_iron_wall", count: 1 },
    ],
    hacker: [
      { id: "hacker_virus", count: 3 },
      { id: "hacker_packet_scan", count: 3 },
      { id: "hacker_shock_induction", count: 2 },
      { id: "hacker_system_hack", count: 1 },
      { id: "hacker_data_analysis", count: 1 },
    ],
  };

  const entries = decks[playerClass] ?? [];
  return entries.flatMap(({ id, count }) =>
    Array.from({ length: count }, () => ({ id, upgraded: false }))
  );
}
