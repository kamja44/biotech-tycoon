/**
 * 게임 설정 데이터
 * - 난이도별 초기값, 임상 단계, 질환 타입 등 게임의 핵심 수치를 관리
 */

export type Difficulty = "easy" | "normal" | "hard";

/** 임상 단계 ID */
export type ClinicalPhase =
  | "preclinical"
  | "phase1"
  | "phase2"
  | "phase3"
  | "fda_approval";

/** 질환 카테고리 */
export type DiseaseCategory = "generic" | "common" | "rare" | "innovative";

/** 연구원 등급 */
export type ResearcherGrade = "intern" | "junior" | "senior" | "expert";

/** 난이도별 설정 */
export const DIFFICULTY_CONFIG = {
  easy: {
    label: "이지",
    initialCash: 50_000, // 500억 (단위: 억)
    initialStockPrice: 15_000, // 15,000원
    delistingThreshold: 3_000, // 3,000원 이하 시 상장폐지 경고
    eventBias: 0.3, // 호재 확률 보정 (+30%)
    hiringCostMultiplier: 0.8, // 고용비 20% 할인
    clinicalCostMultiplier: 0.8, // 임상 비용 20% 할인
    successRateBonus: 0.05, // 성공률 +5%
    failureImpactMultiplier: 0.7, // 실패 시 주가 타격 30% 감소
    trustLossMultiplier: 0.7, // 신뢰도 하락 30% 감소
  },
  normal: {
    label: "노멀",
    initialCash: 30_000,
    initialStockPrice: 10_000,
    delistingThreshold: 5_000,
    eventBias: 0,
    hiringCostMultiplier: 1.0,
    clinicalCostMultiplier: 1.0,
    successRateBonus: 0,
    failureImpactMultiplier: 1.0,
    trustLossMultiplier: 1.0,
  },
  hard: {
    label: "하드",
    initialCash: 15_000,
    initialStockPrice: 8_000,
    delistingThreshold: 5_000,
    eventBias: -0.2, // 악재 확률 보정 (+20%)
    hiringCostMultiplier: 2.0, // 고용비 2배
    clinicalCostMultiplier: 1.5, // 임상 비용 1.5배
    successRateBonus: -0.1, // 성공률 -10%
    failureImpactMultiplier: 1.3, // 실패 시 주가 타격 30% 증가
    trustLossMultiplier: 1.5, // 신뢰도 하락 50% 증가
  },
} as const;

/** 임상 단계별 설정 */
export const CLINICAL_PHASES = {
  preclinical: {
    label: "전임상",
    turns: 3,
    cost: 5, // 5억
    baseSuccessRate: 0.7,
    successStockImpact: 0.02,
    failureStockImpact: -0.05,
  },
  phase1: {
    label: "임상 1상",
    turns: 4,
    cost: 20,
    baseSuccessRate: 0.6,
    successStockImpact: 0.05,
    failureStockImpact: -0.15,
  },
  phase2: {
    label: "임상 2상",
    turns: 6,
    cost: 80,
    baseSuccessRate: 0.4,
    successStockImpact: 0.15,
    failureStockImpact: -0.3,
  },
  phase3: {
    label: "임상 3상",
    turns: 8,
    cost: 200,
    baseSuccessRate: 0.3,
    successStockImpact: 0.4,
    failureStockImpact: -0.5,
  },
  fda_approval: {
    label: "FDA 승인",
    turns: 2,
    cost: 50,
    baseSuccessRate: 0.85,
    successStockImpact: 1.0,
    failureStockImpact: -0.6,
  },
} as const;

/** 질환 카테고리별 설정 */
export const DISEASE_CATEGORIES = {
  generic: {
    label: "제네릭 (복제약)",
    successRateMultiplier: 1.15, // 성공률 +15% 보정
    stockMultiplier: 0.3, // 주가 영향 x0.3
    costMultiplier: 0.5,
  },
  common: {
    label: "일반 질환 치료제",
    successRateMultiplier: 1.0,
    stockMultiplier: 1.0,
    costMultiplier: 1.0,
  },
  rare: {
    label: "희귀질환 치료제",
    successRateMultiplier: 0.8,
    stockMultiplier: 2.0,
    costMultiplier: 1.5,
  },
  innovative: {
    label: "혁신 항암제",
    successRateMultiplier: 0.6,
    stockMultiplier: 3.0,
    costMultiplier: 2.0,
  },
} as const;

/** 연구원 등급별 설정 */
export const RESEARCHER_GRADES = {
  intern: {
    label: "인턴",
    salary: 0.5, // 0.5억/턴
    successBonus: 0.01,
    speedBonus: 0,
  },
  junior: {
    label: "주니어",
    salary: 1,
    successBonus: 0.03,
    speedBonus: 0,
  },
  senior: {
    label: "시니어",
    salary: 3,
    successBonus: 0.07,
    speedBonus: 1, // 1턴 단축
  },
  expert: {
    label: "석학",
    salary: 8,
    successBonus: 0.15,
    speedBonus: 2,
  },
} as const;

/** 다음 임상 단계 반환 */
export function getNextPhase(
  current: ClinicalPhase
): ClinicalPhase | "approved" {
  const order: ClinicalPhase[] = [
    "preclinical",
    "phase1",
    "phase2",
    "phase3",
    "fda_approval",
  ];
  const idx = order.indexOf(current);
  if (idx === order.length - 1) return "approved";
  return order[idx + 1];
}
