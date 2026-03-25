export interface Waypoint {
  x: number; // grid units
  y: number;
}

export type CellType = "path" | "buildable" | "scenery" | "blocked";

export type BackgroundTheme = "neon_city" | "corp_server" | "underground" | "orbital";

export interface MapDef {
  id: string;
  name: string;        // Korean
  description: string; // Korean
  gridWidth: number;   // 20
  gridHeight: number;  // 14
  cellSize: number;    // pixels per cell (48)
  path: Waypoint[];    // ordered waypoints in grid coords
  blockedCells: Waypoint[];
  startingLives: number;
  startingGold: number;
  backgroundTheme: BackgroundTheme;
  unlockRequirement: string | null; // null = always unlocked
}
