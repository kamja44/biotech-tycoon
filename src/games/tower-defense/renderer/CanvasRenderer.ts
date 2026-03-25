import type { TowerInstance, TowerDef } from "../types/tower";
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
  runMods: RunModifiers,
  gameTime = 0
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
    drawTower(ctx, tower, mapDef, gameTime);
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
    if (proj.isAlive) drawProjectile(ctx, proj, gameTime);
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
  mapDef: MapDef,
  gameTime: number
): void {
  const def = TOWER_DEFS[tower.defId];
  const { cellSize } = mapDef;
  const cx = tower.gridX * cellSize + cellSize / 2;
  const cy = tower.gridY * cellSize + cellSize / 2;
  const r = cellSize * 0.38;

  // Aura effects (drawn behind tower body)
  const sp = def.special;
  if (sp?.type === "shield") {
    drawShieldAura(ctx, cx, cy, def, gameTime);
  } else if (sp?.type === "firewall") {
    drawFirewallAura(ctx, cx, cy, def, gameTime);
  } else if (sp?.type === "pulse") {
    drawPulseAura(ctx, cx, cy, def, gameTime);
  }

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

  // Tower icon (emoji)
  ctx.font = `${Math.floor(cellSize * 0.46)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.emoji, cx, cy + 1);
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

  // Enemy emoji icon
  const emojiSize = Math.max(10, Math.floor(r * 1.6));
  ctx.font = `${emojiSize}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.emoji, enemy.x, enemy.y + 1);

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

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const dx = proj.x - proj.originX;
  const dy = proj.y - proj.originY;
  const travelAngle = Math.atan2(dy, dx);

  switch (proj.visualType) {
    case "sniper":   drawProjSniper(ctx, proj);                 break;
    case "laser":    drawProjLaser(ctx, proj);                  break;
    case "area":     drawProjArea(ctx, proj, gameTime);         break;
    case "slow":     drawProjSlow(ctx, proj, travelAngle);      break;
    case "chain":    drawProjChain(ctx, proj, gameTime);        break;
    case "poison":   drawProjPoison(ctx, proj, gameTime);       break;
    case "emp":      drawProjEmp(ctx, proj, gameTime);          break;
    case "overload": drawProjOverload(ctx, proj, gameTime);     break;
    default:         drawProjBasic(ctx, proj, travelAngle);     break;
  }
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

// ─── Tower Aura Effects ───────────────────────────────────────────────────────

