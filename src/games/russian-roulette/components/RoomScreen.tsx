"use client";
import { useState } from "react";
import { startInputPhase } from "../firebase";
import type { Room } from "../types";

interface Props {
  room: Room;
  roomCode: string;
  myPlayerId: string;
  isHost: boolean;
}

export default function RoomScreen({ room, roomCode, myPlayerId, isHost }: Props) {
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const playerCount = players.length;

  async function handleStart() {
    setStarting(true);
    await startInputPhase(roomCode);
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* Room code */}
      <div className="text-center mb-8">
        <p className="text-gray-600 text-xs tracking-widest uppercase mb-2">방 코드</p>
        <button
          onClick={handleCopy}
          className="font-mono text-5xl font-black text-red-500 tracking-[0.35em] bg-gray-900 px-8 py-4 rounded-2xl border border-red-900/60 hover:border-red-600 transition-colors active:scale-95"
        >
          {roomCode}
        </button>
        <p className="text-gray-700 text-xs mt-2">
          {copied ? "✓ 복사됨" : "탭하면 복사"}
        </p>
      </div>

      {/* Player list */}
      <div className="w-full max-w-sm mb-8">
        <p className="text-gray-600 text-xs text-center mb-3 tracking-wider">
          {playerCount} / 8명 대기 중
        </p>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
            >
              <span className="text-gray-700 text-sm w-5 text-right">{i + 1}</span>
              <span className="flex-1 font-semibold truncate">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.id === myPlayerId && (
                  <span className="text-xs text-cyan-500 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-900">나</span>
                )}
                {p.isHost && (
                  <span className="text-xs text-yellow-500 bg-yellow-950/50 px-2 py-0.5 rounded-full border border-yellow-900">방장</span>
                )}
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 8 - playerCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 bg-gray-900/30 border border-gray-800/40 rounded-xl px-4 py-3"
            >
              <span className="text-gray-800 text-sm w-5 text-right">{playerCount + i + 1}</span>
              <span className="text-gray-800 text-sm">대기 중...</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="text-center space-y-2">
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-12 py-4 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xl rounded-xl transition-all hover:scale-105"
          >
            {starting ? "시작 중..." : "게임 시작"}
          </button>
          {playerCount < 2 && (
            <p className="text-gray-700 text-xs">혼자서도 시작할 수 있습니다</p>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">방장이 게임을 시작하길 기다리는 중...</p>
      )}
    </div>
  );
}
