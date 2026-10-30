import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Group } from "three";
import { EDGES, NODES, type PathEdge } from "../data/pathGraph";
import { edgeLength, pointOnEdge, type Pt } from "../utils/geometry";
import { MAP_H, MAP_W } from "../constants";

const WALK_SPEED = 20;
const SKATE_CHANCE = 0.5;
const SKATE_BRIDGE = { start: { x: 140, y: 490 }, end: { x: 252, y: 490 } };
const SKATE_TRIGGER_DISTANCE = 12;
const SKATE_TRIGGER_RESET_DISTANCE = 32;
const JUNCTION_IDS = Object.values(NODES)
  .filter((node) => node.kind === "junction")
  .map((node) => node.id);

export interface WalkingProps {
  position: RefObject<HTMLDivElement | null>;
  heading: RefObject<Group | null>;
  enabled: boolean;
  skateDurationSeconds?: number;
  onNodeReached?: (nodeId: string) => void;
  onPositionChange?: (point: Pt) => void;
  onSkatingChange?: (skating: boolean) => void;
}

interface WalkState {
  nodeId: string;
  previousNodeId?: string;
  edge?: PathEdge;
  edgeFromNodeId?: string;
  distanceOnEdge: number;
}

interface SkateRoute {
  points: Pt[];
  segmentLengths: number[];
  totalLength: number;
  startedAt: number;
  durationMs: number;
}

function createSkateRoute(origin: Pt, startedAt: number, durationMs: number): SkateRoute {
  const pointCount = 64;
  const centerX = 238 + (Math.random() - 0.5) * 12;
  const centerY = 533 + (Math.random() - 0.5) * 6;
  const radiusX = 59 + Math.random() * 12;
  const radiusY = 20 + Math.random() * 8;
  const phase = Math.random() * Math.PI * 2;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const variation = Math.random() * 2;

  const loop = Array.from({ length: pointCount }, (_, index) => {
    const angle = phase + direction * (index / pointCount) * Math.PI * 2;
    const radiusVariation = 1 + Math.sin(angle * 2 + variation) * 0.035;
    return {
      x: centerX + Math.cos(angle) * radiusX * radiusVariation,
      y: centerY + Math.sin(angle) * radiusY * radiusVariation,
    };
  });
  let entryIndex = 0;
  let nearestDistance = Infinity;

  for (let index = 0; index < loop.length - 1; index += 1) {
    const distance = Math.hypot(
      loop[index]!.x - origin.x,
      loop[index]!.y - origin.y,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      entryIndex = index;
    }
  }

  const orderedLoop = Array.from(
    { length: pointCount },
    (_, offset) => loop[(entryIndex + offset) % pointCount]!,
  );
  const points = [origin, ...orderedLoop, origin];
  const segmentLengths = points.slice(1).map((point, index) =>
    Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y),
  );

  return {
    points,
    segmentLengths,
    totalLength: segmentLengths.reduce((total, length) => total + length, 0),
    startedAt,
    durationMs,
  };
}

function pointOnSkateRoute(route: SkateRoute, timestamp: number): {
  point: Pt;
  dx: number;
  dy: number;
  finished: boolean;
} {
  const progress = Math.min((timestamp - route.startedAt) / route.durationMs, 1);
  let distance = route.totalLength * progress;

  for (let index = 0; index < route.segmentLengths.length; index += 1) {
    const length = route.segmentLengths[index]!;
    const start = route.points[index]!;
    const end = route.points[index + 1]!;

    if (distance <= length || index === route.segmentLengths.length - 1) {
      const segmentProgress = length === 0 ? 1 : Math.min(distance / length, 1);
      return {
        point: {
          x: start.x + (end.x - start.x) * segmentProgress,
          y: start.y + (end.y - start.y) * segmentProgress,
        },
        dx: end.x - start.x,
        dy: end.y - start.y,
        finished: progress >= 1,
      };
    }

    distance -= length;
  }

  const lastPoint = route.points[route.points.length - 1]!;
  return { point: lastPoint, dx: 0, dy: 1, finished: true };
}

function chooseNextEdge(nodeId: string, previousNodeId?: string): PathEdge | undefined {
  const connectedEdges = EDGES.filter((edge) => edge.a === nodeId || edge.b === nodeId);
  const forwardEdges = connectedEdges.filter((edge) => {
    const nextNodeId = edge.a === nodeId ? edge.b : edge.a;
    return nextNodeId !== previousNodeId;
  });
  const options = forwardEdges.length > 0 ? forwardEdges : connectedEdges;
  return options[Math.floor(Math.random() * options.length)];
}

function pointOnWalkEdge(edge: PathEdge, fromNodeId: string, distance: number): {
  point: Pt;
  dx: number;
  dy: number;
} {
  const reversed = edge.b === fromNodeId;
  const length = edgeLength(edge);
  const progress = length === 0 ? 0 : Math.min(distance / length, 1);
  const point = pointOnEdge(edge, progress, reversed);
  const nextProgress = Math.min(progress + 0.01, 1);
  const previousProgress = Math.max(progress - 0.01, 0);
  const nextPoint = pointOnEdge(edge, nextProgress, reversed);
  const previousPoint = pointOnEdge(edge, previousProgress, reversed);
  const tangentFrom = nextProgress > progress ? point : previousPoint;
  const tangentTo = nextProgress > progress ? nextPoint : point;
  return { point, dx: tangentTo.x - tangentFrom.x, dy: tangentTo.y - tangentFrom.y };
}

