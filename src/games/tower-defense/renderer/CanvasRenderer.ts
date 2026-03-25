import type { TowerInstance } from "../types/tower";
import type { EnemyInstance } from "../types/enemy";
import type { Projectile } from "../types/projectile";
import type { MapDef } from "../types/map";
import type { RunModifiers } from "../types/roguelike";
import { TOWER_DEFS } from "../data/towers";
import { ENEMY_DEFS } from "../data/enemies";
import { getEffectiveRange } from "../engine/combat";

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mapDef: MapDef,
  towers: Map<string, TowerInstance>,
  enemies: Map<string, EnemyInstance>,
  projectiles: Map<string, Projectile>,
  hoveredCell: { gridX: number; gridY: number } | null,
  selectedTowerDefId: string | null,
  runMods: RunModifiers
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(ctx, canvas, mapDef);
  drawGrid(ctx, mapDef);
  drawPath(ctx, mapDef);
  drawBlockedCells(ctx, mapDef);

  // Range preview for hovered placement
  if (hoveredCell && selectedTowerDefId) {
    drawPlacementPreview(ctx, mapDef, hoveredCell, selectedTowerDefId, runMods);
  }

  // Tower range on hover (if no new tower selected)
  for (const tower of towers.values()) {
    drawTower(ctx, tower, mapDef);
  }

  // Show range for hovered existing tower
  if (hoveredCell && !selectedTowerDefId) {
    const hoveredTower = findTowerAt(towers, hoveredCell.gridX, hoveredCell.gridY);
    if (hoveredTower) {
      drawRangeCircle(ctx, hoveredTower, mapDef, runMods, "rgba(255,255,255,0.15)");
    }
  }

  for (const enemy of enemies.values()) {
    if (enemy.isAlive) drawEnemy(ctx, enemy, mapDef);
  }

  for (const proj of projectiles.values()) {
    if (proj.isAlive) drawProjectile(ctx, proj);
  }

  drawHoveredCell(ctx, mapDef, hoveredCell, selectedTowerDefId, towers);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mapDef: MapDef
): void {
  ctx.fillStyle = "#0a0f1c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid(ctx: CanvasRenderingContext2D, mapDef: MapDef): void {
  const { gridWidth, gridHeight, cellSize } = mapDef;
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= gridWidth; x++) {
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, gridHeight * cellSize);
  }
  for (let y = 0; y <= gridHeight; y++) {
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(gridWidth * cellSize, y * cellSize);
  }
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, mapDef: MapDef): void {
  const { path, cellSize } = mapDef;
  if (path.length < 2) return;

  // Fill path cells
  ctx.fillStyle = "#1e3a4c";
  for (let i = 0; i < path.length; i++) {
    const wp = path[i];
    if (i === 0 || i === path.length - 1) {
      ctx.fillStyle = "#0d4a5c";
    } else {
      ctx.fillStyle = "#1e3a4c";
    }

    // Fill a corridor around each waypoint
    const px = wp.x * cellSize;
    const py = wp.y * cellSize;
    ctx.fillRect(px, py, cellSize, cellSize);

    // Fill between consecutive waypoints
    if (i < path.length - 1) {
      const next = path[i + 1];
      const minX = Math.min(wp.x, next.x);
      const maxX = Math.max(wp.x, next.x);
      const minY = Math.min(wp.y, next.y);
      const maxY = Math.max(wp.y, next.y);
      ctx.fillStyle = "#1e3a4c";
      ctx.fillRect(minX * cellSize, minY * cellSize, (maxX - minX + 1) * cellSize, (maxY - minY + 1) * cellSize);
    }
  }

  // Draw path line
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const first = path[0];
  ctx.moveTo(first.x * cellSize + cellSize / 2, first.y * cellSize + cellSize / 2);
  for (let i = 1; i < path.length; i++) {
    const wp = path[i];
    ctx.lineTo(wp.x * cellSize + cellSize / 2, wp.y * cellSize + cellSize / 2);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Entry arrow
  const entry = path[0];
  ctx.fillStyle = "#06b6d4";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("▶", entry.x * cellSize + cellSize / 2, entry.y * cellSize + cellSize / 2);

  // Exit marker
  const exit = path[path.length - 1];
  ctx.fillStyle = "#ef4444";
  ctx.fillText("◼", exit.x * cellSize + cellSize / 2, exit.y * cellSize + cellSize / 2);
}

function drawBlockedCells(ctx: CanvasRenderingContext2D, mapDef: MapDef): void {
  const { blockedCells, cellSize } = mapDef;
  ctx.fillStyle = "#0f172a";
  for (const cell of blockedCells) {
    ctx.fillRect(cell.x * cellSize + 1, cell.y * cellSize + 1, cellSize - 2, cellSize - 2);
    // Draw X
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cell.x * cellSize + 4, cell.y * cellSize + 4);
    ctx.lineTo(cell.x * cellSize + cellSize - 4, cell.y * cellSize + cellSize - 4);
    ctx.moveTo(cell.x * cellSize + cellSize - 4, cell.y * cellSize + 4);
    ctx.lineTo(cell.x * cellSize + 4, cell.y * cellSize + cellSize - 4);
    ctx.stroke();
  }
}

