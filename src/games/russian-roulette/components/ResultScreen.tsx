"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { resetToLobby } from "../firebase";
import type { Room } from "../types";

interface Props {
  room: Room;
  roomCode: string;
  myPlayerId: string;
  isHost: boolean;
}

export default function ResultScreen({ room, roomCode, myPlayerId, isHost }: Props) {
  const [resetting, setResetting] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const dead = room.deadPlayerId ? room.players[room.deadPlayerId] : null;
  const survivors = Object.values(room.players).filter((p) => p.isAlive);
  const amDead = room.deadPlayerId === myPlayerId;
  const shotNumber = room.currentChamberPos;

  // Dramatic reveal delay
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, []);

  async function handlePlayAgain() {
    setResetting(true);
    await resetToLobby(roomCode);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* Death announcement */}
      <div className={`text-center mb-10 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="text-8xl mb-4">
          {amDead ? "💀" : dead ? "🎉" : "🎰"}
        </div>
        <h1 className="text-3xl font-black mb-6">
          {amDead ? "당신이 죽었습니다" : "게임 종료"}
        </h1>

        {dead && (
          <div className="bg-gray-900 border border-red-900/60 rounded-2xl px-8 py-6">
            <p className="text-gray-600 text-xs tracking-wider uppercase mb-2">사망자</p>
            <p className="text-red-500 text-4xl font-black">{dead.name}</p>
            <p className="text-gray-600 text-sm mt-3">
              {shotNumber}번째 발에 맞음 (총 {room.chamberSize}칸 중)
            </p>
            <p className="text-gray-700 text-xs mt-1">
              확률: {((1 / room.chamberSize) * 100).toFixed(1)}% 였습니다
            </p>
          </div>
        )}
      </div>

      {/* Survivors */}
      {survivors.length > 0 && (
        <div className={`w-full max-w-sm mb-8 transition-all duration-700 delay-300 ${revealed ? "opacity-100" : "opacity-0"}`}>
          <p className="text-gray-600 text-xs text-center tracking-wider uppercase mb-3">
            생존자 ({survivors.length}명)
          </p>
          <div className="space-y-2">
            {survivors.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <span className="text-green-500 text-sm">✓</span>
                <span className="font-semibold flex-1">{p.name}</span>
                {p.id === myPlayerId && (
                  <span className="text-xs text-cyan-400">나</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`flex flex-col gap-3 w-full max-w-xs transition-all duration-700 delay-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={resetting}
            className="py-4 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-black text-lg rounded-xl transition-all hover:scale-105"
          >
            {resetting ? "재설정 중..." : "다시 하기"}
          </button>
        ) : (
          <p className="text-gray-600 text-sm text-center">방장이 다시 시작하길 기다리는 중...</p>
        )}
        <Link
          href="/"
          className="text-center py-3 text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          게임 목록으로
        </Link>
      </div>
    </div>
  );
}
