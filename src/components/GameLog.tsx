"use client";

import { useRef, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

/**
 * GameLog 컴포넌트
 * - 역할: 게임 이벤트 로그를 시간순으로 표시
 */
export default function GameLog() {
  const logs = useGameStore((s) => s.logs);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 로그 추가 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const typeColors = {
    info: "text-foreground/50",
    success: "text-accent",
    danger: "text-danger",
    warning: "text-warning",
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-bold text-foreground/60 mb-3">이벤트 로그</h3>
      <div className="h-48 overflow-y-auto space-y-1 text-xs font-mono">
        {logs.map((log, i) => (
          <div key={i} className={typeColors[log.type]}>
            <span className="text-foreground/30 mr-2">[{log.turn}턴]</span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
