export type EnemyTypeId =
  | "grunt" | "runner" | "armored" | "drone"
  | "stealth" | "splitter" | "regenerator"
  | "boss_ice" | "boss_nexus" | "boss_megacorp";

export type EnemyTrait = "armored" | "fast" | "flying" | "regenerating" | "boss" | "stealth";

export interface EnemyDef {
  id: EnemyTypeId;
  name: string;         // Korean
  hp: number;
  speed: number;        // pixels per second
  reward: number;       // gold on kill
  leakDamage: number;   // lives lost on leak
  size: number;         // canvas draw radius
  color: string;        // hex
  armorType: import("./tower").DamageType | null;  // resistant type (50% dmg)
  isBoss: boolean;
  traits: EnemyTrait[];
  special: EnemySpecial | null;
}

export type EnemySpecial =
  | { type: "stealth"; revealRange: number }
  | { type: "split"; childId: EnemyTypeId; count: number }
  | { type: "regen"; hpPerSecond: number };

export interface EnemyStatusEffect {
  type: "slow" | "dot" | "stun" | "firewall";
  remainingMs: number;
  value: number;
}

export interface EnemyInstance {
  id: string;
  defId: EnemyTypeId;
  hp: number;
  maxHp: number;
  x: number;           // canvas pixel position
  y: number;
  pathIndex: number;   // current target waypoint index
  distanceTraveled: number;
  statusEffects: EnemyStatusEffect[];
  slowFactor: number;  // 1.0 = full speed
  isAlive: boolean;
}
