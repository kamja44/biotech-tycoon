"use client";
import { useNetrunnerStore } from "../store/gameStore";
import { getCardDef } from "../data/cards";
import CardComponent from "./ui/CardComponent";

const REMOVE_COST = 75;

function getCardPrice(rarity: string): number {
  if (rarity === "rare") return 150;
  if (rarity === "uncommon") return 75;
  return 40;
}

export default function ShopScreen() {
  const player = useNetrunnerStore((s) => s.player);
  const shopCards = useNetrunnerStore((s) => s.shopCards);
  const enterMap = useNetrunnerStore((s) => s.enterMap);
  const buyCard = useNetrunnerStore((s) => s.buyCard);
  const removeCardFromDeck = useNetrunnerStore((s) => s.removeCardFromDeck);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
        <h2 className="text-green-400 font-black text-xl">🏪 상점</h2>
        <div className="text-yellow-400 font-mono">💰 {player.gold}G</div>
      </div>

      <div className="flex flex-1 gap-8 p-8">
        {/* 카드 구매 */}
        <div className="flex-1">
          <h3 className="text-gray-300 font-bold mb-4">카드 구매</h3>
          <div className="flex gap-6 flex-wrap">
            {shopCards.map((cardId) => {
              const def = getCardDef(cardId);
              const price = getCardPrice(def.rarity);
              const canAfford = player.gold >= price;
              return (
                <div key={cardId} className="flex flex-col items-center gap-2">
                  <CardComponent
                    card={{ id: cardId, upgraded: false }}
                    index={0}
                    isSelected={false}
                    isPlayable={canAfford}
                    onClick={() => canAfford && buyCard(cardId, price)}
                  />
                  <button
                    onClick={() => canAfford && buyCard(cardId, price)}
                    disabled={!canAfford}
                    className={`text-sm font-bold px-3 py-1 rounded-lg transition-all
                      ${canAfford ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
                  >
                    {price}G
                  </button>
                </div>
              );
            })}
            {shopCards.length === 0 && (
              <p className="text-gray-600">품절</p>
            )}
          </div>
        </div>

        {/* 카드 제거 */}
        <div className="w-72">
          <h3 className="text-gray-300 font-bold mb-1">카드 제거</h3>
          <p className="text-gray-500 text-xs mb-4">덱에서 카드 1장 제거 — {REMOVE_COST}G</p>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {player.deck.map((card, i) => {
              const def = getCardDef(card.id);
              const canAfford = player.gold >= REMOVE_COST;
              return (
                <button
                  key={i}
                  onClick={() => canAfford && removeCardFromDeck(i)}
                  disabled={!canAfford}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all
                    ${canAfford ? "border-red-800 bg-red-950/40 hover:bg-red-900/40 text-white" : "border-gray-700 bg-gray-800/40 text-gray-500 cursor-not-allowed"}`}
                >
                  <span className="font-bold">{def.name}</span>
                  {card.upgraded && <span className="text-yellow-400 ml-1">★</span>}
                  <span className="text-gray-500 text-xs ml-2">{def.rarity}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 나가기 */}
      <div className="flex justify-center pb-8">
        <button
          onClick={enterMap}
          className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
        >
          상점 떠나기
        </button>
      </div>
    </div>
  );
}
