"use client";
import { useState, useEffect, useRef } from "react";
import { submitBulletCount, startRoulette } from "../firebase";
import type { Room } from "../types";

interface Props {
  room: Room;
  roomCode: string;
  myPlayerId: string;
}

export default function InputScreen({ room, roomCode, myPlayerId }: Props) {
  const [value, setValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const isHost = room.hostId === myPlayerId;
  const myInput = room.bulletInputs[myPlayerId];
  const defaultSubmittedRef = useRef(false);
  const rouletteStartedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (!room.inputDeadline) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((room.inputDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [room.inputDeadline]);

  // When timer expires: submit default if not submitted, then host starts roulette
  useEffect(() => {
    if (timeLeft > 0 || room.status !== "input") return;

    // Submit default 10 if player hasn't submitted
    if (myInput === undefined && !defaultSubmittedRef.current) {
      defaultSubmittedRef.current = true;
      submitBulletCount(roomCode, myPlayerId, 10);
    }

    // Host advances to roulette phase after a short grace period
    if (isHost && !rouletteStartedRef.current) {
      rouletteStartedRef.current = true;
      const timer = setTimeout(() => startRoulette(roomCode), 800);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, room.status, myInput, isHost, roomCode, myPlayerId]);

  async function handleSubmit() {
    const num = parseInt(value);
    if (isNaN(num) || num < 2) return;
    await submitBulletCount(roomCode, myPlayerId, num);
  }

  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const submittedCount = Object.keys(room.bulletInputs).length;
  const isExpired = timeLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white">총알 칸 수 입력</h2>
        <p className="text-gray-600 text-sm mt-1">
          돌림판이 여러분의 숫자 중 하나를 선택합니다
        </p>
      </div>

      {/* Countdown */}
      <div
        className={`text-9xl font-black mb-8 tabular-nums transition-colors duration-300 ${
          timeLeft <= 3 ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" : "text-white"
        }`}
      >
        {timeLeft}
      </div>

      {/* Input or submitted state */}
      {myInput === undefined && !isExpired ? (
        <div className="w-full max-w-xs space-y-3 mb-8">
          <input
            type="number"
            min={2}
            max={100}
            placeholder="칸 수 입력 (2~100)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center text-3xl font-black placeholder-gray-700 focus:outline-none focus:border-red-600 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!value || parseInt(value) < 2}
            className="w-full py-4 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white font-black text-lg rounded-xl transition-all"
          >
            확인
          </button>
          <p className="text-gray-700 text-xs text-center">
            입력하지 않으면 10으로 자동 설정됩니다
          </p>
        </div>
      ) : (
        <div className="text-center mb-8">
          <div className="text-6xl font-black text-red-500 mb-2">
            {myInput ?? 10}
          </div>
          <p className="text-green-500 text-sm font-semibold">
            {myInput !== undefined ? "제출 완료" : "기본값(10) 적용됨"}
          </p>
        </div>
      )}

      {/* Players submission status */}
      <div className="w-full max-w-sm">
        <p className="text-gray-600 text-xs text-center mb-3">
          {submittedCount} / {players.length}명 제출 완료
        </p>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => {
            const submitted = room.bulletInputs[p.id] !== undefined;
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    submitted ? "bg-green-500" : "bg-gray-700"
                  }`}
                />
                <span className="text-sm flex-1 truncate">{p.name}</span>
                <span className={`text-xs ${submitted ? "text-gray-500" : "text-gray-700"}`}>
                  {submitted ? "완료" : "..."}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
