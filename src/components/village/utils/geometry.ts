import { NODES, type PathEdge } from "../data/pathGraph";

export type Pt = { x: number; y: number };

/** Punto de una arista en t∈[0,1]. Si reversed=true se recorre de b hacia a. */
export function pointOnEdge(edge: PathEdge, t: number, reversed = false): Pt {
  const A = NODES[edge.a];
  const B = NODES[edge.b];
  const u = reversed ? 1 - t : t;
  if (!edge.c) return { x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u };
  const [cx, cy] = edge.c;
  const m = 1 - u;
  return {
    x: m * m * A.x + 2 * m * u * cx + u * u * B.x,
    y: m * m * A.y + 2 * m * u * cy + u * u * B.y,
  };
}

export function closestPointOnEdge(edge: PathEdge, point: Pt, steps = 32): Pt {
  let closestPoint = pointOnEdge(edge, 0);
  let closestDistance = Infinity;
  let previousPoint = closestPoint;

  for (let i = 1; i <= steps; i++) {
    const currentPoint = pointOnEdge(edge, i / steps);
    const segmentX = currentPoint.x - previousPoint.x;
    const segmentY = currentPoint.y - previousPoint.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection = segmentLengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (
        (point.x - previousPoint.x) * segmentX +
        (point.y - previousPoint.y) * segmentY
      ) / segmentLengthSquared));
    const candidate = {
      x: previousPoint.x + projection * segmentX,
      y: previousPoint.y + projection * segmentY,
    };
    const distanceX = point.x - candidate.x;
    const distanceY = point.y - candidate.y;
    const distance = distanceX * distanceX + distanceY * distanceY;

    if (distance < closestDistance) {
      closestPoint = candidate;
      closestDistance = distance;
    }
    previousPoint = currentPoint;
  }

  return closestPoint;
}

export function edgeLength(edge: PathEdge, steps = 16): number {
  let len = 0;
  let prev = pointOnEdge(edge, 0);
  for (let i = 1; i <= steps; i++) {
    const p = pointOnEdge(edge, i / steps);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** Atributo `d` de SVG para una arista */
export const edgeD = (e: PathEdge) => {
  const A = NODES[e.a];
  const B = NODES[e.b];
  return e.c
    ? `M${A.x} ${A.y} Q${e.c[0]} ${e.c[1]} ${B.x} ${B.y}`
    : `M${A.x} ${A.y} L${B.x} ${B.y}`;
};
