"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import {
  RESEARCHER_GRADES,
  DISEASE_CATEGORIES,
  ResearcherGrade,
  DiseaseCategory,
} from "@/data/gameConfig";

/** 랜덤 연구원 이름 풀 */
const NAMES = [
  "김민수",
  "이서연",
  "박준형",
  "최예린",
  "정도현",
  "강수민",
  "윤하나",
  "임재혁",
  "한소율",
  "조민기",
  "오지훈",
  "신유진",
  "류현우",
  "배다은",
  "송태양",
];

/**
 * ResearcherPanel 컴포넌트
 * - 역할: 연구원 목록 표시 + 고용/해고 기능
 */
export default function ResearcherPanel() {
  const researchers = useGameStore((s) => s.researchers);
  const cash = useGameStore((s) => s.cash);
  const hireResearcher = useGameStore((s) => s.hireResearcher);
  const fireResearcher = useGameStore((s) => s.fireResearcher);

  const [showHireForm, setShowHireForm] = useState(false);
  const [hireGrade, setHireGrade] = useState<ResearcherGrade>("junior");
  const [hireSpecialty, setHireSpecialty] =
    useState<DiseaseCategory>("common");

  const gradeConfig = RESEARCHER_GRADES[hireGrade];
  const hiringCost = gradeConfig.salary * 3;

  const handleHire = () => {
    const usedNames = new Set(researchers.map((r) => r.name));
    const availableNames = NAMES.filter((n) => !usedNames.has(n));
    const name =
      availableNames[Math.floor(Math.random() * availableNames.length)] ||
      `연구원-${Date.now() % 1000}`;

    hireResearcher({
      name,
      grade: hireGrade,
      specialty: hireSpecialty,
    });
    setShowHireForm(false);
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground/60">
          연구팀 ({researchers.length})
        </h3>
        <button
          onClick={() => setShowHireForm(true)}
          className="text-xs px-3 py-1 bg-accent/20 text-accent rounded-md
            hover:bg-accent/30 transition-colors cursor-pointer"
        >
          + 고용
        </button>
      </div>

      {/* 연구원 목록 */}
      {researchers.length === 0 ? (
        <p className="text-xs text-foreground/30 text-center py-4">
          고용된 연구원이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {researchers.map((r) => {
            const grade = RESEARCHER_GRADES[r.grade];
            const specialty = DISEASE_CATEGORIES[r.specialty];
            return (
              <div
                key={r.id}
                className="flex items-center justify-between border border-card-border rounded-lg px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-foreground/40 ml-2">
                    {grade.label}
                  </span>
                  <span className="text-xs text-foreground/30 ml-1">
                    · {specialty.label}
                  </span>
                  {r.experience > 0 && (
                    <span className="text-xs text-accent ml-1">
                      Exp.{r.experience}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground/40 font-mono">
                    {grade.salary}억/턴
                  </span>
                  <button
                    onClick={() => fireResearcher(r.id)}
                    className="text-xs text-danger/60 hover:text-danger transition-colors cursor-pointer"
                  >
                    해고
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 고용 모달 */}
      <AnimatePresence>
        {showHireForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHireForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold mb-4">연구원 고용</h3>

              {/* 등급 선택 */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-1">
                  등급
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    Object.entries(RESEARCHER_GRADES) as [
                      ResearcherGrade,
                      (typeof RESEARCHER_GRADES)[ResearcherGrade],
                    ][]
                  ).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setHireGrade(key)}
                      className={`text-xs p-2 rounded-lg border transition-colors cursor-pointer ${
                        hireGrade === key
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-card-border text-foreground/50 hover:border-foreground/30"
                      }`}
                    >
                      <div className="font-bold">{config.label}</div>
                      <div className="text-foreground/30 mt-0.5">
                        {config.salary}억/턴
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 전문 분야 선택 */}
              <div className="mb-4">
                <label className="text-xs text-foreground/50 block mb-1">
                  전문 분야
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
                      onClick={() => setHireSpecialty(key)}
                      className={`text-xs p-2 rounded-lg border transition-colors cursor-pointer ${
                        hireSpecialty === key
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-card-border text-foreground/50 hover:border-foreground/30"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 스탯 요약 */}
              <div className="bg-background rounded-lg p-3 mb-4 text-xs text-foreground/50">
                <div className="flex justify-between mb-1">
                  <span>성공률 보정</span>
                  <span className="text-accent">
                    +{(gradeConfig.successBonus * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>속도 단축</span>
                  <span>
                    {gradeConfig.speedBonus > 0
                      ? `-${gradeConfig.speedBonus}턴`
                      : "없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>계약금 (3개월)</span>
                  <span className="text-warning">{hiringCost}억</span>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/40">
                  보유: {cash.toLocaleString()}억
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHireForm(false)}
                    className="text-xs px-3 py-1.5 text-foreground/50 hover:text-foreground
                      transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleHire}
                    disabled={cash < hiringCost}
                    className="text-xs px-4 py-1.5 bg-accent text-background rounded-lg
                      hover:bg-accent/80 transition-colors disabled:opacity-30
                      disabled:cursor-not-allowed cursor-pointer"
                  >
                    고용 ({hiringCost}억)
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
