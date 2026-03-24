import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card-bg/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">🎮</span>
          <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
            GameHub
          </span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground hover:bg-card-border rounded-lg transition-colors"
          >
            게임 목록
          </Link>
        </nav>
      </div>
    </header>
  );
}
