import { getCardDef } from "../../data/cards";
import type { CardInstance } from "../../store/gameStore";

interface Props {
  card: CardInstance;
  index: number;
  isSelected: boolean;
  isPlayable: boolean;
  onClick: (index: number) => void;
}

const RARITY_STYLE: Record<string, string> = {
  common: "border-gray-500 bg-gray-800/90",
  uncommon: "border-blue-500 bg-blue-950/90",
  rare: "border-purple-500 bg-purple-950/90",
};

const TYPE_EMOJI: Record<string, string> = {
  attack: "⚔️",
  skill: "🔧",
  power: "✨",
};

export default function CardComponent({ card, index, isSelected, isPlayable, onClick }: Props) {
  const def = getCardDef(card.id);
  const rarityStyle = RARITY_STYLE[def.rarity];

  return (
    <button
      onClick={() => onClick(index)}
      className={`
        relative w-28 h-40 rounded-xl border-2 p-2 text-left
        flex flex-col gap-1 transition-all duration-200 cursor-pointer
        ${rarityStyle}
        ${isSelected ? "-translate-y-8 ring-2 ring-white shadow-lg shadow-white/20" : "hover:-translate-y-3"}
        ${!isPlayable ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {/* 코스트 */}
      <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-cyan-600 border-2 border-cyan-300
        flex items-center justify-center text-white font-bold text-sm shadow-md">
        {def.cost}
      </div>

      {/* 타입 */}
      <div className="text-right text-xs">{TYPE_EMOJI[def.type]}</div>

      {/* 이름 */}
      <p className="text-white font-bold text-xs leading-tight mt-1">{def.name}</p>
      {card.upgraded && <span className="text-yellow-400 text-xs">★</span>}

      {/* 구분선 */}
      <div className="border-t border-gray-600 my-1" />

      {/* 설명 */}
      <p className="text-gray-300 text-xs leading-tight flex-1">
        {def.description(card.upgraded)}
      </p>

      {/* 등급 */}
      <p className="text-xs text-gray-500 capitalize">{def.rarity}</p>
    </button>
  );
}
