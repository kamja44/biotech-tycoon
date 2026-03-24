# NETRUNNER Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghost 클래스로 전투 한 판을 완전히 플레이할 수 있는 NETRUNNER Phase 1 구현 (타이틀 → 전투 → 보상 → 전투 반복 → 게임오버/승리)

**Architecture:** Zustand 스토어에 전체 게임 상태 집중, 카드/적 효과 함수는 `cards.ts`/`enemies.ts`에서 id로 런타임 룩업(직렬화 분리). 맵 없이 전투→보상→전투 선형 진행. 컴포넌트는 `src/games/netrunner/` 하위에 독립 배치.

**Tech Stack:** Next.js 16, React 19, Zustand 5, Tailwind CSS 4, TypeScript 5

---

## 파일 구조

```
src/
  app/
    games/
      netrunner/
        page.tsx                    ← "use client" 진입점, phase switcher
  games/
    netrunner/
      index.tsx                     ← phase에 따라 화면 전환
      components/
        TitleScreen.tsx             ← 클래스 선택 (Ghost만 활성)
        CombatScreen.tsx            ← 전투 메인 화면
        RewardScreen.tsx            ← 전투 후 카드 3장 선택
        GameOverScreen.tsx          ← 게임오버 화면
        ui/
          CardComponent.tsx         ← 카드 UI (클릭 선택/플레이)
          EnemyComponent.tsx        ← 적 HP바 + 의도 표시
          PlayerHUD.tsx             ← HP바 + 에너지 + 덱 상태
          StatusBadge.tsx           ← 상태이상 뱃지
      store/
        gameStore.ts                ← Zustand 전체 상태 + 액션
      data/
        cards.ts                    ← 카드 정의 (효과 함수 포함)
        enemies.ts                  ← 적/보스 정의 (AI 패턴 포함)
  data/
    gamesRegistry.ts                ← (수정) netrunner coming-soon 추가
```

---

## Task 1: 폴더 구조 생성 + gamesRegistry 등록

**Files:**
- Create: `src/app/games/netrunner/page.tsx`
- Create: `src/games/netrunner/index.tsx` (빈 플레이스홀더)
- Modify: `src/data/gamesRegistry.ts`

- [ ] **Step 1: 디렉터리 생성**

```bash
mkdir -p src/app/games/netrunner
mkdir -p src/games/netrunner/components/ui
mkdir -p src/games/netrunner/store
mkdir -p src/games/netrunner/data
```

- [ ] **Step 2: page.tsx 작성**

`src/app/games/netrunner/page.tsx`:
```tsx
"use client";
import NetrunnerGame from "@/games/netrunner";

export default function NetrunnerPage() {
  return <NetrunnerGame />;
}
```

- [ ] **Step 3: index.tsx 플레이스홀더 작성**

`src/games/netrunner/index.tsx`:
```tsx
export default function NetrunnerGame() {
  return <div className="text-white p-8">NETRUNNER — 로딩 중...</div>;
}
```

- [ ] **Step 4: gamesRegistry.ts에 netrunner 추가**

`src/data/gamesRegistry.ts`의 `games` 배열에 추가:
```ts
{
  slug: "netrunner",
  title: "NETRUNNER",
  description: "사이버펑크 세계의 카드 덱빌딩 로그라이크. 넷러너가 되어 메가코프를 무너뜨려라.",
  tags: ["카드", "로그라이크", "전략"],
  emoji: "🃏",
  status: "coming-soon",
  difficulty: "높음",
  players: "1인",
  genre: "카드 로그라이크",
}
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공, `/games/netrunner` 라우트 생성됨

- [ ] **Step 6: 커밋**

```bash
git add src/app/games/netrunner/page.tsx src/games/netrunner/index.tsx src/data/gamesRegistry.ts
git commit -m "feat(netrunner): scaffold folder structure and register game"
```

---

## Task 2: 타입 정의 + Zustand 스토어 뼈대

**Files:**
- Create: `src/games/netrunner/store/gameStore.ts`

- [ ] **Step 1: 모든 타입과 초기 상태가 포함된 스토어 작성**

`src/games/netrunner/store/gameStore.ts`:
```ts
import { create } from "zustand";

// ─── 타입 정의 ──────────────────────────────────────────────

export type PlayerClass = "ghost" | "tank" | "hacker";
export type GameMode = "story" | "endless";
export type GamePhase =
  | "title"
  | "combat"
  | "reward"
  | "gameover"
  | "victory";

export type CardType = "attack" | "skill" | "power";
export type CardRarity = "common" | "uncommon" | "rare";
export type StatusEffectId = "bleed" | "shock" | "lock" | "overload" | "dodge";

export interface StatusEffect {
  id: StatusEffectId;
  stacks: number;
}

export interface CardInstance {
  id: string;       // cards.ts 룩업 키 (예: "ghost_swift_strike")
  upgraded: boolean;
}

export interface RelicInstance {
  id: string;       // relics.ts 룩업 키
}

export type EnemyIntentType = "attack" | "defend" | "buff" | "debuff";

export interface EnemyIntent {
  type: EnemyIntentType;
  value?: number;   // 공격이면 피해량
}

export interface EnemyInstance {
  definitionId: string;   // enemies.ts 룩업 키
  hp: number;
  maxHp: number;
  block: number;
  statusEffects: StatusEffect[];
  intent: EnemyIntent;
  patternIndex: number;   // AI 패턴 순환 인덱스
  enraged: boolean;       // 분노 상태
}

export interface NetrunnerState {
  phase: GamePhase;
  mode: GameMode;
  player: {
    class: PlayerClass;
    hp: number;
    maxHp: number;
    gold: number;
    block: number;
    energy: number;
    maxEnergy: number;
    deck: CardInstance[];
    hand: CardInstance[];
    drawPile: CardInstance[];
    discardPile: CardInstance[];
    relics: RelicInstance[];
    statusEffects: StatusEffect[];
  };
  currentEnemy: EnemyInstance | null;
  run: {
    act: number;
    floor: number;
    score: number;
    enemiesDefeated: number;
  };
  pendingRewardCards: string[];   // 보상 화면에서 선택할 카드 id 3개
  selectedCardIndex: number | null;  // 패에서 선택된 카드 인덱스
  combatLog: string[];
}

// ─── 초기 상태 ──────────────────────────────────────────────

const INITIAL_STATE: Omit<NetrunnerState,
  | "startGame"
  | "playCard"
  | "endTurn"
  | "selectCard"
  | "selectRewardCard"
  | "skipReward"
  | "resetGame"
