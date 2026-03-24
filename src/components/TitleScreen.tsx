"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Tutorial from "./Tutorial";
import type { Difficulty } from "@/data/gameConfig";

interface DifficultyOption {
  key: Difficulty;
  label: string;
  capital: string;
  description: string;
  color: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    key: "easy",
    label: "이지",
    capital: "500억",
    description: "입문자용 · 호재 빈도 높음 · 느슨한 상장폐지 기준",
    color: "border-accent text-accent",
  },
  {
    key: "normal",
    label: "노멀",
    capital: "300억",
    description: "표준 플레이 · 기본 설정 · 보통 상장폐지 기준",
    color: "border-primary text-primary",
  },
  {
    key: "hard",
    label: "하드",
    capital: "150억",
    description: "극한 모드 · 악재 빈도 높음 · 엄격한 상장폐지 기준",
    color: "border-danger text-danger",
  },
];

interface TitleScreenProps {
  onStart: (difficulty: Difficulty) => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  // 튜토리얼 모달 열림 상태
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      {/* 타이틀 */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-primary mb-4 tracking-tight">
          BIOTECH TYCOON
        </h1>
        <p className="text-xl md:text-2xl text-foreground/60 font-light">
          Phase 3
        </p>
        <p className="text-sm text-foreground/40 mt-4 max-w-md mx-auto">
          신생 바이오테크 기업의 CEO가 되어 신약을 개발하고
          <br />
          시가총액 1조 원을 달성하세요
        </p>
      </motion.div>

      {/* 튜토리얼 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowTutorial(true)}
          className="w-full border-2 border-dashed border-foreground/20 bg-card-bg rounded-xl p-5
            hover:border-primary hover:bg-card-border transition-colors cursor-pointer text-center"
        >
          <span className="text-lg font-bold text-foreground/70 block mb-1">
            처음이신가요?
          </span>
          <span className="text-sm text-foreground/40">
            게임 방법을 알려드립니다 — 튜토리얼 시작하기
          </span>
        </motion.button>
      </motion.div>

      {/* 난이도 선택 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <p className="text-center text-foreground/50 text-sm mb-6">
          난이도를 선택하세요
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DIFFICULTIES.map((diff, index) => (
            <motion.button
              key={diff.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStart(diff.key)}
              className={`border-2 ${diff.color} bg-card-bg rounded-xl p-6 text-left
                hover:bg-card-border transition-colors cursor-pointer`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-lg font-bold">{diff.label}</span>
                <span className="text-xs text-foreground/50">
                  초기 자본 {diff.capital}
                </span>
              </div>
              <p className="text-xs text-foreground/40 leading-relaxed">
                {diff.description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 하단 정보 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="flex items-center gap-4 mt-16"
      >
        <p className="text-foreground/20 text-xs">v0.1.0 · Open Source Project</p>
        <span className="text-foreground/20 text-xs">·</span>
        <Link
          href="/"
          className="text-foreground/30 text-xs hover:text-foreground/60 transition-colors"
        >
          ← 게임 목록으로
        </Link>
      </motion.div>

      {/* 튜토리얼 모달 */}
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onClose={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