export function Walking({
  position,
  heading,
  enabled,
  skateDurationSeconds,
  onNodeReached,
  onPositionChange,
  onSkatingChange,
}: WalkingProps) {
  const enabledRef = useRef(enabled);
  const onNodeReachedRef = useRef(onNodeReached);
  const onPositionChangeRef = useRef(onPositionChange);
  const onSkatingChangeRef = useRef(onSkatingChange);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onNodeReachedRef.current = onNodeReached;
  }, [onNodeReached]);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onSkatingChangeRef.current = onSkatingChange;
  }, [onSkatingChange]);

  useEffect(() => {
    const initialNodeId = JUNCTION_IDS[Math.floor(Math.random() * JUNCTION_IDS.length)];
    const walkState: WalkState = { nodeId: initialNodeId, distanceOnEdge: 0 };
    let skateRoute: SkateRoute | null = null;
    let hasTriedSkatingAtBridge = false;
    onNodeReachedRef.current?.(initialNodeId);

    let lastTimestamp: number | undefined;
    let frameId = 0;

    const animate = (timestamp: number) => {
      const elapsed = lastTimestamp === undefined ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;
      const isWalking = enabledRef.current;
      const wasSkating = skateRoute !== null;
      let point: Pt;
      let dx: number;
      let dy: number;

      if (skateRoute) {
        const skating = pointOnSkateRoute(skateRoute, timestamp);
        point = skating.point;
        dx = skating.dx;
        dy = skating.dy;

        if (skating.finished) {
          skateRoute = null;
          onSkatingChangeRef.current?.(false);
        }
      } else {
        if (isWalking) {
          let distanceToWalk = elapsed * WALK_SPEED;
          while (distanceToWalk > 0) {
            if (!walkState.edge) {
              const nextEdge = chooseNextEdge(walkState.nodeId, walkState.previousNodeId);
              if (!nextEdge) break;
              walkState.edge = nextEdge;
              walkState.edgeFromNodeId = walkState.nodeId;
              walkState.distanceOnEdge = 0;
            }

            const edge = walkState.edge;
            const edgeFromNodeId = walkState.edgeFromNodeId;
            if (!edge || !edgeFromNodeId) break;

            const remainingOnEdge = edgeLength(edge) - walkState.distanceOnEdge;
            if (distanceToWalk < remainingOnEdge) {
              walkState.distanceOnEdge += distanceToWalk;
              distanceToWalk = 0;
            } else {
              distanceToWalk -= remainingOnEdge;
              walkState.previousNodeId = edgeFromNodeId;
              walkState.nodeId = edge.a === edgeFromNodeId ? edge.b : edge.a;
              walkState.edge = undefined;
              walkState.edgeFromNodeId = undefined;
              walkState.distanceOnEdge = 0;
              onNodeReachedRef.current?.(walkState.nodeId);
            }
          }
        }

        ({ point, dx, dy } = walkState.edge && walkState.edgeFromNodeId
          ? pointOnWalkEdge(walkState.edge, walkState.edgeFromNodeId, walkState.distanceOnEdge)
          : { point: NODES[walkState.nodeId]!, dx: 0, dy: 1 });
      }

      if (isWalking) {
        if (position.current) {
          position.current.style.left = `${(point.x / MAP_W) * 100}%`;
          position.current.style.top = `${(point.y / MAP_H) * 100}%`;
        }
        onPositionChangeRef.current?.(point);
        if (heading.current && (dx !== 0 || dy !== 0)) {
          heading.current.rotation.y = Math.atan2(dx, dy);
        }

        if (skateDurationSeconds && !wasSkating) {
          const bridgeDx = SKATE_BRIDGE.end.x - SKATE_BRIDGE.start.x;
          const bridgeDy = SKATE_BRIDGE.end.y - SKATE_BRIDGE.start.y;
          const projection = Math.max(0, Math.min(1, (
            (point.x - SKATE_BRIDGE.start.x) * bridgeDx +
            (point.y - SKATE_BRIDGE.start.y) * bridgeDy
          ) / (bridgeDx * bridgeDx + bridgeDy * bridgeDy)));
          const bridgeDistance = Math.hypot(
            point.x - (SKATE_BRIDGE.start.x + projection * bridgeDx),
            point.y - (SKATE_BRIDGE.start.y + projection * bridgeDy),
          );

          if (bridgeDistance > SKATE_TRIGGER_RESET_DISTANCE) {
            hasTriedSkatingAtBridge = false;
          } else if (
            !hasTriedSkatingAtBridge &&
            bridgeDistance <= SKATE_TRIGGER_DISTANCE
          ) {
            hasTriedSkatingAtBridge = true;

            if (Math.random() < SKATE_CHANCE) {
              skateRoute = createSkateRoute(point, timestamp, skateDurationSeconds * 1000);
              onSkatingChangeRef.current?.(true);
            }
          }
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [heading, position, skateDurationSeconds]);

  return null;
}
