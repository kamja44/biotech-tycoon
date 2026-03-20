"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

interface VictoryScreenProps {
  onRestart: () => void;
}

export default function VictoryScreen({ onRestart }: VictoryScreenProps) {
  const turn = useGameStore((s) => s.turn);
  const cash = useGameStore((s) => s.cash);
  const marketCap = useGameStore((s) => s.marketCap);
  const approvedDrugs = useGameStore((s) => s.approvedDrugs);
  const difficulty = useGameStore((s) => s.difficulty);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl md:text-7xl font-bold text-accent mb-4"
        >
          VICTORY!
        </motion.h1>
        <p className="text-foreground/50 mb-8">
          {turn}턴 만에 승리했습니다! ({difficulty.toUpperCase()})
        </p>
        <div className="flex gap-8 justify-center mb-12 text-sm text-foreground/40">
          <div>
            <p className="text-accent text-lg font-bold">
              {cash.toLocaleString()}억
            </p>
            <p>최종 자본금</p>
          </div>
          <div>
            <p className="text-accent text-lg font-bold">
              {marketCap.toLocaleString()}억
            </p>
            <p>최종 시가총액</p>
          </div>
          <div>
            <p className="text-accent text-lg font-bold">{approvedDrugs}개</p>
            <p>승인 신약</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="px-8 py-3 bg-accent/20 border border-accent rounded-lg
            text-accent hover:bg-accent/30 transition-colors cursor-pointer"
        >
          다시 도전
        </motion.button>
      </motion.div>
    </div>
  );
}