> = {
  phase: "title",
  mode: "story",
  player: {
    class: "ghost",
    hp: 75,
    maxHp: 75,
    gold: 99,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    deck: [],
    hand: [],
    drawPile: [],
    discardPile: [],
    relics: [],
    statusEffects: [],
  },
  currentEnemy: null,
  run: { act: 1, floor: 0, score: 0, enemiesDefeated: 0 },
  pendingRewardCards: [],
  selectedCardIndex: null,
  combatLog: [],
};

// ─── 헬퍼 함수 ──────────────────────────────────────────────

/** 배열을 Fisher-Yates 셔플 (불변) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 덱에서 n장 드로우 (drawPile → hand, 필요 시 discard → drawPile 재셔플) */
function drawCards(
  hand: CardInstance[],
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  n: number
): { hand: CardInstance[]; drawPile: CardInstance[]; discardPile: CardInstance[] } {
  let h = [...hand];
  let dp = [...drawPile];
  let dc = [...discardPile];

  for (let i = 0; i < n; i++) {
    if (dp.length === 0) {
      if (dc.length === 0) break;
      dp = shuffle(dc);
      dc = [];
    }
    h = [...h, dp[0]];
    dp = dp.slice(1);
  }
  return { hand: h, drawPile: dp, discardPile: dc };
}

/** 상태이상 적용 헬퍼 (stacks 누적) */
export function applyStatus(
  effects: StatusEffect[],
  id: StatusEffectId,
  stacks: number
): StatusEffect[] {
  const existing = effects.find((e) => e.id === id);
  if (existing) {
    return effects.map((e) => e.id === id ? { ...e, stacks: e.stacks + stacks } : e);
  }
  return [...effects, { id, stacks }];
}

/** 상태이상 tick (턴 종료 시 처리) — 반환값: { newEffects, damage }
 *
 * 처리 방식:
 * - bleed: 스택만큼 피해 후 스택 -1 (0이 되면 제거)
 * - shock: 스택 -1 (적용은 블록 불가 체크에서 이미 처리됨)
 * - lock: 스택 -1 (적용은 카드 사용 불가 체크에서 이미 처리됨)
 * - overload: 스택 -1 (적용은 attack 피해 추가에서 이미 처리됨)
 * - dodge: tick 없음 (endTurn 적 공격 처리 시 소비됨)
 */
export function tickStatusEffects(
  effects: StatusEffect[]
): { newEffects: StatusEffect[]; damage: number } {
  let damage = 0;
  const newEffects: StatusEffect[] = [];

  for (const e of effects) {
    if (e.id === "bleed") {
      damage += e.stacks;
      const remaining = e.stacks - 1;
      if (remaining > 0) newEffects.push({ id: "bleed", stacks: remaining });
      // remaining === 0: 제거됨
    } else if (e.id === "dodge") {
      // dodge는 endTurn 공격 처리에서 소비 — 여기서 건드리지 않음
      newEffects.push(e);
    } else {
      // shock, lock, overload: 스택 -1
      const remaining = e.stacks - 1;
      if (remaining > 0) newEffects.push({ ...e, stacks: remaining });
      // remaining === 0: 제거됨
    }
  }

  return { newEffects, damage };
}

// ─── 스토어 인터페이스 ──────────────────────────────────────

interface NetrunnerStore extends NetrunnerState {
  startGame: (playerClass: PlayerClass, mode: GameMode) => void;
  selectCard: (index: number | null) => void;
  playCard: (index: number) => void;
  endTurn: () => void;
  selectRewardCard: (cardId: string) => void;
  skipReward: () => void;
  resetGame: () => void;
}

// ─── 스토어 생성 (액션은 Task 5에서 구현) ──────────────────

export const useNetrunnerStore = create<NetrunnerStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: (_playerClass, _mode) => {
    // Task 3, 5에서 구현
  },
  selectCard: (index) => set({ selectedCardIndex: index }),
  playCard: (_index) => {
    // Task 5에서 구현
  },
  endTurn: () => {
    // Task 5에서 구현
  },
  selectRewardCard: (_cardId) => {
    // Task 5에서 구현
  },
  skipReward: () => {
    // Task 5에서 구현
  },
  resetGame: () => set({ ...INITIAL_STATE }),
}));
```

- [ ] **Step 2: TypeScript 타입 오류 없는지 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/games/netrunner/store/gameStore.ts
git commit -m "feat(netrunner): add zustand store types and skeleton"
```

---

## Task 3: 카드 데이터 (Ghost 시작 덱 + 풀)

**Files:**
- Create: `src/games/netrunner/data/cards.ts`

> 카드 효과 함수는 `CombatState`를 받아 `CombatAction[]`을 반환한다.
> 상태에 함수를 저장하지 않으므로 localStorage 직렬화 문제 없음.

- [ ] **Step 1: cards.ts 작성**

`src/games/netrunner/data/cards.ts`:
```ts
import type { StatusEffectId } from "../store/gameStore";

// ─── 타입 ──────────────────────────────────────────────────

export type CombatAction =
  | { type: "deal_damage"; target: "player" | "enemy"; amount: number }
  | { type: "add_block"; target: "player" | "enemy"; amount: number }
  | { type: "apply_status"; target: "player" | "enemy"; status: StatusEffectId; stacks: number }
  | { type: "draw_cards"; amount: number }
  | { type: "draw_from_discard"; amount: number }   // 버린 더미에서 드로우
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
    // dodge status: endTurn에서 적 공격 처리 전 dodge 스택을 확인해 피해를 0으로 만든 후 스택 -1
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
    // 실제 복사 로직은 스토어에서 별도 처리
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
    effect: (ctx, u) => {
      const hasBleed = ctx.enemyHp < ctx.enemyMaxHp; // 단순화: 스토어에서 실제 bleed 확인
      const base = u ? 25 : 20;
      return [{ type: "deal_damage", target: "enemy", amount: base }];
      // 실제 bleed 2배는 스토어 playCard 로직에서 처리
    },
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
    // 파워 효과는 스토어 턴 시작 로직에서 적용
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
    tank: [],   // Phase 2
    hacker: [], // Phase 2
  };

  const entries = decks[playerClass] ?? [];
  return entries.flatMap(({ id, count }) =>
    Array.from({ length: count }, () => ({ id, upgraded: false }))
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/games/netrunner/data/cards.ts
git commit -m "feat(netrunner): add Ghost card definitions"
```

---

## Task 4: 적 & 보스 데이터

**Files:**
- Create: `src/games/netrunner/data/enemies.ts`

- [ ] **Step 1: enemies.ts 작성**

`src/games/netrunner/data/enemies.ts`:
```ts
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
  // 특수 조건 (optional)
  enrageHpPercent?: number;    // 이 HP% 이하 시 분노
  enrageAttackBonus?: number;  // 분노 시 공격 +N
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
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/games/netrunner/data/enemies.ts
git commit -m "feat(netrunner): add enemy and boss definitions"
```

