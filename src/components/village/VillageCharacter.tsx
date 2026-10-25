import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, useAnimations, useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Box3, OrthographicCamera as ThreeOrthographicCamera, Vector3, type Group } from "three";
import { EDGES } from "./data/pathGraph";
import { MAP_H, MAP_W } from "./constants";
import type { BenchSpot } from "./data/spots";
import { Walking } from "./movement/Walking";
import { Sit, type SitPose } from "./movement/Sit";
import { closestPointOnEdge, type Pt } from "./utils/geometry";
import { isBenchOccupied, releaseBench, reserveBench } from "./interactions/benchReservations";

const DOOR_HEIGHT = 23;
const DEFAULT_SIT_POSE: SitPose = {};
const SIT_CHANCE = 0.35;
const BENCH_INTERACTION_RADIUS = 4;
const BENCH_EXIT_RADIUS = 8;
const BENCH_SEAT_Y_OFFSET = -5;

function distanceToSegment(point: Pt, start: Pt, end: Pt): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, (
      (point.x - start.x) * segmentX +
      (point.y - start.y) * segmentY
    ) / segmentLengthSquared));
  return Math.hypot(
    point.x - (start.x + projection * segmentX),
    point.y - (start.y + projection * segmentY),
  );
}

interface VillageCharacterProps {
  modelPath: string;
  name: string;
  walkAnimation: string;
  benches: readonly BenchSpot[];
  sitPose?: SitPose;
  scale?: number;
}

function CharacterModel({
  modelPath,
  walkAnimation,
  heading,
  character,
  mapHeight,
  cameraZoom,
  onCameraZoomChange,
  isSitting,
  sitPose,
  scale,
}: {
  modelPath: string;
  walkAnimation: string;
  heading: RefObject<Group | null>;
  character: RefObject<Group | null>;
  mapHeight: number;
  cameraZoom: number;
  onCameraZoomChange: (zoom: number) => void;
  isSitting: boolean;
  sitPose: SitPose;
  scale: number;
}) {
  const { scene, animations } = useGLTF(modelPath);
  const model = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, heading);
  const camera = useThree((state) => state.camera);
  const canvasHeight = useThree((state) => state.size.height);

  useEffect(() => {
    const walk = actions[walkAnimation];
    if (!walk) {
      throw new Error(`The character model is missing its "${walkAnimation}" animation.`);
    }

    if (isSitting) {
      walk.fadeOut(0.25);
    } else {
      walk.reset().setEffectiveTimeScale(0.65).fadeIn(0.25).play();
    }
    return () => {
      walk.fadeOut(0.2);
    };
  }, [actions, isSitting, walkAnimation]);

  useEffect(() => {
    const group = heading.current;
    if (!group || mapHeight === 0 || !(camera instanceof ThreeOrthographicCamera) || canvasHeight === 0) return;

    group.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
    const bounds = new Box3().setFromObject(group);
    if (bounds.isEmpty()) return;

    let minY = Infinity;
    let maxY = -Infinity;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const projectedY = new Vector3(x, y, z).project(camera).y;
          minY = Math.min(minY, projectedY);
          maxY = Math.max(maxY, projectedY);
        }
      }
    }

    const renderedHeight = ((maxY - minY) / 2) * canvasHeight;
    const targetHeight = (mapHeight / MAP_H) * DOOR_HEIGHT;
    if (renderedHeight > 0 && targetHeight > 0) {
      onCameraZoomChange(cameraZoom * (targetHeight / renderedHeight));
    }
  }, [camera, cameraZoom, canvasHeight, heading, mapHeight, model, onCameraZoomChange, scale]);

  return (
    <>
      <group ref={heading} scale={scale}>
        <primitive ref={character} object={model} />
      </group>
      <Sit character={character} active={isSitting} pose={sitPose} />
    </>
  );
}

