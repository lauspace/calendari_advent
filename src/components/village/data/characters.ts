import { BENCH_SPOTS } from "./spots";
import type { BenchSpot } from "./spots";
import type { SitPose } from "../movement/Sit";
import type { SkateMovementConfig } from "../movement/Skate";

export interface VillageCharacterData {
  id: string;
  modelPath: string;
  name: string;
  modelScale?: number;
  actions: {
    walk: {
      animation: string;
    };
    sit?: {
      benches: readonly BenchSpot[];
      pose?: SitPose;
      scale?: number;
    };
    skate?: SkateMovementConfig;
  };
}

export interface WalkingCharacterData {
  modelPath: string;
  name: string;
  walkAnimation: string;
  modelScale?: number;
}

const SIT_POSE: SitPose = {
  torso_bone: [-0.12, 0, 0],
  leg_upper_right_bone: [Math.PI / 2, 0, 0],
  leg_lower_right_bone: [-Math.PI / 2, 0, 0],
  leg_upper_left_bone: [Math.PI / 2, 0, 0],
  leg_lower_left_bone: [-Math.PI / 2, 0, 0],
};

const SKATE_ACTION: SkateMovementConfig = {
  durationSeconds: 25,
  pushAngle: 0.32,
  kneeBend: 0.28,
  armBalance: 0.18,
};

export const VILLAGE_CHARACTERS: VillageCharacterData[] = [
  {
    id: "sam",
    modelPath: "/models/characters/elf.glb",
    name: "Sam",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "teo",
    modelPath: "/models/characters/elf.glb",
    name: "Teo",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-marine-espacial",
    modelPath: "/models/characters/albert_marine_espacial.glb",
    name: "Marine Espacial",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "ana-perez",
    modelPath: "/models/characters/ana_perez.glb",
    name: "Ana Pérez",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-comisario",
    modelPath: "/models/characters/albert_comisario.glb",
    name: "Comissari",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-adepta-sororitas",
    modelPath: "/models/characters/albert_adepta_sororitas.glb",
    name: "Adepta Sororitas",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-astra-militarum",
    modelPath: "/models/characters/albert_astra_militarum.glb",
    name: "Astra Militarum",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-chaos",
    modelPath: "/models/characters/albert_chaos.glb",
    name: "Chaos",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-tau",
    modelPath: "/models/characters/albert_tau.glb",
    name: "T'au",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-necron",
    modelPath: "/models/characters/albert_necron.glb",
    name: "Necron",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-eldar",
    modelPath: "/models/characters/albert_eldar.glb",
    name: "Eldar",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-orco",
    modelPath: "/models/characters/albert_orco.glb",
    name: "Orco",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-emperador",
    modelPath: "/models/characters/albert_emperador.glb",
    name: "Emperador",
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "arctic-fox",
    modelPath: "/models/characters/arctic-fox.glb",
    name: "Guineu àrtica",
    modelScale: 0.5,
    actions: {
      walk: { animation: "trot_loop" },
      skate: SKATE_ACTION,
    },
  },
];