function drawTower(
  ctx: CanvasRenderingContext2D,
  tower: TowerInstance,
  mapDef: MapDef
): void {
  const def = TOWER_DEFS[tower.defId];
  const { cellSize } = mapDef;
  const cx = tower.gridX * cellSize + cellSize / 2;
  const cy = tower.gridY * cellSize + cellSize / 2;
  const r = cellSize * 0.38;

  // Tower base
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Upgrade indicator dots
  if (tower.level >= 2) {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(cx + r - 4, cy - r + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tower.level >= 3) {
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(cx - r + 4, cy - r + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tower icon (first letter of name)
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.floor(cellSize * 0.28)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.name[0], cx, cy);
}

function drawRangeCircle(
  ctx: CanvasRenderingContext2D,
  tower: TowerInstance,
  mapDef: MapDef,
  runMods: RunModifiers,
  color: string
): void {
  const def = TOWER_DEFS[tower.defId];
  const { cellSize } = mapDef;
  const cx = tower.gridX * cellSize + cellSize / 2;
  const cy = tower.gridY * cellSize + cellSize / 2;
  const range = getEffectiveRange(def, runMods);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlacementPreview(
  ctx: CanvasRenderingContext2D,
  mapDef: MapDef,
  cell: { gridX: number; gridY: number },
  defId: string,
  runMods: RunModifiers
): void {
  const { cellSize } = mapDef;
  const def = TOWER_DEFS[defId as keyof typeof TOWER_DEFS];
  if (!def) return;

  const cx = cell.gridX * cellSize + cellSize / 2;
  const cy = cell.gridY * cellSize + cellSize / 2;
  const range = getEffectiveRange(def, runMods);

  // Range circle
  ctx.strokeStyle = "rgba(6,182,212,0.5)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ghost tower
  ctx.fillStyle = "rgba(6,182,212,0.3)";
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyInstance,
  mapDef: MapDef
): void {
  const def = ENEMY_DEFS[enemy.defId];
  const r = def.size;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(enemy.x + 2, enemy.y + 3, r, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  let color = def.color;
  // Slow = blue tint overlay
  const isSlow = enemy.statusEffects.some((e) => e.type === "slow" || e.type === "firewall");
  // Poison = green tint
  const isPoisoned = enemy.statusEffects.some((e) => e.type === "dot");

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
  ctx.fill();

  if (isSlow) {
    ctx.fillStyle = "rgba(14,165,233,0.35)";
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (isPoisoned) {
    ctx.fillStyle = "rgba(132,204,22,0.35)";
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stun = yellow ring
  const isStunned = enemy.statusEffects.some((e) => e.type === "stun");
  if (isStunned) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Boss crown
  if (def.isBoss) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // HP bar
  const barW = r * 2.2;
  const barH = 4;
  const barX = enemy.x - barW / 2;
  const barY = enemy.y - r - 8;
  const hpRatio = enemy.hp / enemy.maxHp;

  ctx.fillStyle = "#1f2937";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = hpRatio > 0.5 ? "#10b981" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";
  ctx.fillRect(barX, barY, barW * hpRatio, barH);
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile): void {
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Glow effect
  ctx.fillStyle = proj.color + "66";
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawHoveredCell(
  ctx: CanvasRenderingContext2D,
  mapDef: MapDef,
  hoveredCell: { gridX: number; gridY: number } | null,
  selectedTowerDefId: string | null,
  towers: Map<string, TowerInstance>
): void {
  if (!hoveredCell) return;
  const { gridX, gridY } = hoveredCell;
  const { cellSize } = mapDef;

  // Check if buildable
  const isOnPath = isPathCell(mapDef, gridX, gridY);
  const isBlocked = mapDef.blockedCells.some((c) => c.x === gridX && c.y === gridY);
  const hasTower = findTowerAt(towers, gridX, gridY) !== null;

  const color = isOnPath || isBlocked || hasTower
    ? "rgba(239,68,68,0.25)"
    : "rgba(6,182,212,0.15)";

  ctx.fillStyle = color;
  ctx.fillRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);

  ctx.strokeStyle = isOnPath || isBlocked || hasTower
    ? "rgba(239,68,68,0.6)"
    : "rgba(6,182,212,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);
}

function isPathCell(mapDef: MapDef, gridX: number, gridY: number): boolean {
  const { path } = mapDef;
  for (let i = 0; i < path.length; i++) {
    const wp = path[i];
    if (i < path.length - 1) {
      const next = path[i + 1];
      const minX = Math.min(wp.x, next.x);
      const maxX = Math.max(wp.x, next.x);
      const minY = Math.min(wp.y, next.y);
      const maxY = Math.max(wp.y, next.y);
      if (gridX >= minX && gridX <= maxX && gridY >= minY && gridY <= maxY) return true;
    } else {
      if (wp.x === gridX && wp.y === gridY) return true;
    }
  }
  return false;
}

function findTowerAt(
  towers: Map<string, TowerInstance>,
  gridX: number,
  gridY: number
): TowerInstance | null {
  for (const tower of towers.values()) {
    if (tower.gridX === gridX && tower.gridY === gridY) return tower;
  }
  return null;
}
