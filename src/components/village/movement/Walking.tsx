import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Group } from "three";
import { EDGES, NODES, type PathEdge } from "../data/pathGraph";
import { edgeLength, pointOnEdge, type Pt } from "../utils/geometry";
import { MAP_H, MAP_W } from "../constants";

const WALK_SPEED = 20;
const JUNCTION_IDS = Object.values(NODES)
  .filter((node) => node.kind === "junction")
  .map((node) => node.id);

export interface WalkingProps {
  position: RefObject<HTMLDivElement | null>;
  heading: RefObject<Group | null>;
  enabled: boolean;
  onNodeReached?: (nodeId: string) => void;
  onPositionChange?: (point: Pt) => void;
}

interface WalkState {
  nodeId: string;
  previousNodeId?: string;
  edge?: PathEdge;
  edgeFromNodeId?: string;
  distanceOnEdge: number;
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

export function Walking({ position, heading, enabled, onNodeReached, onPositionChange }: WalkingProps) {
  const enabledRef = useRef(enabled);
  const onNodeReachedRef = useRef(onNodeReached);
  const onPositionChangeRef = useRef(onPositionChange);

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
    const initialNodeId = JUNCTION_IDS[Math.floor(Math.random() * JUNCTION_IDS.length)];
    const walkState: WalkState = { nodeId: initialNodeId, distanceOnEdge: 0 };
    onNodeReachedRef.current?.(initialNodeId);

    let lastTimestamp: number | undefined;
    let frameId = 0;

    const animate = (timestamp: number) => {
      const elapsed = lastTimestamp === undefined ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;
      const isWalking = enabledRef.current;

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

      const { point, dx, dy } = walkState.edge && walkState.edgeFromNodeId
        ? pointOnWalkEdge(walkState.edge, walkState.edgeFromNodeId, walkState.distanceOnEdge)
        : { point: NODES[walkState.nodeId], dx: 0, dy: 1 };
      if (isWalking) {
        if (position.current) {
          position.current.style.left = `${(point.x / MAP_W) * 100}%`;
          position.current.style.top = `${(point.y / MAP_H) * 100}%`;
        }
        onPositionChangeRef.current?.(point);
        if (heading.current && (dx !== 0 || dy !== 0)) {
          heading.current.rotation.y = Math.atan2(dx, dy);
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [heading, position]);

  return null;
}
