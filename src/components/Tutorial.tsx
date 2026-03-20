"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "게임 목표",
    description:
      "당신은 신생 바이오테크 기업의 CEO입니다.\n시가총액 1조 원을 달성하거나, FDA 승인 신약 3개를 배출하면 승리합니다.\n자본금이 고갈되거나 주가가 너무 오래 떨어지면 게임 오버!",
    icon: "🎯",
  },
  {
    title: "1단계: 연구원 고용",
    description:
      "게임이 시작되면 먼저 연구원을 고용하세요.\n등급이 높을수록 월급이 비싸지만, 임상 성공률을 올려줍니다.\n같은 질환 분야 전문가 3명을 모으면 시너지 보너스(+5%)도 받을 수 있어요.",
    icon: "👨‍🔬",
  },
  {
    title: "2단계: 파이프라인 개시",
    description:
      "신약 개발 프로젝트(파이프라인)를 시작하세요.\n제네릭은 안전하지만 주가 영향이 작고,\n혁신 항암제는 위험하지만 성공하면 주가가 폭등합니다.\n연구원을 배정하면 성공률과 속도가 올라갑니다.",
    icon: "🧬",
  },
  {
    title: "3단계: 턴 진행",
    description:
      "'다음 턴으로' 버튼을 누르면 1개월이 지나갑니다.\n매 턴 연구원 월급이 자동으로 빠져나가고,\n파이프라인이 진행됩니다.\n임상 단계가 끝나면 확률에 따라 성공 또는 실패가 결정됩니다!",
    icon: "⏩",
  },
  {
    title: "임상 단계",
    description:
      "전임상 → 1상 → 2상 → 3상 → FDA 승인\n단계가 올라갈수록 비용과 시간이 늘어나고 성공률은 낮아집니다.\n하지만 성공 시 주가 상승폭은 점점 커집니다.\n임상 중에는 기대감으로 주가가 서서히 오릅니다.",
    icon: "🔬",
  },
  {
    title: "유상증자 & 라이선스",
    description:
      "자금이 부족하면 유상증자로 자금을 조달할 수 있습니다.\n단, 주주 신뢰도가 깎이고 6턴 쿨다운이 생깁니다.\n\n임상 2상 이후에는 대형 제약사에 기술 라이선스를 판매할 수 있습니다.\n즉시 현금을 확보하지만, 개발은 계속 진행됩니다.\n대신 이후 임상 성공 시 주가 상승 효과가 50%로 줄어듭니다.\n(권리 일부를 넘기는 것이지, 파이프라인이 사라지는 것이 아닙니다!)",
    icon: "💰",
  },
  {
    title: "핵심 전략 팁",
    description:
      "• 파이프라인 없이 연구원만 고용하면 주가가 하락합니다\n• 주가가 높을 때 유상증자를 하면 더 많은 자금을 확보할 수 있습니다\n• 여러 파이프라인을 동시에 돌려 리스크를 분산하세요\n• 신뢰도가 너무 낮으면 주가 방어가 어려워집니다",
    icon: "💡",
  },
];

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  // 현재 보고 있는 튜토리얼 단계
  const [step, setStep] = useState(0);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card-bg border border-card-border rounded-2xl w-full max-w-lg overflow-hidden"
      >
        {/* 상단 진행 바 */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-card-border"
              }`}
            />
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-4xl mb-4">{current.icon}</div>
              <h3 className="text-xl font-bold mb-3">{current.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-line">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex items-center justify-between p-4 pt-0">
          <span className="text-xs text-foreground/30">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm px-4 py-2 text-foreground/50 hover:text-foreground
                  transition-colors cursor-pointer"
              >
                이전
              </button>
            )}
            {isFirst && (
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 text-foreground/30 hover:text-foreground/50
                  transition-colors cursor-pointer"
              >
                건너뛰기
              </button>
            )}
            {isLast ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="text-sm px-6 py-2 bg-primary text-background rounded-lg
                  hover:bg-primary-dark transition-colors cursor-pointer font-bold"
              >
                게임 시작하기
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep((s) => s + 1)}
                className="text-sm px-6 py-2 bg-primary text-background rounded-lg
                  hover:bg-primary-dark transition-colors cursor-pointer"
              >
                다음
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
