import { Canvas, useThree } from "@react-three/fiber";
import {
  OrthographicCamera as DreiOrthographicCamera,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Box3, OrthographicCamera, Vector3, type Group } from "three";
import { findRoute, routeToPolyline } from "../utils/pathfinding";
import type { Pt } from "../utils/geometry";
import { MAP_H, MAP_W } from "../constants";

const WALK_PATH = routeToPolyline(findRoute("h1", "h19"));
const SEGMENT_LENGTHS = WALK_PATH.slice(1).map((point, index) =>
  Math.hypot(point.x - WALK_PATH[index].x, point.y - WALK_PATH[index].y),
);
const PATH_LENGTH = SEGMENT_LENGTHS.reduce((total, length) => total + length, 0);
const WALK_SPEED = 12;
const DOOR_HEIGHT = 23;

function ElfModel({
  heading,
  mapHeight,
  cameraZoom,
  onCameraZoomChange,
}: {
  heading: RefObject<Group | null>;
  mapHeight: number;
  cameraZoom: number;
  onCameraZoomChange: (zoom: number) => void;
}) {
  const { scene, animations } = useGLTF("/models/characters/elf.glb");
  const model = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, heading);
  const camera = useThree((state) => state.camera);
  const canvasHeight = useThree((state) => state.size.height);

  useEffect(() => {
    const walk = actions.walk_loop;
    if (!walk) {
      throw new Error('The Elf model is missing its "walk_loop" animation.');
    }

    walk.reset().setEffectiveTimeScale(0.65).fadeIn(0.2).play();
    return () => {
      walk.fadeOut(0.2);
    };
  }, [actions]);

  useEffect(() => {
    const group = heading.current;
    if (!group || mapHeight === 0 || !(camera instanceof OrthographicCamera) || canvasHeight === 0) return;

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
  }, [camera, cameraZoom, canvasHeight, heading, mapHeight, model, onCameraZoomChange]);

  return (
    <group ref={heading} scale={3.5}>
      <primitive object={model} />
    </group>
  );
}

function pointAtDistance(distance: number): { point: Pt; dx: number; dy: number } {
  let remaining = distance;
  for (let index = 0; index < SEGMENT_LENGTHS.length; index++) {
    const length = SEGMENT_LENGTHS[index];
    const start = WALK_PATH[index];
    const end = WALK_PATH[index + 1];
    if (remaining <= length) {
      const progress = length === 0 ? 0 : remaining / length;
      return {
        point: {
          x: start.x + (end.x - start.x) * progress,
          y: start.y + (end.y - start.y) * progress,
        },
        dx: end.x - start.x,
        dy: end.y - start.y,
      };
    }
    remaining -= length;
  }

  const end = WALK_PATH[WALK_PATH.length - 1];
  const previous = WALK_PATH[WALK_PATH.length - 2];
  return { point: end, dx: end.x - previous.x, dy: end.y - previous.y };
}

export function WalkingElf() {
  const position = useRef<HTMLDivElement>(null);
  const heading = useRef<Group>(null);
  const [cameraZoom, setCameraZoom] = useState(4);
  const [mapHeight, setMapHeight] = useState(0);
  const updateCameraZoom = useCallback((zoom: number) => {
    setCameraZoom((currentZoom) =>
      Math.abs(currentZoom - zoom) < 0.01 ? currentZoom : zoom,
    );
  }, []);

  useEffect(() => {
    const map = position.current?.parentElement;
    if (!map) return;

    const observer = new ResizeObserver(([entry]) => {
      setMapHeight(entry.contentRect.height);
    });
    observer.observe(map);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!position.current || WALK_PATH.length < 2 || PATH_LENGTH === 0) return;

    let startTime: number | undefined;
    let frameId = 0;

    const animate = (timestamp: number) => {
      startTime ??= timestamp;
      const distanceAlongLoop = ((timestamp - startTime) * WALK_SPEED) / 1000 % (PATH_LENGTH * 2);
      const returning = distanceAlongLoop > PATH_LENGTH;
      const distance = returning ? PATH_LENGTH * 2 - distanceAlongLoop : distanceAlongLoop;
      const { point, dx, dy } = pointAtDistance(distance);
      const direction = returning ? -1 : 1;

      if (position.current) {
        position.current.style.left = `${(point.x / MAP_W) * 100}%`;
        position.current.style.top = `${(point.y / MAP_H) * 100}%`;
      }
      if (heading.current) {
        heading.current.rotation.y = Math.atan2(dx * direction, dy * direction);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="walking-elf" ref={position} role="img" aria-label="Elfo caminando por los caminos">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <DreiOrthographicCamera
          makeDefault
          position={[0, 0, 6]}
          zoom={cameraZoom}
          near={0.1}
          far={20}
        />
        <ambientLight intensity={2} />
        <directionalLight position={[3, 5, 4]} intensity={2.5} />
        <ElfModel
          heading={heading}
          mapHeight={mapHeight}
          cameraZoom={cameraZoom}
          onCameraZoomChange={updateCameraZoom}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/characters/elf.glb");
