"use client";
import { useEffect, useState, useRef } from "react";
import { startGame } from "../firebase";
import type { Room } from "../types";

interface Props {
  room: Room;
  roomCode: string;
  isHost: boolean;
}

export default function RouletteScreen({ room, roomCode, isHost }: Props) {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const gameStartedRef = useRef(false);

  const values = Object.values(room.bulletInputs);
  const target = room.chamberSize;

  // Slot machine spin animation
  useEffect(() => {
    if (values.length === 0) return;

    let idx = 0;
    let elapsed = 0;
    const totalDuration = 3200;

    const tick = (speed: number) => {
      if (elapsed >= totalDuration) {
        setDisplayValue(target);
        setDone(true);
        return;
      }

      idx = (idx + 1) % values.length;
      setDisplayValue(values[idx]);
      elapsed += speed;

      const nextSpeed =
        elapsed > totalDuration * 0.7 ? 250 :
        elapsed > totalDuration * 0.4 ? 120 :
        60;

      setTimeout(() => tick(nextSpeed), nextSpeed);
    };

    setTimeout(() => tick(60), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Host triggers game start after animation + display pause
  useEffect(() => {
    if (!done || !isHost || gameStartedRef.current) return;
    gameStartedRef.current = true;
    const timer = setTimeout(() => startGame(roomCode), 2500);
    return () => clearTimeout(timer);
  }, [done, isHost, roomCode]);

  const playerList = Object.entries(room.bulletInputs).map(([pid, val]) => ({
    name: room.players[pid]?.name ?? "?",
    val,
  }));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎰</div>
        <h2 className="text-2xl font-black text-white">돌림판</h2>
        <p className="text-gray-600 text-sm mt-1">실제 총알 칸 수를 결정합니다</p>
      </div>

      {/* Submitted values badges */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-sm">
        {playerList.map((p, i) => (
          <span
            key={i}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-all duration-300 ${
              done && p.val === target
                ? "bg-red-900/60 border-red-600 text-red-300 scale-110"
                : "bg-gray-900 border-gray-700 text-gray-400"
            }`}
          >
            {p.name}: <strong>{p.val}</strong>
          </span>
        ))}
      </div>

      {/* Spinning number display */}
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className={`text-[7rem] md:text-[9rem] font-black tabular-nums leading-none transition-colors duration-300 ${
            done
              ? "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]"
              : "text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
          }`}
          style={{ minWidth: "220px", textAlign: "center" }}
        >
          {displayValue ?? "?"}
        </div>
      </div>

      {done ? (
        <div className="text-center space-y-2">
          <p className="text-red-400 text-xl font-bold">
            {target}칸 중 실탄 1발
          </p>
          <p className="text-gray-600 text-sm animate-pulse">게임을 시작합니다...</p>
        </div>
      ) : (
        <p className="text-gray-600 text-sm animate-pulse">돌림판이 돌아가는 중...</p>
      )}
    </div>
  );
}
