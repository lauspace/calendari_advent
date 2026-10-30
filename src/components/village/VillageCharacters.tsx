import { Canvas, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { createRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Box3, Material, Mesh, OrthographicCamera, Vector3, type Group } from "three";
import { EDGES } from "./data/pathGraph";
import { CHARACTER_SIZE_MULTIPLIER, MAP_H, MAP_W } from "./constants";
import type { VillageCharacterData } from "./data/characters";
import type { BenchSpot } from "./data/spots";
import type { Pt } from "./utils/geometry";
import { Walking } from "./movement/Walking";
import { Sit, type SitPose } from "./movement/Sit";
import { Skate } from "./movement/Skate";
import { closestPointOnEdge } from "./utils/geometry";
import { isBenchOccupied, releaseBench, reserveBench } from "./interactions/benchReservations";

const PIXELS_PER_WORLD_UNIT = 25;
const CAMERA_HEIGHT = 40;
const CAMERA_DEPTH = 40;
const CAMERA_ELEVATION_SIN = CAMERA_HEIGHT / Math.hypot(CAMERA_HEIGHT, CAMERA_DEPTH);
const CHARACTER_SCALE = 0.92 * 1.2;
const CHARACTER_HEIGHT = 23;
const SIT_CHANCE = 0.35;
const BENCH_INTERACTION_RADIUS = 4;
const BENCH_EXIT_RADIUS = 8;
const BENCH_SEAT_Y_OFFSET = -5;
const SIT_DURATION_MIN = 3000;
const SIT_DURATION_RANGE = 4000;
const SIT_COOLDOWN = 15000;

interface CharacterRefs {
  heading: RefObject<Group | null>;
  modelPosition: RefObject<Group | null>;
  character: RefObject<Group | null>;
}

interface SkateMaterialOverride {
  mesh: Mesh;
  original: Material | Material[];
  skating: Material | Material[];
  activeUniforms: Array<{ value: number }>;
}

interface SkateBootMaterial {
  material: Material;
  activeUniform: { value: number };
}

function createSkateBootMaterial(
  material: Material,
  cutoff: number,
  transition: number,
): SkateBootMaterial {
  const skatingMaterial = material.clone();
  const activeUniform = { value: 0 };

  skatingMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.skateBootActive = activeUniform;
    shader.uniforms.skateBootCutoff = { value: cutoff };
    shader.uniforms.skateBootTransition = { value: transition };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vSkateBootHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSkateBootHeight = position.y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vSkateBootHeight;\nuniform float skateBootActive;\nuniform float skateBootCutoff;\nuniform float skateBootTransition;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nfloat skateBootBlend = skateBootActive * (1.0 - smoothstep(skateBootCutoff - skateBootTransition, skateBootCutoff + skateBootTransition, vSkateBootHeight));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.98, 1.0), skateBootBlend);",
      );
  };
  skatingMaterial.customProgramCacheKey = () => `skate-boot-skin-${material.name}`;
  skatingMaterial.needsUpdate = true;

  return { material: skatingMaterial, activeUniform };
}

function applySkateAppearance(
  overrides: SkateMaterialOverride[],
  active: boolean,
) {
  for (const override of overrides) {
    override.mesh.material = active ? override.skating : override.original;

    for (const uniform of override.activeUniforms) {
      uniform.value = active ? 1 : 0;
    }
  }
}

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

function mapPointToWorld(point: Pt, mapScale: number): [number, number, number] {
  return [
    ((point.x - MAP_W / 2) / PIXELS_PER_WORLD_UNIT) * mapScale,
    0,
    ((point.y - MAP_H / 2) / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN)) * mapScale,
  ];
}

