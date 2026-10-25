import type { BenchSpot } from "../data/spots";

const benchOwners = new Map<string, symbol>();

function getBenchKey(spot: BenchSpot): string {
  return `${spot[0]}:${spot[1]}`;
}

export function isBenchOccupied(spot: BenchSpot): boolean {
  return benchOwners.has(getBenchKey(spot));
}

export function reserveBench(spot: BenchSpot, owner: symbol): boolean {
  const key = getBenchKey(spot);
  if (benchOwners.has(key)) return false;
  benchOwners.set(key, owner);
  return true;
}

export function releaseBench(spot: BenchSpot, owner: symbol): void {
  const key = getBenchKey(spot);
  if (benchOwners.get(key) === owner) benchOwners.delete(key);
}
