"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

/**
 * ActionPanel 컴포넌트
 * - 역할: 턴 넘기기, 유상증자 등 핵심 액션 버튼 모음
 */
export default function ActionPanel() {
  const nextTurn = useGameStore((s) => s.nextTurn);
  const conductEquityOffering = useGameStore((s) => s.conductEquityOffering);
  const equityOfferingCooldown = useGameStore((s) => s.equityOfferingCooldown);
  const marketCap = useGameStore((s) => s.marketCap);
  const trust = useGameStore((s) => s.trust);

  const [showEquityModal, setShowEquityModal] = useState(false);
  const [equityPercentage, setEquityPercentage] = useState(0.1);

  const estimatedRaise = Math.floor(marketCap * equityPercentage);
  const estimatedTrustLoss = Math.floor(equityPercentage * 66);

  const handleEquityOffering = () => {
    conductEquityOffering(equityPercentage);
    setShowEquityModal(false);
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-bold text-foreground/60 mb-3">경영 액션</h3>

      <div className="space-y-2">
        {/* 턴 넘기기 */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={nextTurn}
          className="w-full py-3 bg-primary text-background rounded-lg font-bold
            hover:bg-primary-dark transition-colors cursor-pointer"
        >
          다음 턴으로
        </motion.button>

        {/* 유상증자 */}
        <button
          onClick={() => setShowEquityModal(true)}
          disabled={equityOfferingCooldown > 0}
          className="w-full py-2 text-sm border border-warning/30 text-warning rounded-lg
            hover:bg-warning/10 transition-colors disabled:opacity-30
            disabled:cursor-not-allowed cursor-pointer"
        >
          {equityOfferingCooldown > 0
            ? `유상증자 (${equityOfferingCooldown}턴 후 가능)`
            : "유상증자"}
        </button>
      </div>

      {/* 유상증자 모달 */}
      <AnimatePresence>
        {showEquityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEquityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold mb-4">유상증자</h3>
              <p className="text-xs text-foreground/40 mb-4">
                시가총액의 일정 비율만큼 자금을 조달합니다. 주주 신뢰도가
                감소합니다.
              </p>

              {/* 비율 선택 */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-2">
                  조달 비율: {(equityPercentage * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={5}
                  value={equityPercentage * 100}
                  onChange={(e) =>
                    setEquityPercentage(Number(e.target.value) / 100)
                  }
                  className="w-full"
                />
              </div>

              {/* 예상 수치 */}
              <div className="bg-background rounded-lg p-3 mb-4 text-xs">
                <div className="flex justify-between mb-1 text-foreground/50">
                  <span>예상 조달액</span>
                  <span className="text-accent font-bold">
                    {estimatedRaise.toLocaleString()}억
                  </span>
                </div>
                <div className="flex justify-between text-foreground/50">
                  <span>신뢰도 감소</span>
                  <span className="text-danger font-bold">
                    -{estimatedTrustLoss} (현재: {trust})
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowEquityModal(false)}
                  className="text-xs px-3 py-1.5 text-foreground/50 hover:text-foreground
                    transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleEquityOffering}
                  className="text-xs px-4 py-1.5 bg-warning text-background rounded-lg
                    hover:bg-warning/80 transition-colors cursor-pointer"
                >
                  실행
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