---

## Task 5: 전투 로직 구현 (스토어 액션)

**Files:**
- Modify: `src/games/netrunner/store/gameStore.ts`

이 태스크에서 `startGame`, `playCard`, `endTurn`, `selectRewardCard`, `skipReward`를 완전 구현한다.

- [ ] **Step 1: gameStore.ts의 액션들을 구현으로 교체**

`startGame` 구현:
```ts
startGame: (playerClass, mode) => {
  const { buildStarterDeck } = require("../data/cards");
  const { createEnemyInstance, getEnemyIdForFloor } = require("../data/enemies");

  const classStat: Record<PlayerClass, { hp: number }> = {
    ghost: { hp: 75 },
    tank: { hp: 100 },
    hacker: { hp: 70 },
  };

  const starterDeck = buildStarterDeck(playerClass);
  const shuffledDeck = shuffle(starterDeck);
  const floor = 1;
  const enemyId = getEnemyIdForFloor(floor);
  const enemy = createEnemyInstance(enemyId);

  const hp = classStat[playerClass].hp;
  const drawn = drawCards([], shuffledDeck, [], 5);

  set({
    phase: "combat",
    mode,
    player: {
      class: playerClass,
      hp,
      maxHp: hp,
      gold: 99,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      deck: starterDeck,
      hand: drawn.hand,
      drawPile: drawn.drawPile,
      discardPile: [],
      relics: [],
      statusEffects: [],
    },
    currentEnemy: enemy,
    run: { act: 1, floor, score: 0, enemiesDefeated: 0 },
    pendingRewardCards: [],
    selectedCardIndex: null,
    combatLog: [`⚔️ ${enemy.definitionId === "ice_warden" ? "보스" : "전투"} 시작!`],
  });
},
```

`playCard` 구현:
```ts
playCard: (index) => {
  const state = get();
  if (state.phase !== "combat") return;
  const { player, currentEnemy } = state;
  if (!currentEnemy) return;

  const card = player.hand[index];
  if (!card) return;

  const { getCardDef } = require("../data/cards");
  const def = getCardDef(card.id);

  // 에너지 체크
  if (player.energy < def.cost) return;

  // 잠금(lock) 상태: 패의 첫 번째 카드 사용 불가
  const lockEffect = player.statusEffects.find((e) => e.id === "lock");
  if (lockEffect && index === 0) return; // 첫 번째 슬롯 잠금

  // 감전(shock) 상태: 블록 카드 사용 불가 (add_block 액션이 있는 카드)
  const hasShock = player.statusEffects.some((e) => e.id === "shock");
  const cardActions = def.effect({ playerHp: 0, playerMaxHp: 0, playerBlock: 0, playerEnergy: 0, playerHandSize: 0, playerCardsPlayedThisTurn: 0, enemyHp: 0, enemyMaxHp: 0, enemyBlock: 0 }, false);
  const hasBlockAction = cardActions.some((a) => a.type === "add_block" && (a as { target: string }).target === "player");
  if (hasShock && hasBlockAction) return;

  const ctx = {
    playerHp: player.hp,
    playerMaxHp: player.maxHp,
    playerBlock: player.block,
    playerEnergy: player.energy,
    playerHandSize: player.hand.length,
    playerCardsPlayedThisTurn: state.combatLog.filter((l) => l.startsWith("▶")).length,
    enemyHp: currentEnemy.hp,
    enemyMaxHp: currentEnemy.maxHp,
    enemyBlock: currentEnemy.block,
  };

  const actions = def.effect(ctx, card.upgraded);
  let newPlayer = { ...player, energy: player.energy - def.cost };
  let newEnemy = { ...currentEnemy };
  const newLog = [...state.combatLog, `▶ ${def.name} 사용`];

  // 액션 실행
  for (const action of actions) {
    if (action.type === "deal_damage") {
      if (action.target === "enemy") {
        // bleed 처형 2배 처리
        let dmg = action.amount;
        if (card.id === "ghost_execution" && newEnemy.statusEffects.some((e) => e.id === "bleed")) {
          dmg *= 2;
        }
        const absorbed = Math.min(newEnemy.block, dmg);
        newEnemy = {
          ...newEnemy,
          block: newEnemy.block - absorbed,
          hp: newEnemy.hp - (dmg - absorbed),
        };
        newLog.push(`💥 적에게 ${dmg - absorbed} 피해 (블록 ${absorbed} 흡수)`);
      } else {
        const absorbed = Math.min(newPlayer.block, action.amount);
        newPlayer = {
          ...newPlayer,
          block: newPlayer.block - absorbed,
          hp: newPlayer.hp - (action.amount - absorbed),
        };
      }
    } else if (action.type === "add_block") {
      if (action.target === "player") {
        newPlayer = { ...newPlayer, block: newPlayer.block + action.amount };
        newLog.push(`🛡️ 블록 +${action.amount}`);
      } else {
        newEnemy = { ...newEnemy, block: newEnemy.block + action.amount };
      }
    } else if (action.type === "apply_status") {
      const { applyStatus } = require("../store/gameStore");
      if (action.target === "enemy") {
        newEnemy = { ...newEnemy, statusEffects: applyStatus(newEnemy.statusEffects, action.status, action.stacks) };
        newLog.push(`⚠️ 적에게 ${action.status} ${action.stacks} 부여`);
      } else {
        newPlayer = { ...newPlayer, statusEffects: applyStatus(newPlayer.statusEffects, action.status, action.stacks) };
      }
    } else if (action.type === "draw_cards") {
      const drawn = drawCards(newPlayer.hand, newPlayer.drawPile, newPlayer.discardPile, action.amount);
      newPlayer = { ...newPlayer, hand: drawn.hand, drawPile: drawn.drawPile, discardPile: drawn.discardPile };
    } else if (action.type === "draw_from_discard") {
      // 버린 더미에서 랜덤 1장 패로
      if (newPlayer.discardPile.length > 0) {
        const idx = Math.floor(Math.random() * newPlayer.discardPile.length);
        const picked = newPlayer.discardPile[idx];
        newPlayer = {
          ...newPlayer,
          hand: [...newPlayer.hand, picked],
          discardPile: newPlayer.discardPile.filter((_, i) => i !== idx),
        };
      }
    } else if (action.type === "gain_energy") {
      newPlayer = { ...newPlayer, energy: newPlayer.energy + action.amount };
    } else if (action.type === "heal") {
      newPlayer = { ...newPlayer, hp: Math.min(newPlayer.maxHp, newPlayer.hp + action.amount) };
      newLog.push(`💊 HP +${action.amount}`);
    }
  }

  // 카드를 패에서 버린 더미로 이동 (파워는 소멸 처리)
  const newHand = newPlayer.hand.filter((_, i) => i !== index);
  const newDiscard = def.type === "power" ? newPlayer.discardPile : [...newPlayer.discardPile, card];
  newPlayer = { ...newPlayer, hand: newHand, discardPile: newDiscard };

  // 적 HP 0 이하 → 전투 승리
  if (newEnemy.hp <= 0) {
    const { getEnemyDef } = require("../data/enemies");
    const enemyDef = getEnemyDef(newEnemy.definitionId);
    const gold = enemyDef.goldMin + Math.floor(Math.random() * (enemyDef.goldMax - enemyDef.goldMin + 1));

    // 보상 카드 3장 선택
    const { getAllCardDefs } = require("../data/cards");
    const pool = getAllCardDefs().filter((c) =>
      c.classes.includes(newPlayer.class) || c.classes.includes("neutral")
    );
    const shuffledPool = shuffle(pool).slice(0, 3).map((c) => c.id);

    const newFloor = state.run.floor + 1;
    const isVictory = newFloor > 3; // Phase 1: 보스 처치 시 승리

    set({
      phase: isVictory ? "victory" : "reward",
      player: { ...newPlayer, gold: newPlayer.gold + gold, block: 0 },
      currentEnemy: newEnemy,
      run: { ...state.run, floor: newFloor, enemiesDefeated: state.run.enemiesDefeated + 1 },
      pendingRewardCards: shuffledPool,
      selectedCardIndex: null,
      combatLog: [...newLog, `🏆 ${enemyDef.name} 처치! 골드 +${gold}`],
    });
    return;
  }

  set({
    player: newPlayer,
    currentEnemy: newEnemy,
    selectedCardIndex: null,
    combatLog: newLog,
  });
},
```

