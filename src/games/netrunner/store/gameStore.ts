import { create } from "zustand";
import { buildStarterDeck, getAllCardDefs, getCardDef } from "../data/cards";
import { createEnemyInstance, getEnemyDef, getEnemyIdForFloor, getEliteEnemyId, getBossIdForAct } from "../data/enemies";
import { generateActMap } from "../data/map";
import type { ActMap } from "../data/map";

// ─── 타입 정의 ──────────────────────────────────────────────

export type PlayerClass = "ghost" | "tank" | "hacker";
export type GameMode = "story" | "endless";
export type GamePhase =
  | "title"
  | "map"
  | "combat"
  | "event"
  | "shop"
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
  id: string;
  upgraded: boolean;
}

export interface RelicInstance {
  id: string;
}

export type EnemyIntentType = "attack" | "defend" | "buff" | "debuff";

export interface EnemyIntent {
  type: EnemyIntentType;
  value?: number;
}

export interface EnemyInstance {
  definitionId: string;
  hp: number;
  maxHp: number;
  block: number;
  statusEffects: StatusEffect[];
  intent: EnemyIntent;
  patternIndex: number;
  enraged: boolean;
}

export interface NetrunnerState {
  phase: GamePhase;
  mode: GameMode;
  currentMap: ActMap | null;
  currentNodeId: string | null;
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
  pendingRewardCards: string[];
  selectedCardIndex: number | null;
  combatLog: string[];
}

// ─── 초기 플레이어 상태 ──────────────────────────────────────

const INITIAL_PLAYER: NetrunnerState["player"] = {
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
};

const INITIAL_RUN: NetrunnerState["run"] = {
  act: 1,
  floor: 0,
  score: 0,
  enemiesDefeated: 0,
};

// ─── 헬퍼 함수 ──────────────────────────────────────────────

