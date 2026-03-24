import type { StatusEffect } from "../../store/gameStore";

const STATUS_META: Record<string, { emoji: string; label: string; color: string }> = {
  bleed: { emoji: "🔴", label: "출혈", color: "bg-red-900/60 text-red-300" },
  shock: { emoji: "⚡", label: "감전", color: "bg-yellow-900/60 text-yellow-300" },
  lock: { emoji: "🔒", label: "잠금", color: "bg-gray-700/60 text-gray-300" },
  overload: { emoji: "💀", label: "과부하", color: "bg-purple-900/60 text-purple-300" },
  dodge: { emoji: "✨", label: "회피", color: "bg-cyan-900/60 text-cyan-300" },
};

interface Props {
  effects: StatusEffect[];
}

export default function StatusBadge({ effects }: Props) {
  if (effects.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {effects.map((e) => {
        const meta = STATUS_META[e.id];
        return (
          <span key={e.id} className={`text-xs px-1.5 py-0.5 rounded font-mono ${meta.color}`}>
            {meta.emoji} {meta.label} {e.stacks}
          </span>
        );
      })}
    </div>
  );
}
