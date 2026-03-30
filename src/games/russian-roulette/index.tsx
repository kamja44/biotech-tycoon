"use client";
import { useState, useEffect } from "react";
import { subscribeToRoom } from "./firebase";
import type { Room } from "./types";
import LobbyScreen from "./components/LobbyScreen";
import RoomScreen from "./components/RoomScreen";
import InputScreen from "./components/InputScreen";
import RouletteScreen from "./components/RouletteScreen";
import GameScreen from "./components/GameScreen";
import ResultScreen from "./components/ResultScreen";

export default function RussianRouletteGame() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, (r) => setRoom(r));
    return unsub;
  }, [roomCode]);

  const handleJoin = (code: string, playerId: string) => {
    setRoomCode(code);
    setMyPlayerId(playerId);
  };

  if (!roomCode || !myPlayerId) {
    return <LobbyScreen onJoin={handleJoin} />;
  }

  if (room === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 animate-pulse">연결 중...</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">방을 찾을 수 없습니다.</p>
        <button
          onClick={() => { setRoomCode(null); setMyPlayerId(null); setRoom(undefined); }}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  const isHost = room.hostId === myPlayerId;

  switch (room.status) {
    case "lobby":
      return <RoomScreen room={room} roomCode={roomCode} myPlayerId={myPlayerId} isHost={isHost} />;
    case "input":
      return <InputScreen room={room} roomCode={roomCode} myPlayerId={myPlayerId} />;
    case "roulette":
      return <RouletteScreen room={room} roomCode={roomCode} isHost={isHost} />;
    case "playing":
      return <GameScreen room={room} roomCode={roomCode} myPlayerId={myPlayerId} />;
    case "finished":
      return <ResultScreen room={room} roomCode={roomCode} myPlayerId={myPlayerId} isHost={isHost} />;
    default:
      return null;
  }
}
