import { create } from "zustand";
import {
  Difficulty,
  ClinicalPhase,
  DiseaseCategory,
  ResearcherGrade,
  DIFFICULTY_CONFIG,
  CLINICAL_PHASES,
  DISEASE_CATEGORIES,
  RESEARCHER_GRADES,
  getNextPhase,
} from "@/data/gameConfig";

/** 연구원 */
export interface Researcher {
  id: string;
  name: string;
  grade: ResearcherGrade;
  specialty: DiseaseCategory;
  experience: number; // 임상 성공 횟수 (레벨업 기반)
}

/** 파이프라인 (신약 개발 프로젝트) */
export interface Pipeline {
  id: string;
  name: string;
  diseaseCategory: DiseaseCategory;
  currentPhase: ClinicalPhase;
  turnsRemaining: number; // 현재 단계 남은 턴
  assignedResearchers: string[]; // 연구원 ID 목록
  licensed: boolean; // 라이선스 판매 여부
}

/** 주가 히스토리 포인트 */
export interface StockHistoryPoint {
  turn: number;
  price: number;
}

/** 게임 로그 메시지 */
export interface GameLog {
  turn: number;
  message: string;
  type: "info" | "success" | "danger" | "warning";
}

/** 게임 전체 상태 */
interface GameState {
  // 게임 메타
  difficulty: Difficulty;
  turn: number;
  phase: "title" | "playing" | "victory" | "gameover";

  // 핵심 자원
  cash: number; // 단위: 억
  stockPrice: number; // 단위: 원
  trust: number; // 0~100
  marketCap: number; // 시가총액 (자동 계산, 단위: 억)

  // 주가 히스토리
  stockHistory: StockHistoryPoint[];

  // 연구원 & 파이프라인
  researchers: Researcher[];
  pipelines: Pipeline[];

  // 승인된 신약 수
  approvedDrugs: number;

  // 유상증자 쿨다운
  equityOfferingCooldown: number;

  // 상장폐지 경고 카운터
  delistingWarningTurns: number;

  // 게임 로그
  logs: GameLog[];

  // 액션
  startGame: (difficulty: Difficulty) => void;
  nextTurn: () => void;
  hireResearcher: (researcher: Omit<Researcher, "id" | "experience">) => void;
  fireResearcher: (id: string) => void;
  startPipeline: (
    name: string,
    diseaseCategory: DiseaseCategory,
    researcherIds: string[]
  ) => void;
  assignResearcher: (pipelineId: string, researcherId: string) => void;
  unassignResearcher: (pipelineId: string, researcherId: string) => void;
  conductEquityOffering: (percentage: number) => void;
  sellLicense: (pipelineId: string) => void;
  resetGame: () => void;
}

const INITIAL_SHARES = 10_000_000; // 발행 주식 수 1000만주

/** 시가총액 계산 (억 단위) */
function calcMarketCap(stockPrice: number): number {
  return Math.floor((stockPrice * INITIAL_SHARES) / 100_000_000);
}

/** 고유 ID 생성 */
let idCounter = 0;
function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}

/** 파이프라인에 배정된 연구원들의 성공률 보정 합계 */
function getResearcherBonus(
  researchers: Researcher[],
  assignedIds: string[],
  diseaseCategory: DiseaseCategory
): { successBonus: number; speedBonus: number } {
  let successBonus = 0;
  let speedBonus = 0;
  let specialtyCount = 0;

  for (const id of assignedIds) {
    const r = researchers.find((res) => res.id === id);
    if (!r) continue;
    const grade = RESEARCHER_GRADES[r.grade];
    successBonus += grade.successBonus + r.experience * 0.005;
    speedBonus += grade.speedBonus;
    if (r.specialty === diseaseCategory) specialtyCount++;
  }

  // 팀 시너지: 같은 분야 3명 이상 → +5%
  if (specialtyCount >= 3) {
    successBonus += 0.05;
  }

  return { successBonus, speedBonus };
}