`endTurn` 구현:
```ts
endTurn: () => {
  const state = get();
  if (state.phase !== "combat") return;
  const { player, currentEnemy } = state;
  if (!currentEnemy) return;

  const { getEnemyDef } = require("../data/enemies");
  const { applyStatus, tickStatusEffects } = require("../store/gameStore");
  const enemyDef = getEnemyDef(currentEnemy.definitionId);

  let newPlayer = { ...player };
  let newEnemy = { ...currentEnemy };
  const newLog = [...state.combatLog, "--- 턴 종료 ---"];

  // 1. 플레이어 상태이상 tick (출혈 피해)
  const playerTick = tickStatusEffects(newPlayer.statusEffects);
  newPlayer = {
    ...newPlayer,
    hp: newPlayer.hp - playerTick.damage,
    statusEffects: playerTick.newEffects,
  };
  if (playerTick.damage > 0) newLog.push(`🔴 출혈로 ${playerTick.damage} 피해`);

  // 2. 플레이어 블록 초기화
  newPlayer = { ...newPlayer, block: 0 };

  // 3. 적 행동 실행
  const pattern = enemyDef.patterns[newEnemy.patternIndex % enemyDef.patterns.length];
  for (const action of pattern.actions) {
    if (action.type === "attack") {
      const bonus = newEnemy.enraged ? (enemyDef.enrageAttackBonus ?? 0) : 0;
      // overload: 플레이어에게 overload 있으면 적 공격에 추가 피해
      const overloadEffect = newPlayer.statusEffects.find((e) => e.id === "overload");
      const overloadBonus = overloadEffect ? overloadEffect.stacks * 3 : 0;
      const totalDmg = action.amount + bonus + overloadBonus;

      // overload 소비 (적용 후 제거)
      if (overloadEffect) {
        newPlayer = {
          ...newPlayer,
          statusEffects: newPlayer.statusEffects.filter((e) => e.id !== "overload"),
        };
        newLog.push(`💀 과부하 발동! 추가 ${overloadBonus} 피해`);
      }

      // dodge: 이번 공격 1회 회피
      const dodgeEffect = newPlayer.statusEffects.find((e) => e.id === "dodge");
      if (dodgeEffect) {
        const newDodgeStacks = dodgeEffect.stacks - 1;
        newPlayer = {
          ...newPlayer,
          statusEffects: newPlayer.statusEffects
            .filter((e) => e.id !== "dodge")
            .concat(newDodgeStacks > 0 ? [{ id: "dodge" as const, stacks: newDodgeStacks }] : []),
        };
        newLog.push(`✨ 회피 성공! (남은 dodge: ${newDodgeStacks})`);
        continue; // 피해 적용 스킵
      }

      const absorbed = Math.min(newPlayer.block, totalDmg);
      newPlayer = {
        ...newPlayer,
        block: newPlayer.block - absorbed,
        hp: newPlayer.hp - (totalDmg - absorbed),
      };
      newLog.push(`👊 적의 공격: ${totalDmg} 피해`);
    } else if (action.type === "defend") {
      newEnemy = { ...newEnemy, block: newEnemy.block + action.amount };
      newLog.push(`🛡️ 적 블록 +${action.amount}`);
    } else if (action.type === "apply_status") {
      newPlayer = {
        ...newPlayer,
        statusEffects: applyStatus(newPlayer.statusEffects, action.status, action.stacks),
      };
      newLog.push(`⚡ 적이 ${action.status} ${action.stacks} 부여`);
    }
  }

  // 4. 적 상태이상 tick
  const enemyTick = tickStatusEffects(newEnemy.statusEffects);
  newEnemy = {
    ...newEnemy,
    hp: newEnemy.hp - enemyTick.damage,
    statusEffects: enemyTick.newEffects,
  };
  if (enemyTick.damage > 0) newLog.push(`🔴 적 출혈: ${enemyTick.damage} 피해`);

  // 5. 적 블록 초기화
  newEnemy = { ...newEnemy, block: 0 };

  // 6. 패턴 인덱스 증가
  const nextPatternIndex = (newEnemy.patternIndex + 1) % enemyDef.patterns.length;
  const nextIntent = enemyDef.patterns[nextPatternIndex].intent;

  // 7. 분노 체크
  const enrageThreshold = enemyDef.enrageHpPercent ?? 0;
  const shouldEnrage = !newEnemy.enraged && enrageThreshold > 0
    && newEnemy.hp / newEnemy.maxHp <= enrageThreshold;
  if (shouldEnrage) {
    newLog.push(`🔥 ${enemyDef.name} 분노!`);
  }

  newEnemy = {
    ...newEnemy,
    patternIndex: nextPatternIndex,
    intent: nextIntent,
    enraged: newEnemy.enraged || shouldEnrage,
  };

  // 8. 플레이어 HP 0 이하 → 게임오버
  if (newPlayer.hp <= 0) {
    set({
      phase: "gameover",
      player: { ...newPlayer, hp: 0 },
      currentEnemy: newEnemy,
      combatLog: [...newLog, "💀 사망..."],
    });
    return;
  }

  // 9. 적 HP 0 이하 (상태이상 틱 등으로) → 보상
  if (newEnemy.hp <= 0) {
    const gold = enemyDef.goldMin + Math.floor(Math.random() * (enemyDef.goldMax - enemyDef.goldMin + 1));
    const { getAllCardDefs } = require("../data/cards");
    const pool = getAllCardDefs().filter((c) =>
      c.classes.includes(newPlayer.class) || c.classes.includes("neutral")
    );
    const rewardCards = shuffle(pool).slice(0, 3).map((c) => c.id);
    const newFloor = state.run.floor + 1;
    const isVictory = newFloor > 3;

    set({
      phase: isVictory ? "victory" : "reward",
      player: { ...newPlayer, gold: newPlayer.gold + gold, block: 0 },
      currentEnemy: newEnemy,
      run: { ...state.run, floor: newFloor, enemiesDefeated: state.run.enemiesDefeated + 1 },
      pendingRewardCards: rewardCards,
      selectedCardIndex: null,
      combatLog: [...newLog, `🏆 처치! 골드 +${gold}`],
    });
    return;
  }

  // 10. 다음 턴 시작 — 패 전부 버리고 5장 드로우, 에너지 충전
  const allDiscard = [...newPlayer.discardPile, ...newPlayer.hand];
  const drawn = drawCards([], newPlayer.drawPile, allDiscard, 5);

  // 암살자의 표식 파워: 추가 1장 드로우
  const hasMarkPower = newPlayer.deck.some((c) => c.id === "ghost_assassin_mark");
  const finalDrawn = hasMarkPower
    ? drawCards(drawn.hand, drawn.drawPile, drawn.discardPile, 1)
    : drawn;

  set({
    player: {
      ...newPlayer,
      energy: newPlayer.maxEnergy,
      hand: finalDrawn.hand,
      drawPile: finalDrawn.drawPile,
      discardPile: finalDrawn.discardPile,
    },
    currentEnemy: newEnemy,
    selectedCardIndex: null,
    combatLog: [...newLog, "--- 새 턴 ---"],
  });
},
```

