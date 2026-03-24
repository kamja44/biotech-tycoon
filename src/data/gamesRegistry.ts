export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  emoji: string;
  status: "active" | "coming-soon";
  difficulty: string;
  players: string;
  genre: string;
}

export const games: GameMeta[] = [
  {
    slug: "biotech-tycoon",
    title: "바이오테크 타이쿤",
    description:
      "바이오테크 기업의 CEO가 되어 신약을 개발하고 시가총액 1조를 달성하세요. 연구원을 고용하고 파이프라인을 관리하며 FDA 승인을 받아내세요.",
    tags: ["전략", "경영", "시뮬레이션"],
    emoji: "🧬",
    status: "active",
    difficulty: "보통",
    players: "1인",
    genre: "전략 경영",
  },
];
