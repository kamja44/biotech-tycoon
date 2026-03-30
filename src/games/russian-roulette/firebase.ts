import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import app from "@/lib/firebase";
import type { Room, Player } from "./types";

const db = getFirestore(app);

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createRoom(playerName: string): Promise<{ roomCode: string; playerId: string }> {
  const roomCode = randomCode();
  const playerId = randomId();
  const name = playerName.trim() || "플레이어 1";

  const player: Player = { id: playerId, name, isAlive: true, isHost: true, joinedAt: Date.now() };

  const room: Room = {
    id: roomCode,
    status: "lobby",
    hostId: playerId,
    players: { [playerId]: player },
    playerOrder: [],
    bulletInputs: {},
    inputDeadline: null,
    chamberSize: 0,
    bulletPosition: 0,
    currentChamberPos: 0,
    currentTurnPlayerId: "",
    deadPlayerId: null,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "rooms", roomCode), room);
  return { roomCode, playerId };
}

export async function joinRoom(
  roomCode: string,
  playerName: string
): Promise<{ playerId: string } | { error: string }> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) return { error: "방을 찾을 수 없습니다." };

  const room = snap.data() as Room;
  if (room.status !== "lobby") return { error: "이미 게임이 시작된 방입니다." };

  const count = Object.keys(room.players).length;
  if (count >= 8) return { error: "방이 가득 찼습니다. (최대 8명)" };

  const playerId = randomId();
  const name = playerName.trim() || `플레이어 ${count + 1}`;
  const player: Player = { id: playerId, name, isAlive: true, isHost: false, joinedAt: Date.now() };

  await updateDoc(roomRef, { [`players.${playerId}`]: player });
  return { playerId };
}

export async function startInputPhase(roomCode: string): Promise<void> {
  await updateDoc(doc(db, "rooms", roomCode), {
    status: "input",
    inputDeadline: Date.now() + 10000,
    bulletInputs: {},
  });
}

export async function submitBulletCount(
  roomCode: string,
  playerId: string,
  count: number
): Promise<void> {
  const clamped = Math.max(2, Math.min(100, Math.floor(count)));
  await updateDoc(doc(db, "rooms", roomCode), {
    [`bulletInputs.${playerId}`]: clamped,
  });
}

export async function startRoulette(roomCode: string): Promise<void> {
  const snap = await getDoc(doc(db, "rooms", roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as Room;
  if (room.status !== "input") return; // guard against double-call

  // Fill missing inputs with default 10
  const filledInputs: Record<string, number> = {};
  Object.keys(room.players).forEach((pid) => {
    filledInputs[pid] = room.bulletInputs[pid] ?? 10;
  });

  const values = Object.values(filledInputs);
  const chamberSize = values[Math.floor(Math.random() * values.length)];

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "roulette",
    bulletInputs: filledInputs,
    chamberSize,
  });
}

export async function startGame(roomCode: string): Promise<void> {
  const snap = await getDoc(doc(db, "rooms", roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as Room;
  if (room.status !== "roulette") return; // guard against double-call

  const playerIds = Object.keys(room.players);
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const bulletPosition = Math.floor(Math.random() * room.chamberSize) + 1;

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "playing",
    playerOrder: shuffled,
    bulletPosition,
    currentChamberPos: 0,
    currentTurnPlayerId: shuffled[0],
    deadPlayerId: null,
  });
}

export async function shoot(
  roomCode: string,
  shooterPlayerId: string,
  targetPlayerId: string
): Promise<void> {
  const roomRef = doc(db, "rooms", roomCode);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as Room;

    if (room.status !== "playing") return;
    if (room.currentTurnPlayerId !== shooterPlayerId) return;
    if (!room.players[targetPlayerId]?.isAlive) return;

    const newPos = room.currentChamberPos + 1;
    const isHit = newPos === room.bulletPosition;

    if (isHit) {
      const updatedPlayers = { ...room.players };
      updatedPlayers[targetPlayerId] = { ...updatedPlayers[targetPlayerId], isAlive: false };

      tx.update(roomRef, {
        currentChamberPos: newPos,
        players: updatedPlayers,
        deadPlayerId: targetPlayerId,
        status: "finished",
      });
    } else {
      // Advance to next alive player clockwise
      const order = room.playerOrder;
      const currentIdx = order.indexOf(room.currentTurnPlayerId);
      let nextIdx = (currentIdx + 1) % order.length;
      let safety = 0;
      while (!room.players[order[nextIdx]]?.isAlive && safety < order.length) {
        nextIdx = (nextIdx + 1) % order.length;
        safety++;
      }

      tx.update(roomRef, {
        currentChamberPos: newPos,
        currentTurnPlayerId: order[nextIdx],
      });
    }
  });
}

export async function resetToLobby(roomCode: string): Promise<void> {
  const snap = await getDoc(doc(db, "rooms", roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as Room;

  const resetPlayers: Record<string, Player> = {};
  Object.entries(room.players).forEach(([pid, p]) => {
    resetPlayers[pid] = { ...p, isAlive: true };
  });

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "lobby",
    players: resetPlayers,
    playerOrder: [],
    bulletInputs: {},
    inputDeadline: null,
    chamberSize: 0,
    bulletPosition: 0,
    currentChamberPos: 0,
    currentTurnPlayerId: "",
    deadPlayerId: null,
  });
}

export function subscribeToRoom(
  roomCode: string,
  cb: (room: Room | null) => void
): () => void {
  return onSnapshot(doc(db, "rooms", roomCode), (snap) => {
    cb(snap.exists() ? (snap.data() as Room) : null);
  });
}
