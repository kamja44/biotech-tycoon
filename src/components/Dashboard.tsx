"use client";

import ResourceBar from "./ResourceBar";
import StockChart from "./StockChart";
import PipelinePanel from "./PipelinePanel";
import ResearcherPanel from "./ResearcherPanel";
import ActionPanel from "./ActionPanel";
import GameLog from "./GameLog";

/**
 * Dashboard 컴포넌트
 * - 역할: 게임 메인 화면. 모든 게임 UI를 레이아웃으로 조합
 * - 구조:
 *   - ResourceBar: 상단 자원 바
 *   - 좌측: 주가 차트 + 파이프라인 + 연구원
 *   - 우측: 액션 패널 + 게임 로그
 */
export default function Dashboard() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 상단 자원 바 */}
      <ResourceBar />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 좌측 2칸: 차트 + 파이프라인 + 연구원 */}
          <div className="lg:col-span-2 space-y-4">
            <StockChart />
            <PipelinePanel />
            <ResearcherPanel />
          </div>

          {/* 우측 1칸: 액션 + 로그 */}
          <div className="space-y-4">
            <ActionPanel />
            <GameLog />
          </div>
        </div>
      </div>
    </div>
  );
}