function CharacterModel({
  character,
  refs,
  isSitting,
  isSkating,
  sittingSpot,
  mapScale,
}: {
  character: VillageCharacterData;
  refs: CharacterRefs;
  isSitting: boolean;
  isSkating: boolean;
  sittingSpot?: BenchSpot;
  mapScale: number;
}) {
  const { heading, modelPosition, character: characterGroup } = refs;
  const { scene, animations } = useGLTF(character.modelPath);
  const model = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, heading);
  const camera = useThree((state) => state.camera);
  const canvasHeight = useThree((state) => state.size.height);
  const skateMaterialOverrides = useMemo(() => {
    const overrides: SkateMaterialOverride[] = [];

    model.traverse((object) => {
      if (!(object instanceof Mesh) || !/leg/i.test(object.name)) return;

      const geometry = object.geometry;
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      const legBounds = geometry.boundingBox;
      if (!legBounds) return;

      const height = legBounds.max.y - legBounds.min.y;
      if (height <= 0) return;

      const original = object.material;
      const replaceMaterial = (material: Material) =>
        createSkateBootMaterial(
          material,
          legBounds.min.y + height * 0.55,
          height * 0.02,
        );
      const skateMaterials = Array.isArray(original)
        ? original.map(replaceMaterial)
        : [replaceMaterial(original)];
      const skating = Array.isArray(original)
        ? skateMaterials.map(({ material }) => material)
        : skateMaterials[0]!.material;

      overrides.push({
        mesh: object,
        original,
        skating,
        activeUniforms: skateMaterials.map(({ activeUniform }) => activeUniform),
      });
    });

    return overrides;
  }, [model]);
  const sitAction = character.actions.sit;
  const sitPose: SitPose = sitAction?.pose ?? {};
  const walkAnimation = character.actions.walk.animation;

  useEffect(() => {
    const walk = actions[walkAnimation];
    if (!walk) {
      throw new Error(`The character model "${character.modelPath}" is missing its "${walkAnimation}" animation.`);
    }

    if (isSitting || isSkating) {
      walk.fadeOut(0.25);
    } else {
      walk.reset().setEffectiveTimeScale(0.65).fadeIn(0.25).play();
    }
    return () => {
      walk.fadeOut(0.2);
    };
  }, [actions, character.modelPath, isSitting, isSkating, sitAction, walkAnimation]);

  useEffect(() => {
    applySkateAppearance(skateMaterialOverrides, isSkating);

    return () => {
      applySkateAppearance(skateMaterialOverrides, false);
    };
  }, [isSkating, skateMaterialOverrides]);

  useEffect(() => () => {
    for (const override of skateMaterialOverrides) {
      const materials = Array.isArray(override.skating)
        ? override.skating
        : [override.skating];
      materials.forEach((material) => material.dispose());
    }
  }, [skateMaterialOverrides]);

  useEffect(() => {
    const group = heading.current;
    const scaledGroup = modelPosition.current;
    if (!group || !scaledGroup || canvasHeight === 0 || !(camera instanceof OrthographicCamera)) return;

    const baseScale = mapScale * CHARACTER_SCALE * (character.modelScale ?? 1);
    scaledGroup.scale.setScalar(baseScale);
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
    const targetHeight = sitAction
      ? (canvasHeight / MAP_H) * CHARACTER_HEIGHT * CHARACTER_SIZE_MULTIPLIER
      : 0;
    if (renderedHeight > 0 && targetHeight > 0) {
      scaledGroup.scale.setScalar(baseScale * targetHeight / renderedHeight);
    }
  }, [camera, canvasHeight, character.modelScale, heading, mapScale, model, modelPosition, sitAction]);

  return (
    <>
      <group
        ref={modelPosition}
        position={sittingSpot
          ? mapPointToWorld({ x: sittingSpot[0], y: sittingSpot[1] + BENCH_SEAT_Y_OFFSET }, mapScale)
          : undefined}
        scale={mapScale * CHARACTER_SCALE * (character.modelScale ?? 1)}
      >
        <group ref={heading} rotation={sittingSpot ? [0, sittingSpot[2], 0] : undefined}>
          <primitive ref={characterGroup} object={model} />
        </group>
      </group>
      <Sit character={characterGroup} active={isSitting} pose={sitPose} />
      {character.actions.skate && (
        <Skate
          character={characterGroup}
          active={isSkating}
          movement={character.actions.skate}
        />
      )}
    </>
  );
}

function CharacterModels({
  characters,
  refs,
  sittingSpots,
  skatingCharacters,
}: {
  characters: VillageCharacterData[];
  refs: CharacterRefs[];
  sittingSpots: ReadonlyMap<string, BenchSpot>;
  skatingCharacters: ReadonlySet<string>;
}) {
  const mapScale = useThree(({ size }) => size.width / MAP_W);

  return characters.map((character, index) => {
    const characterRefs = refs[index];
    if (!characterRefs) return null;

    return (
      <CharacterModel
        key={character.id}
        character={character}
        refs={characterRefs}
        isSitting={sittingSpots.has(character.id)}
        isSkating={skatingCharacters.has(character.id)}
        sittingSpot={sittingSpots.get(character.id)}
        mapScale={mapScale}
      />
    );
  });
}

interface BenchTarget {
  spot: BenchSpot;
  index: number;
  pathPoint: Pt;
}

function getBenchTargets(benches: readonly BenchSpot[]): BenchTarget[] {
  return benches.map((spot, index) => {
    const benchPoint = { x: spot[0], y: spot[1] };
    let closestPoint: Pt | undefined;
    let closestDistance = Infinity;

    for (const edge of EDGES) {
      const candidate = closestPointOnEdge(edge, benchPoint);
      const distance = Math.hypot(spot[0] - candidate.x, spot[1] - candidate.y);
      if (distance < closestDistance) {
        closestPoint = candidate;
        closestDistance = distance;
      }
    }

    if (!closestPoint) {
      throw new Error("Cannot place a bench interaction point because the path graph has no edges.");
    }
    return { spot, index, pathPoint: closestPoint };
  });
}

