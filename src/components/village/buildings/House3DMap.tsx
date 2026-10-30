import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useMemo } from "react";
import { MAP_H, MAP_W } from "../constants";
import { BENCH_SPOTS, HOUSE_SPOTS } from "../data/spots";
import type { BenchSpot } from "../data/spots";
import { House3D } from "./Houses3D";
import { variantForDay } from "./houses";

const PIXELS_PER_WORLD_UNIT = 25;
const CAMERA_HEIGHT = 40;
const CAMERA_DEPTH = 40;
const CAMERA_ELEVATION_SIN = CAMERA_HEIGHT / Math.hypot(CAMERA_HEIGHT, CAMERA_DEPTH);
const HOUSE_FRONT_OFFSET = 1;
const BENCH_MODEL_SCALE = 7 * 2.6 / PIXELS_PER_WORLD_UNIT;

function BenchModel({ spot }: { spot: BenchSpot }) {
  const scale = useThree(({ size }) => size.width / MAP_W);
  const { scene } = useGLTF("/models/objects/bench.glb");
  const model = useMemo(() => clone(scene), [scene]);
  const [x, y, rotation] = spot;
  const position: [number, number, number] = [
    ((x - MAP_W / 2) / PIXELS_PER_WORLD_UNIT) * scale,
    0,
    ((y - MAP_H / 2) / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN)) * scale,
  ];

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale * BENCH_MODEL_SCALE}>
      <primitive object={model} />
    </group>
  );
}

function Benches() {
  return (
    <>
      {BENCH_SPOTS.map((spot, index) => <BenchModel key={index} spot={spot} />)}
    </>
  );
}

function Houses({
  litHouses,
  highlightedHouse,
}: {
  litHouses?: number[];
  highlightedHouse?: number;
}) {
  const scale = useThree(({ size }) => size.width / MAP_W);

  return (
    <>
      {HOUSE_SPOTS.map((house) => {
        const screenY = house.y - HOUSE_FRONT_OFFSET * PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN;
        const position: [number, number, number] = [
          ((house.x - MAP_W / 2) / PIXELS_PER_WORLD_UNIT) * scale,
          0,
          ((screenY - MAP_H / 2) / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN)) * scale,
        ];

        return (
          <House3D
            key={house.id}
            variant={variantForDay(house.id)}
            position={position}
            scale={scale}
            rotationY={house.rotation + Math.PI / 8}
            lit={litHouses ? litHouses.includes(house.id) : true}
            glowIntensity={house.id === highlightedHouse ? 1.8 : 1}
            decorations={false}
            wallColor={house.wallColor ?? undefined}
          />
        );
      })}
    </>
  );
}

export function House3DMap({
  litHouses,
  highlightedHouse,
  showHouses = true,
}: {
  litHouses?: number[];
  highlightedHouse?: number;
  showHouses?: boolean;
}) {
  return (
    <Canvas
      orthographic
      camera={{
        position: [0, CAMERA_HEIGHT, CAMERA_DEPTH],
        rotation: [-Math.PI / 4, 0, 0],
        zoom: PIXELS_PER_WORLD_UNIT,
        near: 0.1,
        far: 200,
      }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
    >
      <ambientLight intensity={0.9} color="#dbe7f5" />
      <directionalLight position={[-6, 12, 8]} intensity={2.2} />
      {showHouses && <Houses litHouses={litHouses} highlightedHouse={highlightedHouse} />}
      <Benches />
    </Canvas>
  );
}

useGLTF.preload("/models/objects/bench.glb");
