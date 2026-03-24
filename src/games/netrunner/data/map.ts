// src/games/netrunner/data/map.ts

export type NodeType = "combat" | "event" | "shop" | "elite" | "boss";

export interface MapNode {
  id: string;        // "row-col" e.g. "0-3"
  row: number;
  col: number;
  type: NodeType;
  connections: string[];  // node ids this node connects TO (downward)
  visited: boolean;
}

export interface ActMap {
  nodes: MapNode[];
  rows: number;   // 8
  cols: number;   // 7
}

const NODE_TYPE_WEIGHTS: Record<NodeType, number> = {
  combat: 45,
  event: 20,
  shop: 15,
  elite: 10,
  boss: 0,   // placed manually
};

function weightedRandom(weights: Record<NodeType, number>, randFn: () => number): NodeType {
  const entries = Object.entries(weights).filter(([, w]) => w > 0) as [NodeType, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = randFn() * total;
  for (const [type, w] of entries) {
    r -= w;
    if (r <= 0) return type;
  }
  return entries[0][0];
}

export function generateActMap(seed?: number): ActMap {
  const ROWS = 8;   // 8 rows of selectable nodes + 1 boss row = 9 total, but boss is separate
  const COLS = 7;

  // Use seed for reproducibility (simple LCG if seed provided)
  const rand = seed != null
    ? (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })()
    : Math.random;

  const nodes: MapNode[] = [];

  // Row 0 (entry): 3 random starting nodes in cols 1-5
  const startCols = [2, 3, 4].sort(() => rand() - 0.5).slice(0, 3);
  for (const col of startCols) {
    nodes.push({ id: `0-${col}`, row: 0, col, type: "combat", connections: [], visited: false });
  }

  // Rows 1-6: random nodes
  for (let row = 1; row < ROWS - 1; row++) {
    const numNodes = 3 + Math.floor(rand() * 2); // 3-4 nodes per row
    const cols = Array.from({ length: COLS }, (_, i) => i)
      .sort(() => rand() - 0.5)
      .slice(0, numNodes)
      .sort((a, b) => a - b);

    for (const col of cols) {
      const type = row === ROWS - 2 ? "shop" : weightedRandom(NODE_TYPE_WEIGHTS, rand);
      nodes.push({ id: `${row}-${col}`, row, col, type, connections: [], visited: false });
    }
  }

  // Last regular row (row 7): single boss entry point (center)
  nodes.push({ id: `${ROWS - 1}-3`, row: ROWS - 1, col: 3, type: "boss", connections: [], visited: false });

  // Build connections (each node connects to 1-2 nodes in the next row, no crossing)
  const byRow: Map<number, MapNode[]> = new Map();
  for (const n of nodes) {
    if (!byRow.has(n.row)) byRow.set(n.row, []);
    byRow.get(n.row)!.push(n);
  }

  for (let row = 0; row < ROWS - 1; row++) {
    const current = byRow.get(row) ?? [];
    const next = byRow.get(row + 1) ?? [];
    if (next.length === 0) continue;

    for (const node of current) {
      // Find closest node(s) in next row
      const sorted = [...next].sort((a, b) => Math.abs(a.col - node.col) - Math.abs(b.col - node.col));
      const picks = sorted.slice(0, 1 + Math.floor(rand() * 2)); // 1-2 connections
      for (const target of picks) {
        if (!node.connections.includes(target.id)) {
          node.connections.push(target.id);
        }
      }
    }

    // Ensure every next-row node has at least one incoming connection
    for (const target of next) {
      const hasIncoming = current.some((n) => n.connections.includes(target.id));
      if (!hasIncoming) {
        const closest = [...current].sort((a, b) => Math.abs(a.col - target.col) - Math.abs(b.col - target.col))[0];
        if (closest && !closest.connections.includes(target.id)) {
          closest.connections.push(target.id);
        }
      }
    }
  }

  return { nodes, rows: ROWS, cols: COLS };
}

export function getAvailableNodes(map: ActMap, currentNodeId: string | null): string[] {
  if (currentNodeId === null) {
    // Start: row 0 nodes
    return map.nodes.filter((n) => n.row === 0).map((n) => n.id);
  }
  const current = map.nodes.find((n) => n.id === currentNodeId);
  return current?.connections ?? [];
}
