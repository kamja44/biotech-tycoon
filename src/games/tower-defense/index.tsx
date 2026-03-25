"use client";
import { useTDStore } from "./store/gameStore";
import TitleScreen from "./components/TitleScreen";
import MapSelectScreen from "./components/MapSelectScreen";
import GameScreen from "./components/GameScreen";
import UpgradeModal from "./components/UpgradeModal";
import GameOverScreen from "./components/GameOverScreen";
import VictoryScreen from "./components/VictoryScreen";

export default function TowerDefenseGame() {
  const phase = useTDStore((s) => s.phase);

  return (
    <>
      {phase === "title" && <TitleScreen />}
      {phase === "map_select" && <MapSelectScreen />}
      {(phase === "playing" || phase === "wave_reward" || phase === "paused") && <GameScreen />}
      {phase === "gameover" && <GameOverScreen />}
      {phase === "victory" && <VictoryScreen />}
    </>
  );
}
