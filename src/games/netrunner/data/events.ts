import type { StatusEffectId } from "../store/gameStore";

export type EventEffect =
  | { type: "gain_gold"; amount: number }
  | { type: "lose_gold"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "lose_hp"; amount: number }
  | { type: "gain_max_hp"; amount: number }
  | { type: "apply_status"; status: StatusEffectId; stacks: number }  // applied next combat start
  | { type: "gain_card"; rarity: "common" | "uncommon" | "rare" }
  | { type: "remove_card" }   // player chooses a card to remove from deck
  | { type: "upgrade_card" }  // player chooses a card to upgrade
  | { type: "nothing" };

export interface EventChoice {
  label: string;
  effects: EventEffect[];
  probability?: number;  // if present, this choice has random outcome split: [probability] = effects, [1-probability] = altEffects
  altEffects?: EventEffect[];
  altLabel?: string;     // description of the bad outcome
  requiresItem?: string; // id of relic/item required
}

export interface EventScenario {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export const EVENT_SCENARIOS: EventScenario[] = [
  {
    id: "data_cache",
    title: "버려진 데이터 캐시",
    description: "낡은 서버 코어에서 암호화된 데이터 패킷을 발견했다.",
    choices: [
      {
        label: "패킷 해독",
        effects: [{ type: "gain_gold", amount: 25 }],
        probability: 0.7,
        altEffects: [{ type: "gain_gold", amount: 25 }, { type: "apply_status", status: "bleed", stacks: 3 }],
        altLabel: "바이러스 감염! 출혈 3 부여",
      },
      { label: "그냥 지나친다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "wounded_runner",
    title: "부상당한 넷러너",
    description: "골목에 쓰러진 넷러너가 도움을 요청하고 있다.",
    choices: [
      { label: "치료해준다", effects: [{ type: "lose_hp", amount: 15 }, { type: "gain_card", rarity: "uncommon" }] },
      { label: "장비를 빼앗는다", effects: [{ type: "gain_gold", amount: 30 }, { type: "apply_status", status: "bleed", stacks: 2 }] },
      { label: "그냥 지나친다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "megacorp_vending",
    title: "메가코프 자판기",
    description: "코퍼 로고가 새겨진 자판기. 해킹하면 뭔가 나올 것 같다.",
    choices: [
      {
        label: "해킹한다 (골드 20 소모)",
        effects: [{ type: "lose_gold", amount: 20 }, { type: "gain_card", rarity: "uncommon" }],
        probability: 0.5,
        altEffects: [{ type: "lose_gold", amount: 20 }, { type: "apply_status", status: "shock", stacks: 3 }],
        altLabel: "감전! 감전 3 부여",
      },
      { label: "정상 구매 (골드 15)", effects: [{ type: "lose_gold", amount: 15 }, { type: "gain_card", rarity: "common" }, { type: "gain_card", rarity: "common" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "shady_dealer",
    title: "수상한 딜러",
    description: "어둠 속에서 누군가 손짓하며 \"좋은 물건 있어\"라고 속삭인다.",
    choices: [
      { label: "거래한다 (골드 30)", effects: [{ type: "lose_gold", amount: 30 }, { type: "gain_card", rarity: "rare" }] },
      { label: "거절한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "upgrade_kiosk",
    title: "오래된 업그레이드 키오스크",
    description: "반쯤 망가진 카드 업그레이드 단말기. 작동은 되는 것 같다.",
    choices: [
      { label: "카드 업그레이드 (HP 10 소모)", effects: [{ type: "lose_hp", amount: 10 }, { type: "upgrade_card" }] },
      { label: "강제로 과부하 (HP 25 소모)", effects: [{ type: "lose_hp", amount: 25 }, { type: "upgrade_card" }, { type: "upgrade_card" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "secret_lab",
    title: "비밀 실험실",
    description: "버려진 실험실. 각종 약품과 장치가 어지럽게 널려 있다.",
    choices: [
      { label: "강화 약품 주입", effects: [{ type: "gain_max_hp", amount: 10 }, { type: "lose_hp", amount: 15 }] },
      { label: "실험 장치 분해", effects: [{ type: "gain_card", rarity: "uncommon" }, { type: "lose_hp", amount: 10 }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "corp_vault",
    title: "코퍼 금고",
    description: "두꺼운 장갑 문. 옆에 쓰러진 경비원의 손에 카드키가 있다.",
    choices: [
      {
        label: "금고를 연다",
        effects: [{ type: "gain_gold", amount: 50 }],
        probability: 0.4,
        altEffects: [{ type: "apply_status", status: "bleed", stacks: 2 }],
        altLabel: "경보 발동! 출혈 2 부여",
      },
      { label: "카드키만 챙긴다", effects: [{ type: "gain_gold", amount: 15 }] },
      { label: "그냥 지나친다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "black_market",
    title: "암시장",
    description: "지하 네트워크에서 뭔가를 발견했다. 위험해 보이지만 흥미롭다.",
    choices: [
      { label: "희귀 카드 구매 (골드 40)", effects: [{ type: "lose_gold", amount: 40 }, { type: "gain_card", rarity: "rare" }] },
      { label: "일반 카드 구매 (골드 15)", effects: [{ type: "lose_gold", amount: 15 }, { type: "gain_card", rarity: "common" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "medical_station",
    title: "응급 의료 스테이션",
    description: "버려진 의료 키오스크. 아직 작동 중인 것 같다.",
    choices: [
      { label: "치료 (골드 20)", effects: [{ type: "lose_gold", amount: 20 }, { type: "heal", amount: 20 }] },
      { label: "완전 치료 (골드 40)", effects: [{ type: "lose_gold", amount: 40 }, { type: "heal", amount: 999 }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "data_broker",
    title: "데이터 브로커",
    description: "정보를 거래하는 중개인. 덱 정보를 보여주면 돈을 주겠다고 한다.",
    choices: [
      { label: "정보 제공", effects: [{ type: "gain_gold", amount: 35 }, { type: "remove_card" }] },
      { label: "거절한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "abandoned_terminal",
    title: "버려진 터미널",
    description: "먼지 쌓인 오래된 단말기. 부팅하면 뭔가 나올 것 같다.",
    choices: [
      {
        label: "부팅한다",
        effects: [{ type: "gain_card", rarity: "common" }],
        probability: 0.6,
        altEffects: [{ type: "apply_status", status: "overload", stacks: 2 }],
        altLabel: "시스템 오류! 과부하 2 부여",
      },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "street_vendor",
    title: "노점상",
    description: "거리의 행상인이 수상한 물건들을 팔고 있다.",
    choices: [
      { label: "카드 구매 (골드 10)", effects: [{ type: "lose_gold", amount: 10 }, { type: "gain_card", rarity: "common" }] },
      { label: "무기 구매 (골드 25)", effects: [{ type: "lose_gold", amount: 25 }, { type: "gain_card", rarity: "uncommon" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "neural_interface",
    title: "신경 인터페이스",
    description: "불법 개조 신경 인터페이스. 설치하면 능력이 향상될 수도 있다.",
    choices: [
      { label: "설치한다", effects: [{ type: "lose_hp", amount: 20 }, { type: "gain_max_hp", amount: 15 }, { type: "gain_card", rarity: "rare" }] },
      { label: "거절한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "hacker_hideout",
    title: "해커 아지트",
    description: "지하 해커 집단의 아지트를 발견했다. 협력을 제안한다.",
    choices: [
      { label: "협력한다", effects: [{ type: "gain_card", rarity: "uncommon" }, { type: "upgrade_card" }] },
      { label: "정보만 빼간다", effects: [{ type: "gain_gold", amount: 20 }, { type: "gain_card", rarity: "common" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "trapped_room",
    title: "함정 방",
    description: "출입구가 잠겼다! 탈출 방법을 찾아야 한다.",
    choices: [
      {
        label: "해킹으로 탈출",
        effects: [{ type: "nothing" }],
        probability: 0.7,
        altEffects: [{ type: "lose_hp", amount: 10 }],
        altLabel: "실패! 10 피해",
      },
      { label: "힘으로 부수고 탈출", effects: [{ type: "lose_hp", amount: 15 }] },
    ],
  },
  {
    id: "old_cache",
    title: "구식 무기 캐시",
    description: "오래된 무기 저장소를 발견했다. 대부분 낡았지만 쓸 만한 게 있다.",
    choices: [
      { label: "챙긴다", effects: [{ type: "gain_card", rarity: "common" }, { type: "gain_card", rarity: "common" }] },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "corrupted_ai",
    title: "오염된 AI",
    description: "손상된 AI가 중얼거리고 있다. 데이터를 추출할 수 있을 것 같다.",
    choices: [
      {
        label: "데이터 추출",
        effects: [{ type: "gain_card", rarity: "rare" }],
        probability: 0.5,
        altEffects: [{ type: "apply_status", status: "shock", stacks: 2 }, { type: "lose_hp", amount: 8 }],
        altLabel: "역공격! 감전 2 + 8 피해",
      },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "rest_area",
    title: "임시 휴식 공간",
    description: "안전한 공간을 발견했다. 잠시 쉬어갈 수 있다.",
    choices: [
      { label: "회복한다", effects: [{ type: "heal", amount: 15 }] },
      { label: "카드 정리 (덱에서 카드 제거)", effects: [{ type: "remove_card" }] },
      { label: "서두른다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "mega_jackpot",
    title: "대박 잭팟",
    description: "낡은 슬롯 머신이 작동하고 있다. 운을 시험해볼까?",
    choices: [
      {
        label: "도박한다 (골드 15 소모)",
        effects: [{ type: "lose_gold", amount: 15 }, { type: "gain_gold", amount: 60 }],
        probability: 0.3,
        altEffects: [{ type: "lose_gold", amount: 15 }],
        altLabel: "꽝! 골드만 잃었다",
      },
      { label: "무시한다", effects: [{ type: "nothing" }] },
    ],
  },
  {
    id: "underground_doc",
    title: "지하 의사",
    description: "면허 없는 의사가 시술을 제안한다. 믿을 수 없지만 선택지가 없다.",
    choices: [
      { label: "수술 (골드 30)", effects: [{ type: "lose_gold", amount: 30 }, { type: "heal", amount: 25 }, { type: "gain_max_hp", amount: 5 }] },
      { label: "약만 구입 (골드 15)", effects: [{ type: "lose_gold", amount: 15 }, { type: "heal", amount: 10 }] },
      { label: "거절한다", effects: [{ type: "nothing" }] },
    ],
  },
];

export function getRandomEvent(): EventScenario {
  return EVENT_SCENARIOS[Math.floor(Math.random() * EVENT_SCENARIOS.length)];
}
