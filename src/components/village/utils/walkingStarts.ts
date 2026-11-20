import { EDGES, type PathEdge } from "../data/pathGraph";
import { edgeLength, pointOnEdge } from "./geometry";
import type { Pt } from "./geometry";

export interface WalkingStart {
  edge: PathEdge;
  fromNodeId: string;
  distanceOnEdge: number;
}

export function createWalkingStarts(count: number): WalkingStart[] {
  const candidates: Array<{ start: WalkingStart; point: Pt }> = [];
  const candidateSpacing = 24;

  for (const edge of EDGES) {
    const length = edgeLength(edge);
    const divisions = Math.ceil(length / candidateSpacing);

    for (let division = 1; division < divisions; division += 1) {
      const distanceOnEdge = (length * division) / divisions;
      candidates.push({
        start: { edge, fromNodeId: edge.a, distanceOnEdge },
        point: pointOnEdge(edge, distanceOnEdge / length),
      });
    }
  }

  const starts: WalkingStart[] = [];
  const selected: Pt[] = [];
  const usedCandidates = new Set<number>();

  while (starts.length < count) {
    let bestIndex = -1;
    let bestDistance = -1;

    for (let index = 0; index < candidates.length; index += 1) {
      if (usedCandidates.has(index)) continue;
      const { point } = candidates[index]!;
      const nearestDistance = selected.length === 0
        ? 0
        : Math.min(...selected.map((other) => Math.hypot(point.x - other.x, point.y - other.y)));

      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance;
        bestIndex = index;
      }
    }

    if (bestIndex < 0) {
      throw new Error("Cannot spread all characters across the village paths.");
    }

    const candidate = candidates[bestIndex]!;
    const reverse = starts.length % 2 === 1;
    starts.push(reverse
      ? {
        edge: candidate.start.edge,
        fromNodeId: candidate.start.edge.b,
        distanceOnEdge: edgeLength(candidate.start.edge) - candidate.start.distanceOnEdge,
      }
      : candidate.start);
    selected.push(candidate.point);
    usedCandidates.add(bestIndex);
  }

  return starts;
}
