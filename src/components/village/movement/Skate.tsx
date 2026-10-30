import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Euler, type Group, type Object3D } from "three";

export interface SkateMovementConfig {
  durationSeconds: number;
  pushAngle: number;
  kneeBend: number;
  armBalance: number;
}

interface SkateProps {
  character: RefObject<Group | null>;
  active: boolean;
  movement: SkateMovementConfig;
}

const MOVEMENT_BONES = {
  leftLeg: ["Leg_L", "leg_upper_left_bone", "leg_front_left_bone"],
  rightLeg: ["Leg_R", "leg_upper_right_bone", "leg_front_right_bone"],
  leftBackLeg: ["leg_back_left_bone"],
  rightBackLeg: ["leg_back_right_bone"],
  leftArm: ["Arm_L", "arm_upper_left_bone"],
  rightArm: ["Arm_R", "arm_upper_right_bone"],
  torso: ["Torso", "torso_bone", "body"],
} as const;

type MovementBone = keyof typeof MOVEMENT_BONES;

function findBone(root: Group, names: readonly string[]): Object3D | undefined {
  for (const name of names) {
    const bone = root.getObjectByName(name);
    if (bone) return bone;
  }
}

export function Skate({ character, active, movement }: SkateProps) {
  const originalRotations = useRef(new Map<Object3D, Euler>());
  const restoring = useRef(false);
  const bones = useMemo(
    () => Object.entries(MOVEMENT_BONES) as Array<[MovementBone, readonly string[]]>,
    [],
  );

  useLayoutEffect(() => {
    const root = character.current;
    if (!root) return;

    for (const [, names] of bones) {
      const bone = findBone(root, names);
      if (bone && !originalRotations.current.has(bone)) {
        originalRotations.current.set(bone, bone.rotation.clone());
      }
    }
  }, [bones, character]);

  useEffect(() => {
    restoring.current = !active;
  }, [active]);

  useFrame(({ clock }, delta) => {
    if (!active && !restoring.current) return;

    const root = character.current;
    if (!root) return;

    const phase = clock.elapsedTime * 3.6;
    const push = Math.sin(phase);
    const kneeLift = Math.max(0, Math.cos(phase));
    const amount = 1 - Math.exp(-30 * delta);
    const offsets: Record<MovementBone, [number, number, number]> = {
      leftLeg: active ? [kneeLift * movement.kneeBend, 0, push * movement.pushAngle] : [0, 0, 0],
      rightLeg: active ? [Math.max(0, -Math.cos(phase)) * movement.kneeBend, 0, -push * movement.pushAngle] : [0, 0, 0],
      leftBackLeg: active ? [kneeLift * movement.kneeBend, 0, push * movement.pushAngle] : [0, 0, 0],
      rightBackLeg: active ? [Math.max(0, -Math.cos(phase)) * movement.kneeBend, 0, -push * movement.pushAngle] : [0, 0, 0],
      leftArm: active ? [0, 0, -push * movement.armBalance] : [0, 0, 0],
      rightArm: active ? [0, 0, push * movement.armBalance] : [0, 0, 0],
      torso: active ? [-0.08, 0, -push * 0.06] : [0, 0, 0],
    };

    let restored = true;
    for (const [name, aliases] of bones) {
      const bone = findBone(root, aliases);
      const original = bone ? originalRotations.current.get(bone) : undefined;
      if (!bone || !original) continue;

      const [x, y, z] = offsets[name];
      bone.rotation.x += (original.x + x - bone.rotation.x) * amount;
      bone.rotation.y += (original.y + y - bone.rotation.y) * amount;
      bone.rotation.z += (original.z + z - bone.rotation.z) * amount;
      if (
        Math.abs(bone.rotation.x - original.x) > 0.01 ||
        Math.abs(bone.rotation.y - original.y) > 0.01 ||
        Math.abs(bone.rotation.z - original.z) > 0.01
      ) {
        restored = false;
      }
    }

    if (!active && restored) restoring.current = false;
  });

  return null;
}
