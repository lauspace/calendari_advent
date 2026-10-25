import { EDGES, NODES } from "../data/pathGraph";
import { edgeLength, pointOnEdge, type Pt } from "./geometry";

const LENGTHS = EDGES.map((e) => edgeLength(e));

/** Ruta más corta entre dos nodos (Dijkstra). Devuelve ids de nodo. */
export function findRoute(from: string, to: string): string[] {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | undefined> = {};
  const todo = new Set(Object.keys(NODES));
  todo.forEach((id) => (dist[id] = Infinity));
  dist[from] = 0;

  while (todo.size) {
    let cur: string | undefined;
    todo.forEach((id) => {
      if (cur === undefined || dist[id] < dist[cur]) cur = id;
    });
    if (cur === undefined || dist[cur] === Infinity) break;
    if (cur === to) break;
    todo.delete(cur);
    EDGES.forEach((e, i) => {
      const other = e.a === cur ? e.b : e.b === cur ? e.a : null;
      if (other && todo.has(other) && dist[cur!] + LENGTHS[i] < dist[other]) {
        dist[other] = dist[cur!] + LENGTHS[i];
        prev[other] = cur;
      }
    });
  }

  const route: string[] = [];
  for (let at: string | undefined = to; at; at = prev[at]) route.unshift(at);
  return route[0] === from ? route : [];
}

/**
 * Convierte una ruta de nodos en una polilínea densa (útil para animar
 * un personaje con requestAnimationFrame o useFrame de R3F).
 */
export function routeToPolyline(route: string[], stepsPerEdge = 24): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const idx = EDGES.findIndex((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (idx < 0) continue;
    const reversed = EDGES[idx].a !== a;
    for (let s = i === 0 ? 0 : 1; s <= stepsPerEdge; s++) {
      pts.push(pointOnEdge(EDGES[idx], s / stepsPerEdge, reversed));
    }
  }
  return pts;
}
