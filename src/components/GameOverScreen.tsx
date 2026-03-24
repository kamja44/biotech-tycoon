"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useGameStore } from "@/store/gameStore";

interface GameOverScreenProps {
  onRestart: () => void;
}

export default function GameOverScreen({ onRestart }: GameOverScreenProps) {
  const turn = useGameStore((s) => s.turn);
  const cash = useGameStore((s) => s.cash);
  const marketCap = useGameStore((s) => s.marketCap);
  const approvedDrugs = useGameStore((s) => s.approvedDrugs);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-danger mb-4">
          GAME OVER
        </h1>
        <p className="text-foreground/50 mb-8">
          {turn}턴 동안 버텼습니다
        </p>
        <div className="flex gap-8 justify-center mb-12 text-sm text-foreground/40">
          <div>
            <p className="text-foreground/60 text-lg font-bold">
              {cash.toLocaleString()}억
            </p>
            <p>최종 자본금</p>
          </div>
          <div>
            <p className="text-foreground/60 text-lg font-bold">
              {marketCap.toLocaleString()}억
            </p>
            <p>최종 시가총액</p>
          </div>
          <div>
            <p className="text-foreground/60 text-lg font-bold">
              {approvedDrugs}개
            </p>
            <p>승인 신약</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="px-8 py-3 bg-card-bg border border-card-border rounded-lg
              text-foreground hover:bg-card-border transition-colors cursor-pointer"
          >
            다시 시작
          </motion.button>
          <Link
            href="/"
            className="px-8 py-3 bg-transparent border border-foreground/20 rounded-lg
              text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors text-sm"
          >
            게임 목록으로
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
