import type { DamageType, TowerSpecial } from "./tower";

export interface Projectile {
  id: string;
  towerId: string;
  targetEnemyId: string;
  x: number;
  y: number;
  speed: number;        // pixels per second
  damage: number;
  damageType: DamageType;
  special: TowerSpecial | null;
  isAlive: boolean;
  color: string;
}
