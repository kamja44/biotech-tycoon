export type TowerTypeId =
  | "basic" | "sniper" | "area" | "slow"
  | "chain" | "poison" | "shield" | "firewall"
  | "pulse" | "laser" | "emp" | "overload";

export type DamageType = "physical" | "energy" | "poison" | "emp";

export type TowerTag = "single" | "aoe" | "slow" | "dot" | "support" | "sniper";

export interface TowerSpecialSlow { type: "slow"; factor: number; duration: number }
export interface TowerSpecialAoe { type: "aoe"; radius: number }
export interface TowerSpecialChain { type: "chain"; bounces: number; damageFalloff: number }
export interface TowerSpecialDot { type: "dot"; dps: number; duration: number }
export interface TowerSpecialShield { type: "shield"; absorbAmount: number; cooldown: number }
export interface TowerSpecialFirewall { type: "firewall"; slowFactor: number; dotDps: number }
export interface TowerSpecialPulse { type: "pulse"; interval: number; aoeRadius: number }
export interface TowerSpecialLaser { type: "laser"; pierceCount: number }
export interface TowerSpecialEmp { type: "emp"; stunDuration: number; cooldown: number }
export interface TowerSpecialOverload { type: "overload"; burstDamage: number; chargeTime: number }

export type TowerSpecial =
  | TowerSpecialSlow | TowerSpecialAoe | TowerSpecialChain | TowerSpecialDot
  | TowerSpecialShield | TowerSpecialFirewall | TowerSpecialPulse | TowerSpecialLaser
  | TowerSpecialEmp | TowerSpecialOverload;

export interface TowerUpgradeLevel {
  cost: number;
  label: string;         // Korean label e.g. "오버클럭 MK2"
  damageMult: number;
  rangeMult: number;
  fireRateMult: number;
  specialOverride?: Partial<TowerSpecial>;
}

export interface TowerDef {
  id: TowerTypeId;
  name: string;          // Korean name
  description: string;   // Korean description
  emoji: string;         // display icon
  cost: number;
  tags: TowerTag[];
  range: number;         // pixels
  fireRate: number;      // shots per second
  damage: number;
  damageType: DamageType;
  projectileSpeed: number;
  special: TowerSpecial | null;
  upgrades: [TowerUpgradeLevel, TowerUpgradeLevel]; // levels 2 and 3
  color: string;         // canvas hex
  accentColor: string;
}

export interface TowerInstance {
  id: string;
  defId: TowerTypeId;
  gridX: number;
  gridY: number;
  level: 1 | 2 | 3;
  lastFireTime: number;  // performance.now() ms
  targetId: string | null;
  specialState: Record<string, number>; // e.g. { chargeStart: 1234 }
}

// For Zustand persistence (save/restore)
export interface PlacedTowerSave {
  id: string;
  defId: TowerTypeId;
  gridX: number;
  gridY: number;
  level: 1 | 2 | 3;
}