function CharacterWalker({
  character,
  refs,
  onSittingChange,
  onSkatingChange,
}: {
  character: VillageCharacterData;
  refs: CharacterRefs;
  onSittingChange: (characterId: string, spot: BenchSpot | null) => void;
  onSkatingChange: (characterId: string, skating: boolean) => void;
}) {
  const { modelPosition } = refs;
  const position = useRef<HTMLDivElement>(null);
  const activeBench = useRef<BenchSpot | null>(null);
  const lastSitAt = useRef(0);
  const approachedBenches = useRef(new Set<number>());
  const previousWalkPoint = useRef<Pt | null>(null);
  const reservationOwner = useRef(Symbol(character.id));
  const [sittingAt, setSittingAt] = useState<BenchSpot | null>(null);
  const benches = character.actions.sit?.benches;
  const benchTargets = useMemo(() => getBenchTargets(benches ?? []), [benches]);

  const handlePositionChange = (point: Pt) => {
    const mapScale = (position.current?.parentElement?.clientWidth ?? 0) / MAP_W;
    if (modelPosition.current && mapScale > 0) {
      modelPosition.current.position.set(...mapPointToWorld(point, mapScale));
    }

    const previousPoint = previousWalkPoint.current ?? point;
    for (const target of benchTargets) {
      const distance = Math.hypot(point.x - target.pathPoint.x, point.y - target.pathPoint.y);
      if (distance > BENCH_EXIT_RADIUS) approachedBenches.current.delete(target.index);

      const crossedInteractionRadius =
        distanceToSegment(target.pathPoint, previousPoint, point) <= BENCH_INTERACTION_RADIUS;
      if (!crossedInteractionRadius || approachedBenches.current.has(target.index)) continue;

      approachedBenches.current.add(target.index);
      if (
        activeBench.current ||
        isBenchOccupied(target.spot) ||
        Date.now() - lastSitAt.current < SIT_COOLDOWN ||
        Math.random() >= SIT_CHANCE ||
        !reserveBench(target.spot, reservationOwner.current)
      ) continue;

      lastSitAt.current = Date.now();
      activeBench.current = target.spot;
      if (position.current) {
        position.current.style.left = `${(target.spot[0] / MAP_W) * 100}%`;
        position.current.style.top = `${((target.spot[1] + BENCH_SEAT_Y_OFFSET) / MAP_H) * 100}%`;
      }
      setSittingAt(target.spot);
      onSittingChange(character.id, target.spot);
      previousWalkPoint.current = point;
      return;
    }
    previousWalkPoint.current = point;
  };

  useEffect(() => {
    if (!sittingAt) return;

    const owner = reservationOwner.current;
    const timeout = window.setTimeout(() => {
      releaseBench(sittingAt, owner);
      activeBench.current = null;
      setSittingAt(null);
      onSittingChange(character.id, null);
    }, SIT_DURATION_MIN + Math.random() * SIT_DURATION_RANGE);
    return () => {
      window.clearTimeout(timeout);
      releaseBench(sittingAt, owner);
    };
  }, [character.id, onSittingChange, sittingAt]);

  useEffect(() => () => {
    const occupiedBench = activeBench.current;
    if (occupiedBench) releaseBench(occupiedBench, reservationOwner.current);
  }, []);

  return (
    <>
      <div
        className="walking-character"
        ref={position}
        role="img"
        aria-label={`${character.name} caminant pel poble`}
        title={character.name}
      >
        <span
          className="character-name-target"
          data-character-name={character.name}
          aria-hidden="true"
        />
      </div>
      <Walking
        position={position}
        heading={refs.heading}
        enabled={sittingAt === null}
        skateDurationSeconds={character.actions.skate?.durationSeconds}
        onPositionChange={handlePositionChange}
        onSkatingChange={(skating) => onSkatingChange(character.id, skating)}
      />
    </>
  );
}

export function VillageCharacters({ characters }: { characters: VillageCharacterData[] }) {
  const refs = useMemo(
    () => characters.map(() => ({
      heading: createRef<Group>(),
      modelPosition: createRef<Group>(),
      character: createRef<Group>(),
    })),
    [characters],
  );
  const [sittingSpots, setSittingSpots] = useState<ReadonlyMap<string, BenchSpot>>(() => new Map());
  const [skatingCharacters, setSkatingCharacters] = useState<ReadonlySet<string>>(() => new Set());
  const handleSittingChange = useCallback((characterId: string, spot: BenchSpot | null) => {
    setSittingSpots((current) => {
      const next = new Map(current);
      if (spot) next.set(characterId, spot);
      else next.delete(characterId);
      return next;
    });
  }, []);
  const handleSkatingChange = useCallback((characterId: string, skating: boolean) => {
    setSkatingCharacters((current) => {
      const next = new Set(current);
      if (skating) next.add(characterId);
      else next.delete(characterId);
      return next;
    });
  }, []);

  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      aria-label="Personatges caminant pel poble"
    >
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
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[3, 5, 4]} intensity={2.5} />
        <CharacterModels
          characters={characters}
          refs={refs}
          sittingSpots={sittingSpots}
          skatingCharacters={skatingCharacters}
        />
      </Canvas>
      <div style={{ position: "absolute", inset: 0 }}>
        {characters.map((character, index) => {
          const characterRefs = refs[index];
          return characterRefs
            ? (
              <CharacterWalker
                key={character.id}
                character={character}
                refs={characterRefs}
                onSittingChange={handleSittingChange}
                onSkatingChange={handleSkatingChange}
              />
            )
            : null;
        })}
      </div>
    </div>
  );
}
