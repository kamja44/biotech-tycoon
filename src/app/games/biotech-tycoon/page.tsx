"use client";

import TitleScreen from "@/components/TitleScreen";
import Dashboard from "@/components/Dashboard";
import GameOverScreen from "@/components/GameOverScreen";
import VictoryScreen from "@/components/VictoryScreen";
import NotificationToast from "@/components/NotificationToast";
import { useGameStore } from "@/store/gameStore";

export default function BiotechTycoonPage() {
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <>
      <NotificationToast />
      {phase === "title" && <TitleScreen onStart={startGame} />}
      {phase === "gameover" && <GameOverScreen onRestart={resetGame} />}
      {phase === "victory" && <VictoryScreen onRestart={resetGame} />}
      {phase === "playing" && <Dashboard />}
    </>
  );
}
