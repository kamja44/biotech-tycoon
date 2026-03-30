export type RoomStatus = "lobby" | "input" | "roulette" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface Room {
  id: string;
  status: RoomStatus;
  hostId: string;
  players: Record<string, Player>;
  playerOrder: string[];       // randomized turn order
  bulletInputs: Record<string, number>; // each player's submitted chamber size
  inputDeadline: number | null; // unix ms
  chamberSize: number;         // chosen by roulette
  bulletPosition: number;      // 1-indexed, which pull fires the bullet
  currentChamberPos: number;   // how many times the trigger has been pulled
  currentTurnPlayerId: string;
  deadPlayerId: string | null;
  createdAt: number;
}
