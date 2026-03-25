import type { UpgradeDef } from "../types/roguelike";

export const UPGRADE_POOL: UpgradeDef[] = [
  // === Common: Global buffs ===
  {
    id: "dmg_all_1",
    name: "오버클럭 프로토콜",
    description: "모든 포탑 공격력 +15%",
    category: "global_buff",
    rarity: "common",
    effect: { type: "all_damage_mult", value: 1.15 },
    emoji: "⚡",
  },
  {
    id: "range_all_1",
    name: "레이더 확장",
    description: "모든 포탑 사거리 +10%",
    category: "global_buff",
    rarity: "common",
    effect: { type: "all_range_mult", value: 1.10 },
    emoji: "📡",
  },
  {
    id: "firerate_all_1",
    name: "가속 모듈",
    description: "모든 포탑 공격속도 +10%",
    category: "global_buff",
    rarity: "common",
    effect: { type: "all_firerate_mult", value: 1.10 },
    emoji: "🔧",
  },
  {
    id: "cost_reduction_1",
    name: "암시장 설계도",
    description: "모든 포탑 건설 비용 -15%",
    category: "economy",
    rarity: "common",
    effect: { type: "tower_cost_reduction", value: 0.85 },
    emoji: "💸",
  },
  {
    id: "passive_income_1",
    name: "크레딧 생성기",
    description: "웨이브 시작마다 크레딧 +20 지급",
    category: "economy",
    rarity: "common",
    effect: { type: "passive_income", creditsPerWave: 20 },
    emoji: "💰",
  },
  {
    id: "credits_now_1",
    name: "긴급 보급",
    description: "즉시 크레딧 +80 획득",
    category: "economy",
    rarity: "common",
    effect: { type: "credits_bonus", value: 80 },
    emoji: "📦",
  },
  {
    id: "lives_restore_1",
    name: "긴급 수리",
    description: "즉시 생명력 +3 회복",
    category: "economy",
    rarity: "common",
    effect: { type: "lives_restore", value: 3 },
    emoji: "🔋",
  },
  {
    id: "slow_global_1",
    name: "중력 변조",
    description: "모든 적 이동속도 영구 -5%",
    category: "global_buff",
    rarity: "common",
    effect: { type: "enemy_slow_global", factor: 0.05 },
    emoji: "🌀",
  },

  // === Uncommon: Stronger global buffs ===
  {
    id: "dmg_all_2",
    name: "양자 강화",
    description: "모든 포탑 공격력 +25%",
    category: "global_buff",
    rarity: "uncommon",
    effect: { type: "all_damage_mult", value: 1.25 },
    emoji: "⚡",
  },
  {
    id: "firerate_all_2",
    name: "나노 윤활제",
    description: "모든 포탑 공격속도 +20%",
    category: "global_buff",
    rarity: "uncommon",
    effect: { type: "all_firerate_mult", value: 1.20 },
    emoji: "🔩",
  },
  {
    id: "range_all_2",
    name: "위성 연동",
    description: "모든 포탑 사거리 +20%",
    category: "global_buff",
    rarity: "uncommon",
    effect: { type: "all_range_mult", value: 1.20 },
    emoji: "🛰️",
  },
  {
    id: "passive_income_2",
    name: "데이터 마이닝",
    description: "웨이브 시작마다 크레딧 +40 지급",
    category: "economy",
    rarity: "uncommon",
    effect: { type: "passive_income", creditsPerWave: 40 },
    emoji: "💻",
  },
  {
    id: "cost_reduction_2",
    name: "대량 생산",
    description: "모든 포탑 건설 비용 -25%",
    category: "economy",
    rarity: "uncommon",
    effect: { type: "tower_cost_reduction", value: 0.75 },
    emoji: "🏭",
  },
  {
    id: "credits_now_2",
    name: "메가코프 약탈",
    description: "즉시 크레딧 +150 획득",
    category: "economy",
    rarity: "uncommon",
    effect: { type: "credits_bonus", value: 150 },
    emoji: "💎",
  },
  {
    id: "lives_restore_2",
    name: "시스템 복구",
    description: "즉시 생명력 +5 회복",
    category: "economy",
    rarity: "uncommon",
    effect: { type: "lives_restore", value: 5 },
    emoji: "❤️",
  },
  {
    id: "slow_global_2",
    name: "시간 왜곡",
    description: "모든 적 이동속도 영구 -10%",
    category: "global_buff",
    rarity: "uncommon",
    effect: { type: "enemy_slow_global", factor: 0.10 },
    emoji: "⏳",
  },
  {
    id: "sell_refund_1",
    name: "재활용 프로토콜",
    description: "포탑 판매 시 추가 +20% 환급",
    category: "economy",
    rarity: "uncommon",
    effect: { type: "sell_refund_bonus", value: 0.20 },
    emoji: "♻️",
  },

  // === Tower-specific buffs ===
  {
    id: "buff_sniper_dmg",
    name: "레일건 강화",
    description: "저격 포탑 공격력 +40%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "sniper", stat: "damage", mult: 1.40 },
    emoji: "🎯",
  },
  {
    id: "buff_area_dmg",
    name: "융합로 업그레이드",
    description: "광역 포탑 공격력 +40%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "area", stat: "damage", mult: 1.40 },
    emoji: "💥",
  },
  {
    id: "buff_slow_range",
    name: "냉각 범위 확장",
    description: "지연 포탑 사거리 +50%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "slow", stat: "range", mult: 1.50 },
    emoji: "❄️",
  },
  {
    id: "buff_laser_firerate",
    name: "포톤 가속기",
    description: "레이저 포탑 공격속도 +50%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "laser", stat: "firerate", mult: 1.50 },
    emoji: "🔆",
  },
  {
    id: "buff_emp_dmg",
    name: "핵 방전기",
    description: "EMP 포탑 공격력 +50%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "emp", stat: "damage", mult: 1.50 },
    emoji: "⚡",
  },
  {
    id: "buff_poison_firerate",
    name: "독소 가속",
    description: "독소 포탑 공격속도 +40%",
    category: "tower_specific",
    rarity: "uncommon",
    effect: { type: "tower_type_buff", towerId: "poison", stat: "firerate", mult: 1.40 },
    emoji: "☠️",
  },

  // === Rare ===
  {
    id: "dmg_all_3",
    name: "사이버 신경망",
    description: "모든 포탑 공격력 +40%",
    category: "global_buff",
    rarity: "rare",
    effect: { type: "all_damage_mult", value: 1.40 },
    emoji: "🧠",
  },
  {
    id: "firerate_all_3",
    name: "AI 타겟팅 시스템",
    description: "모든 포탑 공격속도 +35%",
    category: "global_buff",
    rarity: "rare",
    effect: { type: "all_firerate_mult", value: 1.35 },
    emoji: "🤖",
  },
  {
    id: "range_all_3",
    name: "오비탈 스캐너",
    description: "모든 포탑 사거리 +35%",
    category: "global_buff",
    rarity: "rare",
    effect: { type: "all_range_mult", value: 1.35 },
    emoji: "🌌",
  },
  {
    id: "slow_global_3",
    name: "시공간 붕괴",
    description: "모든 적 이동속도 영구 -20%",
    category: "global_buff",
    rarity: "rare",
    effect: { type: "enemy_slow_global", factor: 0.20 },
    emoji: "🕳️",
  },
  {
    id: "cost_reduction_3",
    name: "나노 제조기",
    description: "모든 포탑 건설 비용 -40%",
    category: "economy",
    rarity: "rare",
    effect: { type: "tower_cost_reduction", value: 0.60 },
    emoji: "🔬",
  },
  {
    id: "passive_income_3",
    name: "사이버 경제 네트워크",
    description: "웨이브 시작마다 크레딧 +80 지급",
    category: "economy",
    rarity: "rare",
    effect: { type: "passive_income", creditsPerWave: 80 },
    emoji: "🏦",
  },
];

/** Returns 3 non-duplicate upgrade choices, weighted by rarity */
export function getUpgradeChoices(
  activeUpgradeIds: string[],
  waveNumber: number
): UpgradeDef[] {
  const pool = UPGRADE_POOL.filter((u) => !activeUpgradeIds.includes(u.id));
  if (pool.length <= 3) return pool;

  // Weight: common=5, uncommon=3, rare=1 (early waves) → rare gets boosted later
  const rareWeight = Math.min(1 + Math.floor(waveNumber / 3), 4);
  const weighted: UpgradeDef[] = [];
  for (const u of pool) {
    const w = u.rarity === "common" ? 5 : u.rarity === "uncommon" ? 3 : rareWeight;
    for (let i = 0; i < w; i++) weighted.push(u);
  }

  // Fisher-Yates shuffle, pick first 3 unique
  const chosen: UpgradeDef[] = [];
  const seenIds = new Set<string>();
  for (let i = weighted.length - 1; i > 0 && chosen.length < 3; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
    if (!seenIds.has(weighted[i].id)) {
      seenIds.add(weighted[i].id);
      chosen.push(weighted[i]);
    }
  }
  return chosen;
}
