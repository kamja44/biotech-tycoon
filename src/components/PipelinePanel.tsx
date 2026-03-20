"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import {
  CLINICAL_PHASES,
  DISEASE_CATEGORIES,
  DIFFICULTY_CONFIG,
  RESEARCHER_GRADES,
  DiseaseCategory,
} from "@/data/gameConfig";

/**
 * PipelinePanel 컴포넌트
 * - 역할: 현재 진행 중인 파이프라인 목록 표시 + 새 파이프라인 개시 모달
 * - 기능: 파이프라인 카드 클릭 시 연구원 배정/해제 가능
 */
export default function PipelinePanel() {
  const pipelines = useGameStore((s) => s.pipelines);
  const researchers = useGameStore((s) => s.researchers);
  const cash = useGameStore((s) => s.cash);
  const difficulty = useGameStore((s) => s.difficulty);
  const startPipeline = useGameStore((s) => s.startPipeline);
  const assignResearcher = useGameStore((s) => s.assignResearcher);
  const unassignResearcher = useGameStore((s) => s.unassignResearcher);
  const sellLicense = useGameStore((s) => s.sellLicense);

  // 새 파이프라인 개시 모달 상태
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<DiseaseCategory>("common");
  const [selectedResearchers, setSelectedResearchers] = useState<string[]>([]);

  // 펼쳐진 파이프라인 카드 ID (연구원 관리용)
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>(
    null
  );

  const handleStartPipeline = () => {
    if (!newName.trim()) return;
    startPipeline(newName.trim(), newCategory, selectedResearchers);
    setNewName("");
    setNewCategory("common");
    setSelectedResearchers([]);
    setShowNewForm(false);
  };

  const toggleResearcher = (id: string) => {
    setSelectedResearchers((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  /** 다른 파이프라인에 이미 배정된 연구원 ID 목록 */
  const getAssignedElsewhere = (currentPipelineId: string): Set<string> => {
    const assigned = new Set<string>();
    for (const p of pipelines) {
      if (p.id !== currentPipelineId) {
        for (const rId of p.assignedResearchers) {
          assigned.add(rId);
        }
      }
    }
    return assigned;
  };

  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const estimatedCost =
    CLINICAL_PHASES.preclinical.cost *
    DISEASE_CATEGORIES[newCategory].costMultiplier *
    diffConfig.clinicalCostMultiplier;

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground/60">
          파이프라인 ({pipelines.length})
        </h3>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-md
            hover:bg-primary/30 transition-colors cursor-pointer"
        >
          + 신규 개발
        </button>
      </div>

      {/* 파이프라인 목록 */}
      {pipelines.length === 0 ? (
        <p className="text-xs text-foreground/30 text-center py-8">
          진행 중인 파이프라인이 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {pipelines.map((pipeline) => {
            const phaseConfig = CLINICAL_PHASES[pipeline.currentPhase];
            const diseaseConfig =
              DISEASE_CATEGORIES[pipeline.diseaseCategory];
            const totalTurns = CLINICAL_PHASES[pipeline.currentPhase].turns;
            const progress =
              ((totalTurns - pipeline.turnsRemaining) / totalTurns) * 100;
            const canSellLicense =
              !pipeline.licensed &&
              (pipeline.currentPhase === "phase2" ||
                pipeline.currentPhase === "phase3");
            const isExpanded = expandedPipelineId === pipeline.id;
            const assignedElsewhere = getAssignedElsewhere(pipeline.id);

            return (
              <div
                key={pipeline.id}
                className="border border-card-border rounded-lg overflow-hidden"
              >
                {/* 카드 헤더 (클릭으로 펼치기/접기) */}
                <button
                  onClick={() =>
                    setExpandedPipelineId(isExpanded ? null : pipeline.id)
                  }
                  className="w-full p-3 text-left cursor-pointer hover:bg-card-border/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold">
                        {pipeline.name}
                      </span>
                      <span className="text-xs text-foreground/40 ml-2">
                        {diseaseConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-mono">
                        {phaseConfig.label}
                      </span>
                      <span className="text-xs text-foreground/30">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* 진행 바 */}
                  <div className="w-full bg-background rounded-full h-1.5 mb-2">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-foreground/40">
                    <span>잔여 {pipeline.turnsRemaining}턴</span>
                    <div className="flex items-center gap-2">
                      <span>
                        연구원 {pipeline.assignedResearchers.length}명
                      </span>
                      {pipeline.licensed && (
                        <span className="text-warning">라이선스 판매됨</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* 펼침 영역: 연구원 배정 관리 + 라이선스 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 border-t border-card-border pt-3">
                        {/* 배정된 연구원 */}
                        <p className="text-xs text-foreground/50 mb-2">
                          배정된 연구원
                        </p>
                        {pipeline.assignedResearchers.length === 0 ? (
                          <p className="text-xs text-foreground/30 mb-3">
                            배정된 연구원이 없습니다
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {pipeline.assignedResearchers.map((rId) => {
                              const r = researchers.find(
                                (res) => res.id === rId
                              );
                              if (!r) return null;
                              const grade = RESEARCHER_GRADES[r.grade];
                              const specialty = DISEASE_CATEGORIES[r.specialty];
                              const isMatch = r.specialty === pipeline.diseaseCategory;
                              return (
                                <span
                                  key={rId}
                                  className={`inline-flex items-center gap-1 text-xs border rounded-md px-2 py-1 ${
                                    isMatch
                                      ? "bg-accent/25 text-accent border-accent/50"
                                      : "bg-accent/15 text-accent border-accent/30"
                                  }`}
                                >
                                  {r.name}
                                  <span className="text-accent/50">
                                    {grade.label}
                                  </span>
                                  <span className={isMatch ? "text-accent" : "text-accent/40"}>
                                    · {specialty.label.split(" ")[0]}
                                    {isMatch && " ★"}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unassignResearcher(pipeline.id, rId);
                                    }}
                                    className="ml-0.5 text-accent/40 hover:text-danger transition-colors cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* 배정 가능한 연구원 */}
                        {researchers.filter(
                          (r) =>
                            !pipeline.assignedResearchers.includes(r.id)
                        ).length > 0 && (
                          <>
                            <p className="text-xs text-foreground/50 mb-2">
                              배정 가능한 연구원
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {researchers
                                .filter(
                                  (r) =>
                                    !pipeline.assignedResearchers.includes(
                                      r.id
                                    )
                                )
                                .map((r) => {
                                  const grade = RESEARCHER_GRADES[r.grade];
                                  const specialty = DISEASE_CATEGORIES[r.specialty];
                                  const isMatch = r.specialty === pipeline.diseaseCategory;
                                  const isElsewhere = assignedElsewhere.has(
                                    r.id
                                  );
                                  return (
                                    <button
                                      key={r.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        assignResearcher(pipeline.id, r.id);
                                      }}
                                      className={`inline-flex items-center gap-1 text-xs rounded-md px-2 py-1
                                        border transition-colors cursor-pointer ${
                                          isElsewhere
                                            ? "border-warning/30 text-warning/60 hover:border-warning hover:text-warning"
                                            : isMatch
                                              ? "border-accent/40 text-accent/70 hover:border-accent hover:text-accent"
                                              : "border-card-border text-foreground/50 hover:border-accent hover:text-accent"
                                        }`}
                                    >
                                      {isElsewhere ? "↪" : "+"} {r.name}
                                      <span className="opacity-50">
                                        {grade.label} · {specialty.label.split(" ")[0]}
                                        {isMatch && " ★"}
                                      </span>
                                      {isElsewhere && (
                                        <span className="text-warning/40 text-[10px]">
                                          다른 곳에서 이동
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </>
                        )}

                        {/* 라이선스 판매 버튼 */}
                        {canSellLicense && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sellLicense(pipeline.id);
                            }}
                            className="w-full text-xs py-1.5 border border-warning/30 text-warning rounded-md
                              hover:bg-warning/10 transition-colors cursor-pointer"
                          >
                            라이선스 판매
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* 새 파이프라인 모달 */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold mb-4">새 파이프라인 개시</h3>

              {/* 신약 이름 */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-1">
                  신약 이름
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: BT-001"
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2
                    text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* 질환 카테고리 */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-1">
                  타겟 질환
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(DISEASE_CATEGORIES) as [
                      DiseaseCategory,
                      (typeof DISEASE_CATEGORIES)[DiseaseCategory],
                    ][]
                  ).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setNewCategory(key)}
                      className={`text-xs p-2 rounded-lg border transition-colors cursor-pointer ${
                        newCategory === key
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-card-border text-foreground/50 hover:border-foreground/30"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연구원 배정 (선택사항) */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-1">
                  연구원 배정 (나중에도 가능)
                </label>
                {researchers.length === 0 ? (
                  <p className="text-xs text-foreground/30 py-2">
                    고용된 연구원이 없습니다 — 파이프라인 개시 후 배정할 수
                    있습니다
                  </p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {researchers.map((r) => {
                      const grade = RESEARCHER_GRADES[r.grade];
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleResearcher(r.id)}
                          className={`w-full text-left text-xs p-2 rounded-lg border transition-colors cursor-pointer ${
                            selectedResearchers.includes(r.id)
                              ? "border-accent bg-accent/20 text-accent"
                              : "border-card-border text-foreground/50 hover:border-foreground/30"
                          }`}
                        >
                          {r.name} ({grade.label})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 비용 & 버튼 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/40">
                  전임상 비용: {estimatedCost.toFixed(0)}억 (보유:{" "}
                  {cash.toLocaleString()}억)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="text-xs px-3 py-1.5 text-foreground/50 hover:text-foreground
                      transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleStartPipeline}
                    disabled={!newName.trim() || cash < estimatedCost}
                    className="text-xs px-4 py-1.5 bg-primary text-background rounded-lg
                      hover:bg-primary-dark transition-colors disabled:opacity-30
                      disabled:cursor-not-allowed cursor-pointer"
                  >
                    개시
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