function drawShieldAura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  def: TowerDef,
  gameTime: number
): void {
  const pulse = Math.sin((gameTime / 2000) * Math.PI * 2);
  const ringR = def.range + pulse * 4;
  // Faint dome fill
  ctx.fillStyle = "rgba(59,130,246,0.06)";
  ctx.beginPath();
  ctx.arc(cx, cy, def.range, 0, Math.PI * 2);
  ctx.fill();
  // Pulsing ring
  const alpha = (0.25 + (pulse + 1) * 0.15).toFixed(2);
  ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFirewallAura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  def: TowerDef,
  gameTime: number
): void {
  const phases = [0, 0.33, 0.66];
  for (const phase of phases) {
    const flicker = Math.sin((gameTime / 120 + phase) * Math.PI * 2);
    const r = def.range + flicker * 3;
    const alpha = (0.18 + Math.abs(flicker) * 0.14).toFixed(2);
    const hue = phase < 0.5 ? "239,68,68" : "249,115,22";
    ctx.strokeStyle = `rgba(${hue},${alpha})`;
    ctx.lineWidth = 6 + Math.abs(flicker) * 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(239,68,68,0.05)";
  ctx.beginPath();
  ctx.arc(cx, cy, def.range, 0, Math.PI * 2);
  ctx.fill();
}

function drawPulseAura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  def: TowerDef,
  gameTime: number
): void {
  const sp = def.special as { type: "pulse"; interval: number; aoeRadius: number };
  const phase = (gameTime % sp.interval) / sp.interval;
  const ringR = phase * sp.aoeRadius;
  const alpha = ((1 - phase) * 0.65).toFixed(2);
  ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  // Static boundary hint
  ctx.strokeStyle = "rgba(167,139,250,0.1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, sp.aoeRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Projectile Draw Functions ────────────────────────────────────────────────

// BASIC — elongated capsule aligned to travel direction
function drawProjBasic(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  angle: number
): void {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(angle);
  // Trail
  ctx.fillStyle = proj.color + "44";
  ctx.beginPath();
  ctx.ellipse(-7, 0, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bullet body
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bright tip
  ctx.fillStyle = "#ffffffaa";
  ctx.beginPath();
  ctx.arc(3.5, -0.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// SNIPER — thin bright beam from origin to tip
function drawProjSniper(
  ctx: CanvasRenderingContext2D,
  proj: Projectile
): void {
  ctx.save();
  // Outer glow
  ctx.strokeStyle = proj.color + "55";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // Core beam
  ctx.strokeStyle = "#ffffffcc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // Tip
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = "butt";
  ctx.restore();
}

// AREA — dark bomb with fuse spark and wobble
function drawProjArea(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const wobble = Math.sin(gameTime / 120) * 0.04;
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(wobble);
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(2, 3, 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bomb body
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Shine
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(-1.5, -1.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Fuse
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(5, -10, 3, -14);
  ctx.stroke();
  // Spark
  const sparkColor = Math.sin(gameTime / 80) > 0 ? "#f97316" : "#fbbf24";
  ctx.fillStyle = sparkColor + "aa";
  ctx.beginPath();
  ctx.arc(3, -14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sparkColor;
  ctx.beginPath();
  ctx.arc(3, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// SLOW — ice diamond/shard aligned to travel direction
function drawProjSlow(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  angle: number
): void {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(angle);
  // Glow
  ctx.fillStyle = proj.color + "44";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Diamond
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(0, 4);
  ctx.lineTo(-7, 0);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  // Inner highlight
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(0, 2);
  ctx.lineTo(-2, 0);
  ctx.lineTo(0, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// CHAIN — electric orb with 4 rotating zigzag spikes
function drawProjChain(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const rot = (gameTime / 1000) * Math.PI;
  ctx.save();
  ctx.translate(proj.x, proj.y);
  // Glow
  ctx.fillStyle = proj.color + "44";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Zigzag spikes
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(7, -2);
    ctx.lineTo(9, 1);
    ctx.lineTo(12, -1);
    ctx.stroke();
    ctx.restore();
  }
  // Orb core
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Bright center
  ctx.fillStyle = "#fef9c3";
  ctx.beginPath();
  ctx.arc(-0.5, -0.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// POISON — wobbly organic blob
function drawProjPoison(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const t = gameTime / 300;
  ctx.save();
  ctx.translate(proj.x, proj.y);
  // Outer glow
  ctx.fillStyle = proj.color + "44";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  // Wobbly blob using polyline approximation
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  const pts = 8;
  for (let i = 0; i <= pts; i++) {
    const ang = (i / pts) * Math.PI * 2;
    const wobble = 1 + 0.22 * Math.sin(ang * 3 + t);
    const r = 5 * wobble;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(-1.5, -1.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// LASER — thick multi-layer beam from origin to tip
function drawProjLaser(
  ctx: CanvasRenderingContext2D,
  proj: Projectile
): void {
  ctx.save();
  ctx.lineCap = "round";
  // Outermost glow
  ctx.strokeStyle = proj.color + "33";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // Mid glow
  ctx.strokeStyle = proj.color + "77";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // Core beam
  ctx.strokeStyle = proj.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // White hot center
  ctx.strokeStyle = "#ffffffaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(proj.originX, proj.originY);
  ctx.lineTo(proj.x, proj.y);
  ctx.stroke();
  // Tip flash
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = proj.color + "88";
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = "butt";
  ctx.restore();
}

// EMP — yellow orb with 2 alternating dashed expanding rings
function drawProjEmp(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const period = 600;
  const p1 = (gameTime % period) / period;
  const p2 = ((gameTime + period / 2) % period) / period;
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  // Ring 1
  ctx.strokeStyle = `rgba(251,191,36,${((1 - p1) * 0.7).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, p1 * 14, 0, Math.PI * 2);
  ctx.stroke();
  // Ring 2
  ctx.strokeStyle = `rgba(251,191,36,${((1 - p2) * 0.7).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, p2 * 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Orb core
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fef9c3";
  ctx.beginPath();
  ctx.arc(-0.5, -0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// OVERLOAD — large pulsing magenta orb with 3 rotating arc segments
function drawProjOverload(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  gameTime: number
): void {
  const pulse = Math.sin(gameTime / 250) * 0.5 + 0.5;
  const orbR = 6 + pulse * 3;
  const rot = (gameTime / 1000) * (Math.PI / 2);
  ctx.save();
  ctx.translate(proj.x, proj.y);
  // Outer glow
  ctx.fillStyle = proj.color + "44";
  ctx.beginPath();
  ctx.arc(0, 0, orbR + 8, 0, Math.PI * 2);
  ctx.fill();
  // 3 rotating arc segments (120° apart)
  ctx.strokeStyle = proj.color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const arcStart = rot + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(0, 0, orbR + 5, arcStart, arcStart + Math.PI / 3);
    ctx.stroke();
  }
  // Core radial gradient
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbR);
  grad.addColorStop(0, "#fdf4ff");
  grad.addColorStop(0.5, proj.color);
  grad.addColorStop(1, proj.color + "aa");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, orbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
