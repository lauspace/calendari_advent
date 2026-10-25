import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Euler, type Group, type Object3D } from "three";

export type SitPose = Record<string, [number, number, number]>;

interface SitProps {
  character: RefObject<Group | null>;
  active: boolean;
  pose: SitPose;
}

export function Sit({ character, active, pose }: SitProps) {
  const originalRotations = useRef(new Map<Object3D, Euler>());
  const targets = useMemo(
    () => Object.entries(pose).map(([bone, rotation]) => ({ bone, rotation })),
    [pose],
  );

  useLayoutEffect(() => {
    const root = character.current;
    if (!root) return;
    for (const { bone } of targets) {
      const object = root.getObjectByName(bone);
      if (object && !originalRotations.current.has(object)) {
        originalRotations.current.set(object, object.rotation.clone());
      }
    }
  }, [character, targets]);

  useFrame((_, delta) => {
    const root = character.current;
    if (!root) return;

    const amount = 1 - Math.exp(-8 * delta);
    for (const { bone, rotation } of targets) {
      const object = root.getObjectByName(bone);
      if (!object) continue;

      let original = originalRotations.current.get(object);
      if (!original) {
        original = object.rotation.clone();
        originalRotations.current.set(object, original);
      }

      const factor = active ? 1 : 0;
      object.rotation.x += (original.x + rotation[0] * factor - object.rotation.x) * amount;
      object.rotation.y += (original.y + rotation[1] * factor - object.rotation.y) * amount;
      object.rotation.z += (original.z + rotation[2] * factor - object.rotation.z) * amount;
    }
  });

  return null;
}
