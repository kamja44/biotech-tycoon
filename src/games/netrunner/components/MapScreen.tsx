"use client";
import Link from "next/link";
import { useNetrunnerStore } from "../store/gameStore";
import { getAvailableNodes } from "../data/map";
import type { MapNode } from "../data/map";

const NODE_STYLE: Record<string, { emoji: string; bg: string; border: string }> = {
  combat:  { emoji: "⚔️",  bg: "bg-gray-800",   border: "border-gray-500" },
  event:   { emoji: "❓",  bg: "bg-blue-950",   border: "border-blue-500" },
  shop:    { emoji: "🏪",  bg: "bg-green-950",  border: "border-green-500" },
  elite:   { emoji: "💀",  bg: "bg-red-950",    border: "border-red-500" },
  boss:    { emoji: "🔥",  bg: "bg-orange-950", border: "border-orange-500" },
};

export default function MapScreen() {
  const map = useNetrunnerStore((s) => s.currentMap);
  const currentNodeId = useNetrunnerStore((s) => s.currentNodeId);
  const run = useNetrunnerStore((s) => s.run);
  const player = useNetrunnerStore((s) => s.player);
  const selectNode = useNetrunnerStore((s) => s.selectNode);

  if (!map) return null;

  const available = getAvailableNodes(map, currentNodeId);

  // Group nodes by row, sorted descending (boss at top)
  const rows = map.rows;
  const nodesByRow: Record<number, MapNode[]> = {};
  for (const n of map.nodes) {
    if (!nodesByRow[n.row]) nodesByRow[n.row] = [];
    nodesByRow[n.row].push(n);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            ← 홈
          </Link>
          <div className="text-cyan-400 font-mono text-sm">ACT {run.act} — 층 선택</div>
        </div>
        <div className="flex gap-4 text-sm font-mono">
          <span className="text-red-400">❤️ {player.hp}/{player.maxHp}</span>
          <span className="text-yellow-400">💰 {player.gold}G</span>
        </div>
      </div>

      {/* 맵 */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {Array.from({ length: rows }, (_, i) => rows - 1 - i).map((row) => {
            const rowNodes = nodesByRow[row] ?? [];
            return (
              <div key={row} className="flex justify-center gap-3">
                {rowNodes.map((node) => {
                  const style = NODE_STYLE[node.type];
                  const isAvailable = available.includes(node.id);
                  const isCurrent = node.id === currentNodeId;
                  const isVisited = node.visited;

                  return (
                    <button
                      key={node.id}
                      onClick={() => isAvailable && selectNode(node.id)}
                      disabled={!isAvailable}
                      className={`
                        w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center
                        text-xl transition-all duration-200
                        ${style.bg} ${style.border}
                        ${isCurrent ? "ring-2 ring-white scale-110" : ""}
                        ${isAvailable ? "hover:scale-110 hover:ring-2 hover:ring-cyan-400 cursor-pointer" : "opacity-30 cursor-not-allowed"}
                        ${isVisited && !isCurrent ? "opacity-50" : ""}
                      `}
                    >
                      {node.type === "boss" && isCurrent ? "🏁" : style.emoji}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
          {Object.entries(NODE_STYLE).map(([type, s]) => (
            <span key={type}>{s.emoji} {type}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
