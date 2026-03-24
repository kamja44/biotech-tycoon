export type RelicTrigger =
  | "on_combat_start"      // 전투 시작 시
  | "on_turn_start"        // 플레이어 턴 시작 시
  | "on_card_play"         // 카드 사용 시
  | "on_take_damage"       // 피해를 받을 때
  | "on_enemy_defeated"    // 적 처치 시
  | "passive";             // 항상 적용

export type RelicEffect =
  | { type: "gain_energy"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "add_block"; amount: number }
  | { type: "gain_gold"; amount: number }
  | { type: "draw_cards"; amount: number }
  | { type: "reduce_damage"; percent: number }   // 받는 피해 % 감소
  | { type: "bonus_attack"; amount: number }      // 공격 카드 추가 피해
  | { type: "start_bleed"; stacks: number }       // 전투 시작 시 적에게 출혈
  | { type: "max_hp_bonus"; amount: number };     // 최대 HP 증가 (passive)

export interface RelicDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "boss";
  trigger: RelicTrigger;
  effect: RelicEffect;
}

export const RELIC_DEFS: RelicDefinition[] = [
  // Common
  { id: "coffee_can", name: "커피 캔", emoji: "☕", description: "전투 시작 시 에너지 +1", rarity: "common", trigger: "on_combat_start", effect: { type: "gain_energy", amount: 1 } },
  { id: "lucky_chip", name: "행운의 칩", emoji: "🎰", description: "적 처치 시 골드 +5", rarity: "common", trigger: "on_enemy_defeated", effect: { type: "gain_gold", amount: 5 } },
  { id: "medkit", name: "응급 키트", emoji: "💉", description: "전투 시작 시 HP 3 회복", rarity: "common", trigger: "on_combat_start", effect: { type: "heal", amount: 3 } },
  { id: "shield_chip", name: "방어 칩", emoji: "🔋", description: "전투 시작 시 블록 4", rarity: "common", trigger: "on_combat_start", effect: { type: "add_block", amount: 4 } },
  { id: "data_chip", name: "데이터 칩", emoji: "💾", description: "전투 시작 시 카드 1장 추가 드로우", rarity: "common", trigger: "on_combat_start", effect: { type: "draw_cards", amount: 1 } },

  // Uncommon
  { id: "cyberarm", name: "사이버 팔", emoji: "🦾", description: "공격 카드 +2 피해", rarity: "uncommon", trigger: "passive", effect: { type: "bonus_attack", amount: 2 } },
  { id: "neural_booster", name: "신경 부스터", emoji: "🧠", description: "턴 시작 시 블록 2", rarity: "uncommon", trigger: "on_turn_start", effect: { type: "add_block", amount: 2 } },
  { id: "pain_chip", name: "고통 칩", emoji: "😈", description: "피해받을 때 피해량 -2 (최소 1)", rarity: "uncommon", trigger: "on_take_damage", effect: { type: "reduce_damage", percent: 0 } },
  { id: "virus_vial", name: "바이러스 바이알", emoji: "🧪", description: "전투 시작 시 적에게 출혈 3", rarity: "uncommon", trigger: "on_combat_start", effect: { type: "start_bleed", stacks: 3 } },
  { id: "energy_core", name: "에너지 코어", emoji: "⚡", description: "최대 HP +20", rarity: "uncommon", trigger: "passive", effect: { type: "max_hp_bonus", amount: 20 } },

  // Rare
  { id: "megacorp_badge", name: "메가코프 배지", emoji: "🏷️", description: "전투 시작 시 에너지 +2", rarity: "rare", trigger: "on_combat_start", effect: { type: "gain_energy", amount: 2 } },
  { id: "black_market_gun", name: "암시장 총", emoji: "🔫", description: "공격 카드 +5 피해", rarity: "rare", trigger: "passive", effect: { type: "bonus_attack", amount: 5 } },
  { id: "immortality_chip", name: "불사 칩", emoji: "♾️", description: "전투 시작 시 HP 8 회복", rarity: "rare", trigger: "on_combat_start", effect: { type: "heal", amount: 8 } },

  // Boss
  { id: "ice_core", name: "ICE 코어", emoji: "🧊", description: "전투 시작 시 블록 10 + 에너지 +1", rarity: "boss", trigger: "on_combat_start", effect: { type: "gain_energy", amount: 1 } },
  { id: "nexus_crystal", name: "넥서스 크리스탈", emoji: "🔮", description: "공격 카드 +8 피해", rarity: "boss", trigger: "passive", effect: { type: "bonus_attack", amount: 8 } },
];

const relicMap = new Map(RELIC_DEFS.map((r) => [r.id, r]));

export function getRelicDef(id: string): RelicDefinition | undefined {
  return relicMap.get(id);
}

export function getRandomRelic(rarity: "common" | "uncommon" | "rare" | "boss"): RelicDefinition {
  const pool = RELIC_DEFS.filter((r) => r.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
