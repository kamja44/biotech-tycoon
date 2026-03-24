import Link from "next/link";
import type { GameMeta } from "@/data/gamesRegistry";

export default function GameCard({ game }: { game: GameMeta }) {
  const isActive = game.status === "active";

  return (
    <div className="group relative flex flex-col rounded-xl border border-card-border bg-card-bg overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {/* 썸네일 */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-b border-card-border">
        <span className="text-7xl select-none">{game.emoji}</span>
        {!isActive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground/70 border border-foreground/20 rounded-full px-3 py-1">
              준비 중
            </span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* 제목 + 배지 */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-base text-foreground leading-tight">
            {game.title}
          </h2>
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {game.genre}
          </span>
        </div>

        {/* 설명 */}
        <p className="text-sm text-foreground/60 line-clamp-2 leading-relaxed">
          {game.description}
        </p>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 text-xs text-foreground/50">
          <span className="flex items-center gap-1">
            <span>👤</span> {game.players}
          </span>
          <span className="flex items-center gap-1">
            <span>⚡</span> 난이도: {game.difficulty}
          </span>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-md bg-card-bg text-foreground/50 border border-card-border"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 플레이 버튼 */}
        <div className="mt-auto pt-2">
          {isActive ? (
            <Link
              href={`/games/${game.slug}`}
              className="block w-full text-center py-2.5 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              플레이하기 →
            </Link>
          ) : (
            <button
              disabled
              className="block w-full text-center py-2.5 rounded-lg bg-card-bg text-foreground/30 text-sm font-semibold cursor-not-allowed"
            >
              준비 중...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
