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
  {
    slug: "netrunner",
    title: "NETRUNNER",
    description: "사이버펑크 세계의 카드 덱빌딩 로그라이크. 넷러너가 되어 메가코프를 무너뜨려라.",
    tags: ["카드", "로그라이크", "전략"],
    emoji: "🃏",
    status: "active",
    difficulty: "높음",
    players: "1인",
    genre: "카드 로그라이크",
  },
  {
    slug: "tower-defense",
    title: "사이버 디펜스",
    description: "넷러너 세계관의 사이버펑크 타워 디펜스. 12종의 포탑으로 메가코프의 침공을 막아라. 웨이브를 클리어하고 로그라이크 강화를 선택하라.",
    tags: ["타워디펜스", "전략", "로그라이크"],
    emoji: "🏰",
    status: "active",
    difficulty: "보통",
    players: "1인",
    genre: "타워 디펜스",
  },
];