export const useGameStore = create<GameState>((set, get) => ({
  difficulty: "normal",
  turn: 0,
  phase: "title",
  cash: 0,
  stockPrice: 0,
  trust: 100,
  marketCap: 0,
  stockHistory: [],
  researchers: [],
  pipelines: [],
  approvedDrugs: 0,
  equityOfferingCooldown: 0,
  delistingWarningTurns: 0,
  logs: [],

  startGame: (difficulty) => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const initialPrice = config.initialStockPrice;
    set({
      difficulty,
      turn: 1,
      phase: "playing",
      cash: config.initialCash,
      stockPrice: initialPrice,
      trust: 100,
      marketCap: calcMarketCap(initialPrice),
      stockHistory: [{ turn: 1, price: initialPrice }],
      researchers: [],
      pipelines: [],
      approvedDrugs: 0,
      equityOfferingCooldown: 0,
      delistingWarningTurns: 0,
      logs: [
        {
          turn: 1,
          message: `${config.label} 난이도로 게임을 시작합니다. 초기 자본: ${config.initialCash}억`,
          type: "info",
        },
      ],
    });
  },

  nextTurn: () => {
    const state = get();
    const newTurn = state.turn + 1;
    const newLogs: GameLog[] = [];
    let newCash = state.cash;
    let newStockPrice = state.stockPrice;
    let newTrust = state.trust;
    let newApproved = state.approvedDrugs;
    let newPipelines = [...state.pipelines];
    const newResearchers = [...state.researchers];
    let newDelistingWarning = state.delistingWarningTurns;
    let newCooldown = Math.max(0, state.equityOfferingCooldown - 1);

    // 1. 연구원 월급 지출
    let totalSalary = 0;
    for (const r of newResearchers) {
      totalSalary += RESEARCHER_GRADES[r.grade].salary;
    }
    newCash -= totalSalary;
    if (totalSalary > 0) {
      newLogs.push({
        turn: newTurn,
        message: `연구원 월급 지출: ${totalSalary.toFixed(1)}억`,
        type: "info",
      });
    }

    // 2. 파이프라인이 없는데 비용이 나가면 주가 하락 (시장의 불신)
    if (newPipelines.length === 0 && newResearchers.length > 0) {
      // 연구원은 있는데 파이프라인이 없으면 -2~4% 하락
      const idlePenalty = 0.02 + newResearchers.length * 0.005;
      newStockPrice = Math.round(newStockPrice * (1 - Math.min(idlePenalty, 0.08)));
      newLogs.push({
        turn: newTurn,
        message: `📉 파이프라인 없이 인건비만 지출 중... 시장 신뢰 하락`,
        type: "warning",
      });
    } else if (newPipelines.length === 0 && newResearchers.length === 0) {
      // 아무것도 안 하면 소폭 하락 (-1%)
      newStockPrice = Math.round(newStockPrice * 0.99);
    }

    // 3. 파이프라인 진행
    const completedPipelines: string[] = [];
    const failedPipelines: string[] = [];

    newPipelines = newPipelines.map((pipeline) => {
      const updated = { ...pipeline, turnsRemaining: pipeline.turnsRemaining - 1 };

      // 임상 진행 중 기대감 → 주가 소폭 상승
      const phaseConfig = CLINICAL_PHASES[pipeline.currentPhase];
      const diseaseConfig = DISEASE_CATEGORIES[pipeline.diseaseCategory];
      const expectationBoost =
        phaseConfig.successStockImpact *
        diseaseConfig.stockMultiplier *
        0.05; // 턴당 기대감 5%
      newStockPrice = Math.round(newStockPrice * (1 + expectationBoost));

      // 임상 단계 완료 판정
      if (updated.turnsRemaining <= 0) {
        const { successBonus } = getResearcherBonus(
          newResearchers,
          pipeline.assignedResearchers,
          pipeline.diseaseCategory
        );
        const finalSuccessRate = Math.min(
          0.95,
          phaseConfig.baseSuccessRate *
            diseaseConfig.successRateMultiplier +
            successBonus
        );

        const roll = Math.random();
        if (roll < finalSuccessRate) {
          // 성공
          const stockImpact =
            phaseConfig.successStockImpact *
            diseaseConfig.stockMultiplier *
            (pipeline.licensed ? 0.5 : 1);
          newStockPrice = Math.round(newStockPrice * (1 + stockImpact));
          newTrust = Math.min(100, newTrust + 3);

          // 배정된 연구원 경험치 증가
          for (const rId of pipeline.assignedResearchers) {
            const rIdx = newResearchers.findIndex((r) => r.id === rId);
            if (rIdx >= 0) {
              newResearchers[rIdx] = {
                ...newResearchers[rIdx],
                experience: newResearchers[rIdx].experience + 1,
              };
            }
          }

          const nextPhase = getNextPhase(pipeline.currentPhase);
          if (nextPhase === "approved") {
            newApproved++;
            completedPipelines.push(pipeline.id);
            newLogs.push({
              turn: newTurn,
              message: `🎉 [${pipeline.name}] FDA 승인! 신약 상용화 성공!`,
              type: "success",
            });
          } else {
            const nextConfig = CLINICAL_PHASES[nextPhase];
            const { speedBonus } = getResearcherBonus(
              newResearchers,
              pipeline.assignedResearchers,
              pipeline.diseaseCategory
            );
            updated.currentPhase = nextPhase;
            updated.turnsRemaining = Math.max(
              1,
              nextConfig.turns - speedBonus
            );
            newCash -= nextConfig.cost * diseaseConfig.costMultiplier;
            newLogs.push({
              turn: newTurn,
              message: `✅ [${pipeline.name}] ${phaseConfig.label} 성공! → ${nextConfig.label} 진입 (비용: ${(nextConfig.cost * diseaseConfig.costMultiplier).toFixed(0)}억)`,
              type: "success",
            });
          }
        } else {
          // 실패
          const stockImpact = phaseConfig.failureStockImpact;
          newStockPrice = Math.round(newStockPrice * (1 + stockImpact));
          newTrust = Math.max(0, newTrust - 10);
          failedPipelines.push(pipeline.id);
          newLogs.push({
            turn: newTurn,
            message: `❌ [${pipeline.name}] ${phaseConfig.label} 실패... 파이프라인 폐기`,
            type: "danger",
          });
        }
      }

      return updated;
    });

    // 실패/완료 파이프라인 제거
    newPipelines = newPipelines.filter(
      (p) =>
        !failedPipelines.includes(p.id) && !completedPipelines.includes(p.id)
    );

    // 4. 주가 최소값 보정
    newStockPrice = Math.max(100, newStockPrice);

    // 5. 시가총액 계산
    const newMarketCap = calcMarketCap(newStockPrice);

    // 6. 상장폐지 체크
    const config = DIFFICULTY_CONFIG[state.difficulty];
    if (newStockPrice <= config.delistingThreshold) {
      newDelistingWarning++;
      if (newDelistingWarning >= 8) {
        // 5턴 경고 + 3턴 유예 = 8턴
        set({
          ...state,
          phase: "gameover",
          turn: newTurn,
          logs: [
            ...state.logs,
            {
              turn: newTurn,
              message: "상장폐지로 게임이 종료되었습니다.",
              type: "danger",
            },
          ],
        });
        return;
      } else if (newDelistingWarning === 5) {
        newLogs.push({
          turn: newTurn,
          message: `⚠️ 상장폐지 경고! 3턴 내 주가를 ${config.delistingThreshold.toLocaleString()}원 이상으로 회복하세요!`,
          type: "warning",
        });
      }
    } else {
      newDelistingWarning = 0;
    }

    // 7. 파산 체크
    if (newCash <= 0 && newPipelines.length === 0) {
      set({
        ...state,
        phase: "gameover",
        cash: newCash,
        turn: newTurn,
        logs: [
          ...state.logs,
          {
            turn: newTurn,
            message: "자본금이 고갈되어 파산했습니다.",
            type: "danger",
          },
        ],
      });
      return;
    }

    // 8. 승리 체크
    const trillion = 10_000; // 1조 = 10,000억
    if (newMarketCap >= trillion || newApproved >= 3) {
      set({
        phase: "victory",
        turn: newTurn,
        cash: newCash,
        stockPrice: newStockPrice,
        trust: newTrust,
        marketCap: newMarketCap,
        stockHistory: [
          ...state.stockHistory,
          { turn: newTurn, price: newStockPrice },
        ],
        researchers: newResearchers,
        pipelines: newPipelines,
        approvedDrugs: newApproved,
        equityOfferingCooldown: newCooldown,
        delistingWarningTurns: newDelistingWarning,
        logs: [
          ...state.logs,
          ...newLogs,
          {
            turn: newTurn,
            message:
              newMarketCap >= trillion
                ? "🏆 시가총액 1조 달성! 승리!"
                : "🏆 FDA 승인 신약 3개 달성! 승리!",
            type: "success",
          },
        ],
      });
      return;
    }

    // 상태 업데이트
    set({
      turn: newTurn,
      cash: newCash,
      stockPrice: newStockPrice,
      trust: newTrust,
      marketCap: newMarketCap,
      stockHistory: [
        ...state.stockHistory,
        { turn: newTurn, price: newStockPrice },
      ],
      researchers: newResearchers,
      pipelines: newPipelines,
      approvedDrugs: newApproved,
      equityOfferingCooldown: newCooldown,
      delistingWarningTurns: newDelistingWarning,
      logs: [...state.logs, ...newLogs],
    });
  },

  hireResearcher: (researcher) => {
    const state = get();
    const salary = RESEARCHER_GRADES[researcher.grade].salary;
    // 고용 시 3개월치 계약금
    const hiringCost = salary * 3;
    if (state.cash < hiringCost) return;

    const newResearcher: Researcher = {
      ...researcher,
      id: generateId(),
      experience: 0,
    };

    set({
      cash: state.cash - hiringCost,
      researchers: [...state.researchers, newResearcher],
      logs: [
        ...state.logs,
        {
          turn: state.turn,
          message: `${RESEARCHER_GRADES[researcher.grade].label} ${researcher.name} 고용 (계약금: ${hiringCost}억)`,
          type: "info",
        },
      ],
    });
  },

  fireResearcher: (id) => {
    const state = get();
    const researcher = state.researchers.find((r) => r.id === id);
    if (!researcher) return;

    // 파이프라인에서도 제거
    const updatedPipelines = state.pipelines.map((p) => ({
      ...p,
      assignedResearchers: p.assignedResearchers.filter((rId) => rId !== id),
    }));

    set({
      researchers: state.researchers.filter((r) => r.id !== id),
      pipelines: updatedPipelines,
      logs: [
        ...state.logs,
        {
          turn: state.turn,
          message: `${researcher.name} 해고`,
          type: "info",
        },
      ],
    });
  },

  startPipeline: (name, diseaseCategory, researcherIds) => {
    const state = get();
    const diseaseConfig = DISEASE_CATEGORIES[diseaseCategory];
    const firstPhase = CLINICAL_PHASES.preclinical;
    const cost = firstPhase.cost * diseaseConfig.costMultiplier;

    if (state.cash < cost) return;

    const { speedBonus } = getResearcherBonus(
      state.researchers,
      researcherIds,
      diseaseCategory
    );

    const pipeline: Pipeline = {
      id: generateId(),
      name,
      diseaseCategory,
      currentPhase: "preclinical",
      turnsRemaining: Math.max(1, firstPhase.turns - speedBonus),
      assignedResearchers: researcherIds,
      licensed: false,
    };

    set({
      cash: state.cash - cost,
      pipelines: [...state.pipelines, pipeline],
      logs: [
        ...state.logs,
        {
          turn: state.turn,
          message: `🧬 [${name}] 파이프라인 개시! (${diseaseConfig.label}, 비용: ${cost.toFixed(0)}억)`,
          type: "info",
        },
      ],
    });
  },

  assignResearcher: (pipelineId, researcherId) => {
    const state = get();
    set({
      pipelines: state.pipelines.map((p) =>
        p.id === pipelineId
          ? {
              ...p,
              assignedResearchers: [...p.assignedResearchers, researcherId],
            }
          : p
      ),
    });
  },

  unassignResearcher: (pipelineId, researcherId) => {
    const state = get();
    set({
      pipelines: state.pipelines.map((p) =>
        p.id === pipelineId
          ? {
              ...p,
              assignedResearchers: p.assignedResearchers.filter(
                (id) => id !== researcherId
              ),
            }
          : p
      ),
    });
  },

  conductEquityOffering: (percentage) => {
    const state = get();
    if (state.equityOfferingCooldown > 0) return;
    if (percentage < 0.1 || percentage > 0.3) return;

    const raisedAmount = Math.floor(state.marketCap * percentage);
    const trustPenalty = Math.floor(percentage * 66); // 10%→-7, 30%→-20

    // 상장폐지 경고 중이면 페널티 2배
    const finalPenalty =
      state.delistingWarningTurns >= 5 ? trustPenalty * 2 : trustPenalty;

    set({
      cash: state.cash + raisedAmount,
      trust: Math.max(0, state.trust - finalPenalty),
      equityOfferingCooldown: 6,
      logs: [
        ...state.logs,
        {
          turn: state.turn,
          message: `💰 유상증자 실행! ${raisedAmount.toLocaleString()}억 조달 (신뢰도 -${finalPenalty})`,
          type: "warning",
        },
      ],
    });
  },

  sellLicense: (pipelineId) => {
    const state = get();
    const pipeline = state.pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    if (
      pipeline.currentPhase !== "phase2" &&
      pipeline.currentPhase !== "phase3"
    )
      return;
    if (pipeline.licensed) return;

    // 라이선스 판매 금액: 시가총액의 5~10%
    const licenseValue = Math.floor(state.marketCap * 0.07);

    set({
      cash: state.cash + licenseValue,
      pipelines: state.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, licensed: true } : p
      ),
      logs: [
        ...state.logs,
        {
          turn: state.turn,
          message: `📄 [${pipeline.name}] 라이선스 판매! ${licenseValue.toLocaleString()}억 확보 (향후 주가 영향 50% 감소)`,
          type: "info",
        },
      ],
    });
  },

  resetGame: () => {
    set({
      difficulty: "normal",
      turn: 0,
      phase: "title",
      cash: 0,
      stockPrice: 0,
      trust: 100,
      marketCap: 0,
      stockHistory: [],
      researchers: [],
      pipelines: [],
      approvedDrugs: 0,
      equityOfferingCooldown: 0,
      delistingWarningTurns: 0,
      logs: [],
    });
  },
}));
