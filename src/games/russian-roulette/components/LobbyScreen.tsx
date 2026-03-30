"use client";
import { useState } from "react";
import Link from "next/link";
import { createRoom, joinRoom } from "../firebase";

interface Props {
  onJoin: (roomCode: string, playerId: string) => void;
}

export default function LobbyScreen({ onJoin }: Props) {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const { roomCode, playerId } = await createRoom(name);
      onJoin(roomCode, playerId);
    } catch {
      setError("방 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) { setError("방 코드를 입력하세요."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await joinRoom(code, name);
      if ("error" in result) {
        setError(result.error);
      } else {
        onJoin(code.trim().toUpperCase(), result.playerId);
      }
    } catch {
      setError("입장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      <Link
        href="/"
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
      >
        ← 게임 목록
      </Link>

      {/* Title */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">🔫</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-widest text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
          RUSSIAN ROULETTE
        </h1>
        <p className="text-gray-600 mt-2 text-sm tracking-widest">운명의 방아쇠를 당겨라</p>
      </div>

      {mode === "menu" && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode("create")}
            className="py-4 bg-red-800 hover:bg-red-700 text-white font-black text-lg rounded-xl transition-all hover:scale-105 border border-red-700"
          >
            방 만들기
          </button>
          <button
            onClick={() => setMode("join")}
            className="py-4 bg-gray-800 hover:bg-gray-700 text-white font-black text-lg rounded-xl transition-all hover:scale-105 border border-gray-700"
          >
            방 입장
          </button>
        </div>
      )}

      {(mode === "create" || mode === "join") && (
        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            placeholder="닉네임 (비워두면 자동 지정)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors"
          />

          {mode === "join" && (
            <input
              type="text"
              placeholder="방 코드 입력"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 font-mono text-center text-2xl tracking-[0.4em] transition-colors"
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={mode === "create" ? handleCreate : handleJoin}
            disabled={loading}
            className="w-full py-4 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-black text-lg rounded-xl transition-all"
          >
            {loading ? "처리 중..." : mode === "create" ? "방 만들기" : "입장하기"}
          </button>

          <button
            onClick={() => { setMode("menu"); setError(""); }}
            className="w-full py-2 text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
