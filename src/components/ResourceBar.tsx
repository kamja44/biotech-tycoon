"use client";

import { useGameStore } from "@/store/gameStore";
import { DIFFICULTY_CONFIG } from "@/data/gameConfig";

/**
 * ResourceBar 컴포넌트
 * - 역할: 상단에 핵심 자원(턴, 자본금, 주가, 신뢰도, 시가총액)을 한 줄로 표시
 */
export default function ResourceBar() {
  const turn = useGameStore((s) => s.turn);
  const cash = useGameStore((s) => s.cash);
  const stockPrice = useGameStore((s) => s.stockPrice);
  const trust = useGameStore((s) => s.trust);
  const marketCap = useGameStore((s) => s.marketCap);
  const approvedDrugs = useGameStore((s) => s.approvedDrugs);
  const difficulty = useGameStore((s) => s.difficulty);

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="bg-card-bg border-b border-card-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {/* 턴 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">턴</span>
          <span className="font-mono font-bold">{turn}</span>
        </div>

        <div className="w-px h-4 bg-card-border" />

        {/* 자본금 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">자본금</span>
          <span
            className={`font-mono font-bold ${cash < 500 ? "text-danger" : "text-foreground"}`}
          >
            {cash.toLocaleString()}억
          </span>
        </div>

        <div className="w-px h-4 bg-card-border" />

        {/* 주가 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">주가</span>
          <span
            className={`font-mono font-bold ${
              stockPrice <= config.delistingThreshold
                ? "text-danger"
                : "text-foreground"
            }`}
          >
            {stockPrice.toLocaleString()}원
          </span>
        </div>

        <div className="w-px h-4 bg-card-border" />

        {/* 시가총액 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">시가총액</span>
          <span className="font-mono font-bold text-primary">
            {marketCap.toLocaleString()}억
          </span>
        </div>

        <div className="w-px h-4 bg-card-border" />

        {/* 신뢰도 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">신뢰도</span>
          <span
            className={`font-mono font-bold ${
              trust < 30
                ? "text-danger"
                : trust < 60
                  ? "text-warning"
                  : "text-accent"
            }`}
          >
            {trust}
          </span>
        </div>

        <div className="w-px h-4 bg-card-border" />

        {/* 승인 신약 */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/40">FDA 승인</span>
          <span className="font-mono font-bold">{approvedDrugs}/3</span>
        </div>
      </div>
    </div>
  );
}
