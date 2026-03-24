import { games } from "@/data/gamesRegistry";
import GameCard from "@/components/platform/GameCard";

export default function LobbyPage() {
  return (
    <main className="flex-1">
      {/* 히어로 배너 */}
      <section className="relative overflow-hidden border-b border-card-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
            🎮 GameHub
          </h1>
          <p className="text-foreground/60 text-lg max-w-xl mx-auto">
            다양한 장르의 미니게임을 즐겨보세요.
            <br />
            전략, 경영, 퍼즐... 새 게임이 계속 추가됩니다!
          </p>
        </div>
      </section>

      {/* 게임 목록 */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            전체 게임{" "}
            <span className="text-sm font-normal text-foreground/40 ml-1">
              {games.length}개
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}

          {/* 더미 "곧 출시" 카드 */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-card-border bg-card-bg/50 min-h-[300px] gap-3 text-foreground/30">
            <span className="text-4xl">＋</span>
            <p className="text-sm">새 게임 준비 중</p>
          </div>
        </div>
      </section>
    </main>
  );
}
