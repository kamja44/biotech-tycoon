import type { DamageType, TowerSpecial } from "./tower";

export type ProjectileVisualType =
  | "basic"       // capsule bullet
  | "sniper"      // thin beam line
  | "area"        // bomb + fuse spark
  | "slow"        // diamond shard
  | "chain"       // electric orb + rotating spikes
  | "poison"      // wobbly blob
  | "laser"       // thick beam line
  | "emp"         // orb + dashed expanding rings
  | "overload";   // large pulsing orb + rotating arcs

export interface Projectile {
  id: string;
  towerId: string;
  targetEnemyId: string;
  x: number;
  y: number;
  originX: number;      // tower center x at fire time (for beam effects)
  originY: number;      // tower center y at fire time
  speed: number;        // pixels per second
  damage: number;
  damageType: DamageType;
  special: TowerSpecial | null;
  isAlive: boolean;
  color: string;
  visualType: ProjectileVisualType;
}
