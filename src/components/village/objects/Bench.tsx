import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BenchSpot } from "../data/spots";
import { MAP_H, MAP_W } from "../constants";

export function Bench({ spot }: { spot: BenchSpot }) {
  const [x, y, rotation, scale] = spot;
  const { scene } = useGLTF("/models/objects/bench.glb");
  const model = useMemo(() => clone(scene), [scene]);
  const container = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(MAP_H);

  useEffect(() => {
    const map = container.current?.parentElement;
    if (!map) return;

    const observer = new ResizeObserver(([entry]) => {
      setMapHeight(entry.contentRect.height);
    });
    observer.observe(map);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={container}
      className="village-bench-model"
      style={{ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` }}
      aria-hidden="true"
    >
      <Canvas gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 50]}
          zoom={2.6 * (mapHeight / MAP_H)}
          near={0.1}
          far={100}
        />
        <ambientLight intensity={2} />
        <directionalLight position={[3, 5, 4]} intensity={2.5} />
        <primitive object={model} rotation={[0, rotation, 0]} scale={scale} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/objects/bench.glb");