`selectRewardCard` + `skipReward` 구현:
```ts
selectRewardCard: (cardId) => {
  const state = get();
  if (state.phase !== "reward") return;
  const { createEnemyInstance, getEnemyIdForFloor } = require("../data/enemies");

  const newCard = { id: cardId, upgraded: false };
  const newDeck = [...state.player.deck, newCard];
  const shuffledDeck = shuffle(newDeck);

  const nextFloor = state.run.floor;
  const enemyId = getEnemyIdForFloor(nextFloor);
  const newEnemy = createEnemyInstance(enemyId);
  const drawn = drawCards([], shuffledDeck, [], 5);

  set({
    phase: "combat",
    player: {
      ...state.player,
      deck: newDeck,
      hand: drawn.hand,
      drawPile: drawn.drawPile,
      discardPile: [],
      block: 0,
      energy: state.player.maxEnergy,
    },
    currentEnemy: newEnemy,
    pendingRewardCards: [],
    selectedCardIndex: null,
    combatLog: [`⚔️ 층 ${nextFloor} — ${newEnemy.definitionId} 등장!`],
  });
},

skipReward: () => {
  const state = get();
  if (state.phase !== "reward") return;
  const { createEnemyInstance, getEnemyIdForFloor } = require("../data/enemies");

  const shuffledDeck = shuffle(state.player.deck);
  const nextFloor = state.run.floor;
  const enemyId = getEnemyIdForFloor(nextFloor);
  const newEnemy = createEnemyInstance(enemyId);
  const drawn = drawCards([], shuffledDeck, [], 5);

  set({
    phase: "combat",
    player: {
      ...state.player,
      hand: drawn.hand,
      drawPile: drawn.drawPile,
      discardPile: [],
      block: 0,
      energy: state.player.maxEnergy,
    },
    currentEnemy: newEnemy,
    pendingRewardCards: [],
    selectedCardIndex: null,
    combatLog: [`⚔️ 층 ${nextFloor} — ${newEnemy.definitionId} 등장!`],
  });
},
```

> **주의:** `require()` 대신 파일 상단에 import를 추가해야 한다. 순환 참조 방지를 위해 `cards.ts`와 `enemies.ts`는 `gameStore.ts`를 import하지 않는다. `gameStore.ts`만 이들을 import한다.

- [ ] **Step 2: import 문으로 정리**

gameStore.ts 상단에 추가:
```ts
import { buildStarterDeck, getAllCardDefs, getCardDef } from "../data/cards";
import { createEnemyInstance, getEnemyDef, getEnemyIdForFloor } from "../data/enemies";
```
그리고 액션 내 `require()` 호출을 모두 직접 import로 교체.

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/games/netrunner/store/gameStore.ts
git commit -m "feat(netrunner): implement combat logic (playCard, endTurn, rewards)"
```

---

## Task 6: UI 원자 컴포넌트

**Files:**
- Create: `src/games/netrunner/components/ui/StatusBadge.tsx`
- Create: `src/games/netrunner/components/ui/PlayerHUD.tsx`
- Create: `src/games/netrunner/components/ui/EnemyComponent.tsx`
- Create: `src/games/netrunner/components/ui/CardComponent.tsx`

- [ ] **Step 1: StatusBadge.tsx**

```tsx
// src/games/netrunner/components/ui/StatusBadge.tsx
import type { StatusEffect } from "../../store/gameStore";

const STATUS_META: Record<string, { emoji: string; label: string; color: string }> = {
  bleed: { emoji: "🔴", label: "출혈", color: "bg-red-900/60 text-red-300" },
  shock: { emoji: "⚡", label: "감전", color: "bg-yellow-900/60 text-yellow-300" },
  lock: { emoji: "🔒", label: "잠금", color: "bg-gray-700/60 text-gray-300" },
  overload: { emoji: "💀", label: "과부하", color: "bg-purple-900/60 text-purple-300" },
  dodge: { emoji: "✨", label: "회피", color: "bg-cyan-900/60 text-cyan-300" },
};

interface Props {
  effects: StatusEffect[];
}