export function VillageCharacter({
  modelPath,
  name,
  walkAnimation,
  benches,
  sitPose = DEFAULT_SIT_POSE,
  scale = 3.5,
}: VillageCharacterProps) {
  const position = useRef<HTMLDivElement>(null);
  const heading = useRef<Group>(null);
  const character = useRef<Group>(null);
  const [cameraZoom, setCameraZoom] = useState(4);
  const [mapHeight, setMapHeight] = useState(0);
  const [activeBench, setActiveBench] = useState<BenchSpot | null>(null);
  const lastSitAt = useRef(0);
  const approachedBenches = useRef(new Set<number>());
  const previousWalkPoint = useRef<Pt | null>(null);
  const reservationOwner = useRef(Symbol(name));

  const benchTargets = useMemo(() => benches.map((spot, index) => {
    const [x, y] = spot;
    const benchPoint = { x, y };
    let closestPoint: Pt | undefined;
    let closestDistance = Infinity;

    for (const edge of EDGES) {
      const candidate = closestPointOnEdge(edge, benchPoint);
      const distance = Math.hypot(x - candidate.x, y - candidate.y);
      if (distance < closestDistance) {
        closestPoint = candidate;
        closestDistance = distance;
      }
    }

    if (!closestPoint) {
      throw new Error("Cannot place a bench interaction point because the path graph has no edges.");
    }
    return { spot, index, pathPoint: closestPoint };
  }), [benches]);

  const updateCameraZoom = useCallback((zoom: number) => {
    setCameraZoom((currentZoom) =>
      Math.abs(currentZoom - zoom) < 0.01 ? currentZoom : zoom,
    );
  }, []);

  useEffect(() => {
    const map = position.current?.parentElement;
    if (!map) return;
    const observer = new ResizeObserver(([entry]) => setMapHeight(entry.contentRect.height));
    observer.observe(map);
    return () => observer.disconnect();
  }, []);

  const handlePositionChange = useCallback((point: Pt) => {
    const previousPoint = previousWalkPoint.current ?? point;
    for (const target of benchTargets) {
      const distance = Math.hypot(point.x - target.pathPoint.x, point.y - target.pathPoint.y);
      if (distance > BENCH_EXIT_RADIUS) {
        approachedBenches.current.delete(target.index);
      }
      const crossedInteractionRadius =
        distanceToSegment(target.pathPoint, previousPoint, point) <= BENCH_INTERACTION_RADIUS;
      if (!crossedInteractionRadius || approachedBenches.current.has(target.index)) continue;

      approachedBenches.current.add(target.index);
      if (
        activeBench ||
        isBenchOccupied(target.spot) ||
        Date.now() - lastSitAt.current < 15000 ||
        Math.random() >= SIT_CHANCE ||
        !reserveBench(target.spot, reservationOwner.current)
      ) continue;
      lastSitAt.current = Date.now();
      setActiveBench(target.spot);
      previousWalkPoint.current = point;
      return;
    }
    previousWalkPoint.current = point;
  }, [activeBench, benchTargets]);

  useEffect(() => {
    if (!activeBench) return;
    if (position.current) {
      position.current.style.left = `${(activeBench[0] / MAP_W) * 100}%`;
      position.current.style.top = `${((activeBench[1] + BENCH_SEAT_Y_OFFSET) / MAP_H) * 100}%`;
    }
    if (heading.current) {
      heading.current.rotation.y = activeBench[2];
    }

    const owner = reservationOwner.current;
    const timeout = window.setTimeout(() => {
      releaseBench(activeBench, owner);
      setActiveBench(null);
    }, 3000 + Math.random() * 4000);
    return () => {
      window.clearTimeout(timeout);
      releaseBench(activeBench, owner);
    };
  }, [activeBench]);

  return (
    <>
      <div
        className="walking-character"
        ref={position}
        role="img"
        aria-label={`${name} caminant pel poble`}
        title={name}
      >
        <span
          className="character-name-target"
          data-character-name={name}
          aria-hidden="true"
        />
        <Canvas gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
          <OrthographicCamera
            makeDefault
            position={[0, 0, 6]}
            zoom={cameraZoom}
            near={0.1}
            far={20}
          />
          <ambientLight intensity={2} />
          <directionalLight position={[3, 5, 4]} intensity={2.5} />
          <CharacterModel
            modelPath={modelPath}
            walkAnimation={walkAnimation}
            heading={heading}
            character={character}
            mapHeight={mapHeight}
            cameraZoom={cameraZoom}
            onCameraZoomChange={updateCameraZoom}
            isSitting={activeBench !== null}
            sitPose={sitPose}
            scale={scale}
          />
        </Canvas>
      </div>
      <Walking
        position={position}
        heading={heading}
        enabled={activeBench === null}
        onPositionChange={handlePositionChange}
      />
    </>
  );
}
