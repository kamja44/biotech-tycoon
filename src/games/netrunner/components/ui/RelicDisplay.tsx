import { getRelicDef } from "../../data/relics";
import type { RelicInstance } from "../../store/gameStore";

interface Props { relics: RelicInstance[] }

export default function RelicDisplay({ relics }: Props) {
  if (relics.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {relics.map((r) => {
        const def = getRelicDef(r.id);
        if (!def) return null;
        return (
          <div key={r.id} title={`${def.name}: ${def.description}`}
            className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center text-lg cursor-help hover:border-yellow-400 transition-colors">
            {def.emoji}
          </div>
        );
      })}
    </div>
  );
}