export default function StatusBadge({ effects }: Props) {
  if (effects.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {effects.map((e) => {
        const meta = STATUS_META[e.id];
        return (
          <span key={e.id} className={`text-xs px-1.5 py-0.5 rounded font-mono ${meta.color}`}>
            {meta.emoji} {meta.label} {e.stacks}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: PlayerHUD.tsx**

```tsx
// src/games/netrunner/components/ui/PlayerHUD.tsx
import StatusBadge from "./StatusBadge";
import type { NetrunnerState } from "../../store/gameStore";

interface Props {
  player: NetrunnerState["player"];
}

export default function PlayerHUD({ player }: Props) {
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
  const hpColor = hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 space-y-3 min-w-[220px]">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🗡️</span>
        <div>
          <p className="text-white font-bold text-sm">GHOST</p>
          <p className="text-gray-400 text-xs">넷러너</p>
        </div>
      </div>

      {/* HP 바 */}
      <div>
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>HP</span>
          <span>{player.hp} / {player.maxHp}</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${hpColor} transition-all duration-300`} style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      {/* 블록 */}
      {player.block > 0 && (
        <div className="flex items-center gap-1 text-sm text-blue-300">
          <span>🛡️</span> <span>블록 {player.block}</span>
        </div>
      )}

      {/* 에너지 */}
      <div className="flex items-center gap-1">
        {Array.from({ length: player.maxEnergy }).map((_, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
              ${i < player.energy ? "bg-cyan-500 border-cyan-300 text-white" : "bg-gray-700 border-gray-600 text-gray-500"}`}
          >
            ⚡
          </div>
        ))}
        <span className="text-gray-400 text-xs ml-1">{player.energy}/{player.maxEnergy}</span>
      </div>

      {/* 덱 상태 */}
      <div className="flex gap-3 text-xs text-gray-400">
        <span>🃏 드로우 {player.drawPile.length}</span>
        <span>🗑️ 버림 {player.discardPile.length}</span>
      </div>

      {/* 상태이상 */}
      <StatusBadge effects={player.statusEffects} />
    </div>
  );
}
```

- [ ] **Step 3: EnemyComponent.tsx**

```tsx
// src/games/netrunner/components/ui/EnemyComponent.tsx
import { getEnemyDef } from "../../data/enemies";
import StatusBadge from "./StatusBadge";
import type { EnemyInstance } from "../../store/gameStore";

interface Props {
  enemy: EnemyInstance;
}

const INTENT_META: Record<string, { emoji: string; label: string; color: string }> = {
  attack: { emoji: "⚔️", label: "공격", color: "text-red-400" },
  defend: { emoji: "🛡️", label: "방어", color: "text-blue-400" },
  buff: { emoji: "💪", label: "버프", color: "text-yellow-400" },
  debuff: { emoji: "☠️", label: "디버프", color: "text-purple-400" },
};

export default function EnemyComponent({ enemy }: Props) {
  const def = getEnemyDef(enemy.definitionId);
  const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const intent = INTENT_META[enemy.intent.type];

  return (
    <div className={`flex flex-col items-center gap-3 ${enemy.enraged ? "animate-pulse" : ""}`}>
      {/* 의도 표시 */}
      <div className={`flex items-center gap-1 text-sm font-semibold ${intent.color} bg-gray-900/60 px-3 py-1 rounded-full`}>
        <span>{intent.emoji}</span>
        <span>
          {enemy.intent.type === "attack" && enemy.intent.value != null
            ? `${enemy.intent.value + (enemy.enraged ? (def.enrageAttackBonus ?? 0) : 0)} 피해 예고`
            : intent.label}
        </span>
      </div>

      {/* 적 이모지 */}
      <div className="text-8xl select-none">
        {def.emoji}
        {enemy.enraged && <span className="text-3xl">🔥</span>}
      </div>

      {/* 이름 + 블록 */}
      <div className="text-center">
        <p className="text-white font-bold">{def.name}</p>
        {enemy.block > 0 && (
          <p className="text-blue-300 text-sm">🛡️ 블록 {enemy.block}</p>
        )}
      </div>

      {/* HP 바 */}
      <div className="w-48">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>HP</span>
          <span>{Math.max(0, enemy.hp)} / {enemy.maxHp}</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      {/* 상태이상 */}
      <StatusBadge effects={enemy.statusEffects} />
    </div>
  );
}
```

- [ ] **Step 4: CardComponent.tsx**

```tsx
// src/games/netrunner/components/ui/CardComponent.tsx
import { getCardDef } from "../../data/cards";
import type { CardInstance } from "../../store/gameStore";

interface Props {
  card: CardInstance;
  index: number;
  isSelected: boolean;
  isPlayable: boolean;
  onClick: (index: number) => void;
}

const RARITY_STYLE: Record<string, string> = {
  common: "border-gray-500 bg-gray-800/90",
  uncommon: "border-blue-500 bg-blue-950/90",
  rare: "border-purple-500 bg-purple-950/90",
};

const TYPE_EMOJI: Record<string, string> = {
  attack: "⚔️",
  skill: "🔧",
  power: "✨",
};

export default function CardComponent({ card, index, isSelected, isPlayable, onClick }: Props) {
  const def = getCardDef(card.id);
  const rarityStyle = RARITY_STYLE[def.rarity];

  return (
    <button
      onClick={() => onClick(index)}
      className={`
        relative w-28 h-40 rounded-xl border-2 p-2 text-left
        flex flex-col gap-1 transition-all duration-200 cursor-pointer
        ${rarityStyle}
        ${isSelected ? "-translate-y-8 ring-2 ring-white shadow-lg shadow-white/20" : "hover:-translate-y-3"}
        ${!isPlayable ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {/* 코스트 */}
      <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-cyan-600 border-2 border-cyan-300
        flex items-center justify-center text-white font-bold text-sm shadow-md">
        {def.cost}
      </div>

      {/* 타입 */}
      <div className="text-right text-xs">{TYPE_EMOJI[def.type]}</div>

      {/* 이름 */}
      <p className="text-white font-bold text-xs leading-tight mt-1">{def.name}</p>
      {card.upgraded && <span className="text-yellow-400 text-xs">★</span>}

      {/* 구분선 */}
      <div className="border-t border-gray-600 my-1" />

      {/* 설명 */}
      <p className="text-gray-300 text-xs leading-tight flex-1">
        {def.description(card.upgraded)}
      </p>

      {/* 등급 */}
      <p className="text-xs text-gray-500 capitalize">{def.rarity}</p>
    </button>
  );
}
```

- [ ] **Step 5: TypeScript 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 커밋**

```bash
git add src/games/netrunner/components/ui/
git commit -m "feat(netrunner): add UI atom components (HUD, cards, enemy)"
```

---

## Task 7: TitleScreen 컴포넌트

**Files:**
- Create: `src/games/netrunner/components/TitleScreen.tsx`

- [ ] **Step 1: TitleScreen.tsx 작성**

```tsx
// src/games/netrunner/components/TitleScreen.tsx
import { useState } from "react";
import type { PlayerClass, GameMode } from "../store/gameStore";

interface Props {
  onStart: (playerClass: PlayerClass, mode: GameMode) => void;
}

const CLASS_INFO = [
  {
    id: "ghost" as PlayerClass,
    name: "Ghost",
    emoji: "🗡️",
    hp: 75,
    style: "공격형",
    desc: "빠른 단타 콤보. 저코스트 카드로 폭딜.",
    active: true,
  },
  {
    id: "tank" as PlayerClass,
    name: "Tank",
    emoji: "🛡️",
    hp: 100,
    style: "방어형",
    desc: "방어막 쌓고 반격. 높은 생존력.",
    active: false,
  },
  {
    id: "hacker" as PlayerClass,
    name: "Hacker",
    emoji: "⚡",
    hp: 70,
    style: "디버프형",
    desc: "상태이상과 카드 조작으로 제압.",
    active: false,
  },
];

export default function TitleScreen({ onStart }: Props) {
  const [selectedClass, setSelectedClass] = useState<PlayerClass>("ghost");
  const [selectedMode, setSelectedMode] = useState<GameMode>("story");

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* 타이틀 */}
      <div className="text-center mb-10">
        <h1 className="text-6xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
          NETRUNNER
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-wider">
          CYBERPUNK 2087 — CARD ROGUELIKE
        </p>
      </div>

      {/* 모드 선택 */}
      <div className="flex gap-4 mb-8">
        {(["story", "endless"] as GameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`px-6 py-2 rounded-lg border font-semibold text-sm transition-all
              ${selectedMode === mode
                ? "bg-cyan-600 border-cyan-400 text-white"
                : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400"}`}
          >
            {mode === "story" ? "📖 스토리" : "♾️ 엔드리스"}
          </button>
        ))}
      </div>

      {/* 클래스 선택 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {CLASS_INFO.map((cls) => (
          <button
            key={cls.id}
            onClick={() => cls.active && setSelectedClass(cls.id)}
            disabled={!cls.active}
            className={`
              relative w-44 rounded-2xl border-2 p-5 text-left transition-all
              ${!cls.active ? "opacity-40 cursor-not-allowed border-gray-700 bg-gray-900/50" :
                selectedClass === cls.id
                  ? "border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20 scale-105"
                  : "border-gray-600 bg-gray-900/60 hover:border-gray-400"}
            `}
          >
            {!cls.active && (
              <span className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                준비 중
              </span>
            )}
            <div className="text-4xl mb-2">{cls.emoji}</div>
            <p className="font-black text-lg">{cls.name}</p>
            <p className="text-cyan-400 text-xs mb-1">{cls.style}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{cls.desc}</p>
            <p className="text-gray-500 text-xs mt-2">HP {cls.hp}</p>
          </button>
        ))}
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={() => onStart(selectedClass, selectedMode)}
        className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl
          rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30
          tracking-wider"
      >
        RUN 시작
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/netrunner/components/TitleScreen.tsx
git commit -m "feat(netrunner): add TitleScreen with class selection"
```

---

## Task 8: CombatScreen 컴포넌트

**Files:**
- Create: `src/games/netrunner/components/CombatScreen.tsx`

- [ ] **Step 1: CombatScreen.tsx 작성**

```tsx
// src/games/netrunner/components/CombatScreen.tsx
import { useNetrunnerStore } from "../store/gameStore";
import { getCardDef } from "../data/cards";
import PlayerHUD from "./ui/PlayerHUD";
import EnemyComponent from "./ui/EnemyComponent";
import CardComponent from "./ui/CardComponent";

export default function CombatScreen() {
  const player = useNetrunnerStore((s) => s.player);
  const enemy = useNetrunnerStore((s) => s.currentEnemy);
  const selectedCardIndex = useNetrunnerStore((s) => s.selectedCardIndex);
  const run = useNetrunnerStore((s) => s.run);
  const combatLog = useNetrunnerStore((s) => s.combatLog);
  const selectCard = useNetrunnerStore((s) => s.selectCard);
  const playCard = useNetrunnerStore((s) => s.playCard);
  const endTurn = useNetrunnerStore((s) => s.endTurn);

  if (!enemy) return null;

  const handleCardClick = (index: number) => {
    if (selectedCardIndex === index) {
      // 이미 선택된 카드 → 플레이
      playCard(index);
    } else {
      // 새 카드 선택
      selectCard(index);
    }
  };

  const isCardPlayable = (index: number) => {
    const card = player.hand[index];
    if (!card) return false;
    const def = getCardDef(card.id);
    return player.energy >= def.cost;
  };

  const lastLog = combatLog[combatLog.length - 1] ?? "";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
        <div className="text-cyan-400 font-mono text-sm">
          ACT {run.act} — 층 {run.floor} / 3
        </div>
        <div className="text-gray-400 text-sm font-mono">💰 {player.gold}G</div>
      </div>

      {/* 전투 영역 */}
      <div className="flex flex-1 items-center justify-between px-10 py-6 gap-6">
        {/* 플레이어 HUD */}
        <PlayerHUD player={player} />

        {/* 중앙 — 적 + 로그 */}
        <div className="flex flex-col items-center gap-4 flex-1">
          {enemy && <EnemyComponent enemy={enemy} />}
          {/* 최근 로그 */}
          <div className="mt-4 text-gray-400 text-sm bg-gray-900/60 rounded-lg px-4 py-2 max-w-xs text-center truncate">
            {lastLog}
          </div>
        </div>

        {/* 선택된 카드 플레이 버튼 */}
        <div className="w-44 flex flex-col items-center gap-3">
          {selectedCardIndex !== null && (
            <button
              onClick={() => playCard(selectedCardIndex)}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
            >
              ▶ 카드 사용
            </button>
          )}
          <button
            onClick={endTurn}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm transition-all"
          >
            턴 종료 →
          </button>
        </div>
      </div>

      {/* 패 영역 */}
      <div className="flex justify-center items-end gap-2 pb-6 px-4 pt-2 bg-gray-900/40 border-t border-gray-800 min-h-[160px]">
        {player.hand.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            index={index}
            isSelected={selectedCardIndex === index}
            isPlayable={isCardPlayable(index)}
            onClick={handleCardClick}
          />
        ))}
        {player.hand.length === 0 && (
          <p className="text-gray-600 text-sm">패가 없습니다. 턴 종료 시 드로우됩니다.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/netrunner/components/CombatScreen.tsx
git commit -m "feat(netrunner): add CombatScreen"
```

---

## Task 9: RewardScreen + GameOverScreen + VictoryScreen

**Files:**
- Create: `src/games/netrunner/components/RewardScreen.tsx`
- Create: `src/games/netrunner/components/GameOverScreen.tsx`
- Create: `src/games/netrunner/components/VictoryScreen.tsx`

- [ ] **Step 1: RewardScreen.tsx**

```tsx
// src/games/netrunner/components/RewardScreen.tsx
import { useNetrunnerStore } from "../store/gameStore";
import { getCardDef } from "../data/cards";
import CardComponent from "./ui/CardComponent";

export default function RewardScreen() {
  const pendingRewardCards = useNetrunnerStore((s) => s.pendingRewardCards);
  const run = useNetrunnerStore((s) => s.run);
  const selectRewardCard = useNetrunnerStore((s) => s.selectRewardCard);
  const skipReward = useNetrunnerStore((s) => s.skipReward);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 text-white p-6">
      <div className="text-center">
        <h2 className="text-3xl font-black text-yellow-400">전투 승리!</h2>
        <p className="text-gray-400 mt-1">카드 1장을 선택하세요 (층 {run.floor - 1} 클리어)</p>
      </div>

      <div className="flex gap-6">
        {pendingRewardCards.map((cardId) => {
          const def = getCardDef(cardId);
          const card = { id: cardId, upgraded: false };
          return (
            <div key={cardId} className="flex flex-col items-center gap-2">
              <CardComponent
                card={card}
                index={0}
                isSelected={false}
                isPlayable={true}
                onClick={() => selectRewardCard(cardId)}
              />
              <button
                onClick={() => selectRewardCard(cardId)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                선택
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={skipReward}
        className="text-gray-500 hover:text-gray-300 text-sm underline"
      >
        카드 없이 계속
      </button>
    </div>
  );
}
```

- [ ] **Step 2: GameOverScreen.tsx**

```tsx
// src/games/netrunner/components/GameOverScreen.tsx
import { useNetrunnerStore } from "../store/gameStore";

export default function GameOverScreen() {
  const run = useNetrunnerStore((s) => s.run);
  const resetGame = useNetrunnerStore((s) => s.resetGame);
  const combatLog = useNetrunnerStore((s) => s.combatLog);
  const lastLog = combatLog[combatLog.length - 1] ?? "";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-8xl animate-pulse">💀</div>
      <h2 className="text-4xl font-black text-red-400">JACK OUT</h2>
      <p className="text-gray-400">넷러너는 추적당했습니다.</p>
      <div className="bg-gray-900 rounded-xl px-6 py-4 text-center space-y-1">
        <p className="text-gray-300 text-sm">층 {run.floor} / 처치 {run.enemiesDefeated}마리</p>
        <p className="text-gray-500 text-xs">{lastLog}</p>
      </div>
      <button
        onClick={resetGame}
        className="px-8 py-3 bg-red-800 hover:bg-red-700 rounded-xl font-bold transition-all"
      >
        다시 시도
      </button>
    </div>
  );
}
```

- [ ] **Step 3: VictoryScreen.tsx**

```tsx
// src/games/netrunner/components/VictoryScreen.tsx
import { useNetrunnerStore } from "../store/gameStore";

export default function VictoryScreen() {
  const run = useNetrunnerStore((s) => s.run);
  const resetGame = useNetrunnerStore((s) => s.resetGame);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-8xl">🏆</div>
      <h2 className="text-4xl font-black text-cyan-400">MEGACORP 무너뜨림</h2>
      <p className="text-gray-300">당신은 메가코프를 해킹했습니다!</p>
      <div className="bg-gray-900 rounded-xl px-6 py-4 text-center">
        <p className="text-yellow-400 font-bold">Act {run.act} 클리어</p>
        <p className="text-gray-400 text-sm mt-1">처치 {run.enemiesDefeated}마리 · 점수 {run.score}</p>
      </div>
      <button
        onClick={resetGame}
        className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-xl font-bold transition-all"
      >
        다시 플레이
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/games/netrunner/components/RewardScreen.tsx src/games/netrunner/components/GameOverScreen.tsx src/games/netrunner/components/VictoryScreen.tsx
git commit -m "feat(netrunner): add RewardScreen, GameOverScreen, VictoryScreen"
```

---

## Task 10: index.tsx 완성 (Phase Switcher)

**Files:**
- Modify: `src/games/netrunner/index.tsx`

- [ ] **Step 1: index.tsx를 완전한 phase switcher로 교체**

```tsx
// src/games/netrunner/index.tsx
"use client";
import { useNetrunnerStore } from "./store/gameStore";
import TitleScreen from "./components/TitleScreen";
import CombatScreen from "./components/CombatScreen";
import RewardScreen from "./components/RewardScreen";
import GameOverScreen from "./components/GameOverScreen";
import VictoryScreen from "./components/VictoryScreen";

export default function NetrunnerGame() {
  const phase = useNetrunnerStore((s) => s.phase);
  const startGame = useNetrunnerStore((s) => s.startGame);

  return (
    <>
      {phase === "title" && <TitleScreen onStart={startGame} />}
      {phase === "combat" && <CombatScreen />}
      {phase === "reward" && <RewardScreen />}
      {phase === "gameover" && <GameOverScreen />}
      {phase === "victory" && <VictoryScreen />}
    </>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공

- [ ] **Step 3: 개발 서버 실행 후 수동 테스트**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/games/netrunner` 접속 후 확인:
- [ ] 타이틀 화면 표시됨
- [ ] Ghost 선택 후 "RUN 시작" 클릭 → 전투 화면 전환
- [ ] 적 HP바 + 의도 표시됨
- [ ] 카드 클릭 시 위로 올라옴 (선택)
- [ ] 두 번 클릭 또는 "카드 사용" 버튼 → 카드 효과 적용
- [ ] 에너지 소모 확인
- [ ] "턴 종료" 클릭 → 적 행동, 다음 턴 드로우
- [ ] 적 HP 0 → 보상 화면
- [ ] 카드 선택 → 다음 전투 시작
- [ ] 플레이어 HP 0 → 게임오버 화면
- [ ] 보스(3층) 처치 → 승리 화면
- [ ] `/` 로비 → GameCard에 NETRUNNER "준비 중" 뱃지 표시

- [ ] **Step 4: 최종 커밋**

```bash
git add src/games/netrunner/index.tsx
git commit -m "feat(netrunner): complete Phase 1 - playable combat loop"
```

---

## 완료 기준 (Phase 1 Definition of Done)

- [ ] Ghost 클래스로 타이틀 → 전투 → 보상 → 전투 반복 완전 플레이 가능
- [ ] 3층 클리어 시 승리 화면 표시
- [ ] HP 0 시 게임오버 화면 표시
- [ ] 4가지 상태이상 (출혈/감전/잠금/과부하) 처리됨
- [ ] 적 행동 의도 미리 표시
- [ ] gamesRegistry에 NETRUNNER "준비 중"으로 등록됨
- [ ] `npm run build` 성공
