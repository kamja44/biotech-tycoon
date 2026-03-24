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
  calcHiringCost,
} from "@/data/gameConfig";
import { useNotificationStore } from "./notificationStore";

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
  initialTurns: number; // 현재 단계 시작 시 총 턴 수 (프로그레스 바 계산용)
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

  // 자본금 음수 유지 카운터 (36턴 시 파산)
  negativeCashTurns: number;

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

/** 게임 초기 상태 (resetGame 및 create 초기값 공유) */
const INITIAL_STATE = {
  difficulty: "normal" as Difficulty,
  turn: 0,
  phase: "title" as GameState["phase"],
  cash: 0,
  stockPrice: 0,
  trust: 100,
  marketCap: 0,
  stockHistory: [] as StockHistoryPoint[],
  researchers: [] as Researcher[],
  pipelines: [] as Pipeline[],
  approvedDrugs: 0,
  equityOfferingCooldown: 0,
  delistingWarningTurns: 0,
  negativeCashTurns: 0,
  logs: [] as GameLog[],
};

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
  ...INITIAL_STATE,

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
      negativeCashTurns: 0,
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
    const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
    const notify = useNotificationStore.getState().addNotification;
    const newTurn = state.turn + 1;
    const newLogs: GameLog[] = [];
    let newCash = state.cash;
    let newStockPrice = state.stockPrice;
    let newTrust = state.trust;
    let newApproved = state.approvedDrugs;
    let newPipelines = [...state.pipelines];
    const newResearchers = [...state.researchers];
    let newNegativeCashTurns = state.negativeCashTurns;
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

    // 1.5. 신뢰도 기반 주가 보정 (+0.3% or -0.3%)
    if (newTrust >= 70) {
      newStockPrice = Math.round(newStockPrice * 1.003);
    } else if (newTrust < 40) {
      newStockPrice = Math.round(newStockPrice * 0.997);
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
      notify("파이프라인 없이 인건비만 지출 중! 주가가 하락하고 있습니다.", "warning");
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
        const { successBonus, speedBonus: rawSpeedBonus } = getResearcherBonus(
          newResearchers,
          pipeline.assignedResearchers,
          pipeline.diseaseCategory
        );
        const finalSuccessRate = Math.min(
          0.95,
          phaseConfig.baseSuccessRate *
            diseaseConfig.successRateMultiplier +
            successBonus +
            diffConfig.successRateBonus
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
            notify(`[${pipeline.name}] FDA 승인! 신약 상용화 성공!`, "success");
          } else {
            const nextConfig = CLINICAL_PHASES[nextPhase];
            const speedBonusCapped = Math.min(
              rawSpeedBonus,
              Math.floor(nextConfig.turns * 0.6)
            );
            const newTurnsRemaining = Math.max(
              1,
              nextConfig.turns - speedBonusCapped
            );
            updated.currentPhase = nextPhase;
            updated.turnsRemaining = newTurnsRemaining;
            updated.initialTurns = newTurnsRemaining;
            const phaseCost = nextConfig.cost * diseaseConfig.costMultiplier * diffConfig.clinicalCostMultiplier;
            newCash -= phaseCost;
            newLogs.push({
              turn: newTurn,
              message: `✅ [${pipeline.name}] ${phaseConfig.label} 성공! → ${nextConfig.label} 진입 (비용: ${phaseCost.toFixed(0)}억)`,
              type: "success",
            });
            notify(`[${pipeline.name}] ${phaseConfig.label} 성공! ${nextConfig.label}로 진입합니다.`, "success");
          }
        } else {
          // 실패
          const stockImpact = phaseConfig.failureStockImpact * diffConfig.failureImpactMultiplier;
          newStockPrice = Math.round(newStockPrice * (1 + stockImpact));
          const trustLoss = Math.round(10 * diffConfig.trustLossMultiplier);
          newTrust = Math.max(0, newTrust - trustLoss);
          failedPipelines.push(pipeline.id);
          newLogs.push({
            turn: newTurn,
            message: `❌ [${pipeline.name}] ${phaseConfig.label} 실패... 파이프라인 폐기`,
            type: "danger",
          });
          notify(`[${pipeline.name}] ${phaseConfig.label} 실패! 파이프라인이 폐기됩니다.`, "danger");
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
          phase: "gameover",
          turn: newTurn,
          cash: newCash,
          stockPrice: newStockPrice,
          trust: newTrust,
          marketCap: newMarketCap,
          stockHistory: [...state.stockHistory, { turn: newTurn, price: newStockPrice }],
          researchers: newResearchers,
          pipelines: newPipelines,
          approvedDrugs: newApproved,
          equityOfferingCooldown: newCooldown,
          delistingWarningTurns: newDelistingWarning,
          negativeCashTurns: newNegativeCashTurns,
          logs: [
            ...state.logs,
            ...newLogs,
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
        notify(`상장폐지 경고! 3턴 내 주가를 ${config.delistingThreshold.toLocaleString()}원 이상으로 회복하세요!`, "danger");
      } else if (newDelistingWarning > 5) {
        const remaining = 8 - newDelistingWarning;
        notify(`상장폐지까지 ${remaining}턴 남았습니다! 주가를 올리세요!`, "danger");
      }
    } else {
      if (newDelistingWarning > 0) {
        notify("주가가 회복되었습니다! 상장폐지 위기를 벗어났습니다.", "success");
        newLogs.push({
          turn: newTurn,
          message: "📈 주가 회복! 상장폐지 위기를 벗어났습니다.",
          type: "success",
        });
      }
      newDelistingWarning = 0;
    }

    // 7. 파산 체크 (자본금 음수 36턴 유지 시 게임오버)
    if (newCash < 0) {
      newNegativeCashTurns++;
      if (newNegativeCashTurns >= 36) {
        set({
          phase: "gameover",
          turn: newTurn,
          cash: newCash,
          stockPrice: newStockPrice,
          trust: newTrust,
          marketCap: newMarketCap,
          stockHistory: [...state.stockHistory, { turn: newTurn, price: newStockPrice }],
          researchers: newResearchers,
          pipelines: newPipelines,
          approvedDrugs: newApproved,
          equityOfferingCooldown: newCooldown,
          delistingWarningTurns: newDelistingWarning,
          negativeCashTurns: newNegativeCashTurns,
          logs: [
            ...state.logs,
            ...newLogs,
            {
              turn: newTurn,
              message: "자본금 적자가 36개월 지속되어 파산했습니다.",
              type: "danger",
            },
          ],
        });
        return;
      } else if (newNegativeCashTurns === 1) {
        notify("자본금이 마이너스입니다! 36턴 내 흑자 전환하지 못하면 파산합니다.", "danger");
        newLogs.push({
          turn: newTurn,
          message: `⚠️ 자본금 적자 시작! 파산까지 35턴 남음`,
          type: "warning",
        });
      } else if (newNegativeCashTurns % 6 === 0) {
        const remaining = 36 - newNegativeCashTurns;
        notify(`자본금 적자 ${newNegativeCashTurns}턴째! 파산까지 ${remaining}턴 남았습니다.`, "warning");
      }
    } else {
      newNegativeCashTurns = 0;
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
      negativeCashTurns: newNegativeCashTurns,
      logs: [...state.logs, ...newLogs],
    });
  },

  hireResearcher: (researcher) => {
    const state = get();
    const hiringCost = calcHiringCost(researcher.grade, state.difficulty);
    // 적자여도 고용 가능 (36턴 파산 규칙)
    // 단, 고용 후 잔액이 현재 자본금 - 비용


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
    const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
    const diseaseConfig = DISEASE_CATEGORIES[diseaseCategory];
    const firstPhase = CLINICAL_PHASES.preclinical;
    const cost = firstPhase.cost * diseaseConfig.costMultiplier * diffConfig.clinicalCostMultiplier;

    // 적자여도 파이프라인 개시 가능 (36턴 파산 규칙)

    const { speedBonus: rawSpeedBonus } = getResearcherBonus(
      state.researchers,
      researcherIds,
      diseaseCategory
    );
    const speedBonusCapped = Math.min(
      rawSpeedBonus,
      Math.floor(firstPhase.turns * 0.6)
    );
    const initialTurns = Math.max(1, firstPhase.turns - speedBonusCapped);

    const pipeline: Pipeline = {
      id: generateId(),
      name,
      diseaseCategory,
      currentPhase: "preclinical",
      turnsRemaining: initialTurns,
      initialTurns,
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
    // 다른 파이프라인에서 해당 연구원을 먼저 해제 (1명은 1곳에만 배정)
    set({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId) {
          return {
            ...p,
            assignedResearchers: p.assignedResearchers.includes(researcherId)
              ? p.assignedResearchers
              : [...p.assignedResearchers, researcherId],
          };
        }
        return {
          ...p,
          assignedResearchers: p.assignedResearchers.filter(
            (id) => id !== researcherId
          ),
        };
      }),
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

  resetGame: () => set({ ...INITIAL_STATE, logs: [], stockHistory: [], researchers: [], pipelines: [] }),
}));
