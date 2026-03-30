"use client";
import { useState } from "react";
import { shoot } from "../firebase";
import type { Room } from "../types";

interface Props {
  room: Room;
  roomCode: string;
  myPlayerId: string;
}

const MAX_CHAMBER_DOTS = 30;

export default function GameScreen({ room, roomCode, myPlayerId }: Props) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);
  const [flash, setFlash] = useState(false);

  const isMyTurn = room.currentTurnPlayerId === myPlayerId;
  const shotsFired = room.currentChamberPos;
  const chamberSize = room.chamberSize;
  const currentPlayer = room.players[room.currentTurnPlayerId];

  async function handleShoot() {
    if (!selectedTarget || !isMyTurn || shooting) return;
    setShooting(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    try {
      await shoot(roomCode, myPlayerId, selectedTarget);
      setSelectedTarget(null);
    } finally {
      setShooting(false);
    }
  }

  // Chamber visualization — cap dots to avoid overflow
  const showDots = chamberSize <= MAX_CHAMBER_DOTS;

  return (
    <div className={`min-h-screen bg-gray-950 flex flex-col text-white transition-colors duration-200 ${flash ? "bg-red-950" : ""}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-900">
        <span className="text-gray-600 text-xs font-mono">{roomCode}</span>
        <div className="text-center">
          <span className="text-gray-400 text-sm font-bold">{shotsFired}</span>
          <span className="text-gray-700 text-xs"> / {chamberSize} 발</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Chamber visualization */}
      <div className="flex justify-center px-4 py-4">
        {showDots ? (
          <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
            {Array.from({ length: chamberSize }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border transition-all ${
                  i < shotsFired
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-600 border-gray-500"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full transition-all duration-500"
                style={{ width: `${(shotsFired / chamberSize) * 100}%` }}
              />
            </div>
            <p className="text-gray-600 text-xs text-center mt-1">
              {chamberSize - shotsFired}칸 남음
            </p>
          </div>
        )}
      </div>

      {/* Turn indicator */}
      <div className="text-center px-4 mb-4">
        {isMyTurn ? (
          <div className="inline-block bg-red-950/60 border border-red-800 rounded-2xl px-6 py-3">
            <p className="text-red-400 font-black text-xl">내 차례</p>
            <p className="text-gray-500 text-xs mt-0.5">대상을 선택하고 방아쇠를 당기세요</p>
          </div>
        ) : (
          <div className="inline-block bg-gray-900 border border-gray-800 rounded-2xl px-6 py-3">
            <p className="text-gray-300 font-semibold text-lg">
              <span className="text-yellow-400">{currentPlayer?.name ?? "?"}</span>의 차례
            </p>
            <p className="text-gray-700 text-xs mt-0.5">대상 선택 중...</p>
          </div>
        )}
      </div>

      {/* Player grid */}
      <div className="flex-1 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {room.playerOrder.map((pid) => {
            const p = room.players[pid];
            if (!p) return null;
            const isMe = pid === myPlayerId;
            const isCurrentTurn = pid === room.currentTurnPlayerId;
            const isSelected = selectedTarget === pid;
            const canSelect = isMyTurn && p.isAlive;

            return (
              <button
                key={pid}
                onClick={() => canSelect && setSelectedTarget(isSelected ? null : pid)}
                disabled={!canSelect}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  !p.isAlive
                    ? "opacity-30 bg-gray-900/30 border-gray-800 cursor-not-allowed"
                    : isSelected
                    ? "bg-red-950/70 border-red-500 scale-[1.03] shadow-lg shadow-red-900/40"
                    : isCurrentTurn
                    ? "bg-yellow-950/40 border-yellow-700"
                    : canSelect
                    ? "bg-gray-900 border-gray-700 hover:border-gray-500 active:scale-95"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                {isCurrentTurn && (
                  <span className="absolute top-2 right-2 text-[10px] bg-yellow-600 text-black px-1.5 py-0.5 rounded font-black">
                    차례
                  </span>
                )}
                <div className="text-3xl mb-2">{p.isAlive ? "😐" : "💀"}</div>
                <p className="font-bold text-sm leading-tight truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {isMe && (
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded-full border border-cyan-900">나</span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] text-red-400 font-bold animate-pulse">목표</span>
                  )}
                  {!p.isAlive && (
                    <span className="text-[10px] text-gray-600">사망</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shoot button — only visible on my turn */}
      {isMyTurn && (
        <div className="sticky bottom-0 bg-gray-950/95 backdrop-blur border-t border-gray-900 px-4 py-5 text-center">
          <button
            onClick={handleShoot}
            disabled={!selectedTarget || shooting}
            className={`px-14 py-4 font-black text-2xl rounded-2xl transition-all ${
              selectedTarget && !shooting
                ? "bg-red-700 hover:bg-red-600 text-white hover:scale-105 shadow-lg shadow-red-900/50 active:scale-95"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {shooting ? "💥 탕!" : "🔫 방아쇠"}
          </button>
          {!selectedTarget && (
            <p className="text-gray-700 text-xs mt-2">대상을 먼저 선택하세요</p>
          )}
        </div>
      )}
    </div>
  );
}
