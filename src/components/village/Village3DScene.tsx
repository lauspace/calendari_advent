import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { House3DScene } from "./buildings/House3DMap";
import { TREE_SPOTS } from "./data/spots";
import { TreeModels } from "./nature/TreeModels";

const PIXELS_PER_WORLD_UNIT = 25;
const CAMERA_HEIGHT = 40;
const CAMERA_DEPTH = 40;

export function Village3DScene({
  showPlaceholders,
  litHouses,
  highlightedHouse,
  characterModels,
}: {
  showPlaceholders: boolean;
  litHouses?: number[];
  highlightedHouse?: number;
  characterModels: ReactNode;
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
      <House3DScene
        litHouses={litHouses}
        highlightedHouse={highlightedHouse}
        showHouses={showPlaceholders}
      />
      {showPlaceholders && <TreeModels spots={TREE_SPOTS} />}
      {characterModels}
    </Canvas>
  );
}