/** Fisher-Yates 셔플 (불변) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** drawPile → hand (필요 시 discard → drawPile 재셔플) */
export function drawCards(
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

/** 상태이상 스택 누적 */
export function applyStatus(
  effects: StatusEffect[],
  id: StatusEffectId,
  stacks: number
): StatusEffect[] {
  const existing = effects.find((e) => e.id === id);
  if (existing) {
    return effects.map((e) =>
      e.id === id ? { ...e, stacks: e.stacks + stacks } : e
    );
  }
  return [...effects, { id, stacks }];
}

/**
 * 상태이상 tick (턴 종료 시 처리)
 * - bleed: 스택만큼 피해 후 스택 -1 (0이면 제거)
 * - shock/lock/overload: 스택 -1 (0이면 제거)
 * - dodge: tick 없음 (endTurn 공격 처리 시 소비)
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
    } else if (e.id === "dodge") {
      newEffects.push(e);
    } else {
      const remaining = e.stacks - 1;
      if (remaining > 0) newEffects.push({ ...e, stacks: remaining });
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
  enterMap: () => void;
  selectNode: (nodeId: string) => void;
}

// ─── 스토어 ────────────────────────────────────────────────

export const useNetrunnerStore = create<NetrunnerStore>((set, get) => ({
  phase: "title",
  mode: "story",
  player: INITIAL_PLAYER,
  currentEnemy: null,
  currentMap: null,
  currentNodeId: null,
  run: INITIAL_RUN,
  pendingRewardCards: [],
  selectedCardIndex: null,
  combatLog: [],

  startGame: (playerClass, mode) => {
    const classStat: Record<PlayerClass, { hp: number }> = {
      ghost: { hp: 75 },
      tank: { hp: 100 },
      hacker: { hp: 70 },
    };

    const hp = classStat[playerClass].hp;
    const starterDeck = buildStarterDeck(playerClass);
    const shuffledDeck = shuffle(starterDeck);
    const floor = 1;
    const enemyId = getEnemyIdForFloor(floor);
    const enemy = createEnemyInstance(enemyId);
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

  selectCard: (index) => set({ selectedCardIndex: index }),

  playCard: (index) => {
    const state = get();
    if (state.phase !== "combat") return;
    const { player, currentEnemy } = state;
    if (!currentEnemy) return;

    const card = player.hand[index];
    if (!card) return;

    const def = getCardDef(card.id);

    // 에너지 체크
    if (player.energy < def.cost) return;

    // 잠금(lock) 상태: 패의 첫 번째 카드 사용 불가
    const lockEffect = player.statusEffects.find((e) => e.id === "lock");
    if (lockEffect && index === 0) return;

    // 감전(shock) 상태: 블록 액션이 있는 카드 사용 불가
    const hasShock = player.statusEffects.some((e) => e.id === "shock");
    if (hasShock) {
      const previewActions = def.effect(
        { playerHp: 0, playerMaxHp: 0, playerBlock: 0, playerEnergy: 0, playerHandSize: 0, playerCardsPlayedThisTurn: 0, enemyHp: 0, enemyMaxHp: 0, enemyBlock: 0 },
        card.upgraded
      );
      const hasBlockAction = previewActions.some(
        (a) => a.type === "add_block" && (a as { target: string }).target === "player"
      );
      if (hasBlockAction) return;
    }

    const cardsPlayedThisTurn = state.combatLog.filter((l) => l.startsWith("▶")).length;

    const ctx = {
      playerHp: player.hp,
      playerMaxHp: player.maxHp,
      playerBlock: player.block,
      playerEnergy: player.energy,
      playerHandSize: player.hand.length,
      playerCardsPlayedThisTurn: cardsPlayedThisTurn,
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
          let dmg = action.amount;
          // 처형: 출혈 상태 적에게 2배
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

    // 카드를 패에서 버린 더미로 이동 (파워는 소멸)
    const newHand = newPlayer.hand.filter((_, i) => i !== index);
    const newDiscard = def.type === "power" ? newPlayer.discardPile : [...newPlayer.discardPile, card];
    newPlayer = { ...newPlayer, hand: newHand, discardPile: newDiscard };

    // 적 HP 0 이하 → 전투 승리
    if (newEnemy.hp <= 0) {
      const enemyDef = getEnemyDef(newEnemy.definitionId);
      const gold = enemyDef.goldMin + Math.floor(Math.random() * (enemyDef.goldMax - enemyDef.goldMin + 1));

      const pool = getAllCardDefs().filter((c) =>
        c.classes.includes(newPlayer.class) || c.classes.includes("neutral")
      );
      const shuffledPool = shuffle(pool).slice(0, 3).map((c) => c.id);

      const newFloor = state.run.floor + 1;
      const isVictory = newFloor > 3;

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

  endTurn: () => {
    const state = get();
    if (state.phase !== "combat") return;
    const { player, currentEnemy } = state;
    if (!currentEnemy) return;

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
        const overloadEffect = newPlayer.statusEffects.find((e) => e.id === "overload");
        const overloadBonus = overloadEffect ? overloadEffect.stacks * 3 : 0;
        const totalDmg = action.amount + bonus + overloadBonus;

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
          continue;
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
    const shouldEnrage =
      !newEnemy.enraged &&
      enrageThreshold > 0 &&
      newEnemy.hp / newEnemy.maxHp <= enrageThreshold;
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

  selectRewardCard: (cardId) => {
    const state = get();
    if (state.phase !== "reward") return;

    const newCard = { id: cardId, upgraded: false };
    const newDeck = [...state.player.deck, newCard];
    const map = generateActMap();

    set({
      phase: "map",
      player: {
        ...state.player,
        deck: newDeck,
      },
      currentMap: map,
      currentNodeId: null,
      pendingRewardCards: [],
      selectedCardIndex: null,
    });
  },

  skipReward: () => {
    const state = get();
    if (state.phase !== "reward") return;

    const map = generateActMap();

    set({
      phase: "map",
      currentMap: map,
      currentNodeId: null,
      pendingRewardCards: [],
      selectedCardIndex: null,
    });
  },

  resetGame: () =>
    set({
      phase: "title",
      mode: "story",
      player: INITIAL_PLAYER,
      currentEnemy: null,
      currentMap: null,
      currentNodeId: null,
      run: INITIAL_RUN,
      pendingRewardCards: [],
      selectedCardIndex: null,
      combatLog: [],
    }),

  enterMap: () => {
    const map = generateActMap();
    set({ phase: "map", currentMap: map, currentNodeId: null });
  },

  selectNode: (nodeId: string) => {
    const state = get();
    if (!state.currentMap) return;

    const node = state.currentMap.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Mark visited
    const updatedMap: ActMap = {
      ...state.currentMap,
      nodes: state.currentMap.nodes.map((n) =>
        n.id === nodeId ? { ...n, visited: true } : n
      ),
    };

    if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
      let enemyId: string;
      if (node.type === "boss") enemyId = getBossIdForAct(state.run.act);
      else if (node.type === "elite") enemyId = getEliteEnemyId();
      else enemyId = getEnemyIdForFloor(state.run.floor);

      const enemy = createEnemyInstance(enemyId);

      const shuffledDeck = shuffle(state.player.deck);
      const drawn = drawCards([], shuffledDeck, [], 5);

      set({
        phase: "combat",
        currentMap: updatedMap,
        currentNodeId: nodeId,
        currentEnemy: enemy,
        player: {
          ...state.player,
          hand: drawn.hand,
          drawPile: drawn.drawPile,
          discardPile: [],
          block: 0,
          energy: state.player.maxEnergy,
        },
        selectedCardIndex: null,
        combatLog: [`⚔️ ${node.type === "boss" ? "보스" : node.type === "elite" ? "엘리트" : "전투"} 시작!`],
      });
    } else if (node.type === "event") {
      set({ phase: "event", currentMap: updatedMap, currentNodeId: nodeId });
    } else if (node.type === "shop") {
      set({ phase: "shop", currentMap: updatedMap, currentNodeId: nodeId });
    }
  },
}));
