"use client";
import { useNetrunnerStore } from "./store/gameStore";
import TitleScreen from "./components/TitleScreen";
import MapScreen from "./components/MapScreen";
import CombatScreen from "./components/CombatScreen";
import RewardScreen from "./components/RewardScreen";
import EventScreen from "./components/EventScreen";
import ShopScreen from "./components/ShopScreen";
import GameOverScreen from "./components/GameOverScreen";
import VictoryScreen from "./components/VictoryScreen";

export default function NetrunnerGame() {
  const phase = useNetrunnerStore((s) => s.phase);
  const startGame = useNetrunnerStore((s) => s.startGame);

  return (
    <>
      {phase === "title" && <TitleScreen onStart={startGame} />}
      {phase === "map" && <MapScreen />}
      {phase === "combat" && <CombatScreen />}
      {phase === "reward" && <RewardScreen />}
      {phase === "event" && <EventScreen />}
      {phase === "shop" && <ShopScreen />}
      {phase === "gameover" && <GameOverScreen />}
      {phase === "victory" && <VictoryScreen />}
    </>
  );
}
