"use client";

import TitleScreen from "@/components/TitleScreen";
import Dashboard from "@/components/Dashboard";
import GameOverScreen from "@/components/GameOverScreen";
import VictoryScreen from "@/components/VictoryScreen";
import { useGameStore } from "@/store/gameStore";

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  if (phase === "title") {
    return <TitleScreen onStart={startGame} />;
  }

  if (phase === "gameover") {
    return <GameOverScreen onRestart={resetGame} />;
  }

  if (phase === "victory") {
    return <VictoryScreen onRestart={resetGame} />;
  }

  return <Dashboard />;
}
