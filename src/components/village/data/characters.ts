import { BENCH_SPOTS } from "./spots";
import type { BenchSpot } from "./spots";
import type { SitPose } from "../movement/Sit";
import type { SkateMovementConfig } from "../movement/Skate";
import { getCharacterName, getLanguage } from "../../../i18n";

export interface VillageCharacterData {
  id: string;
  modelPath: string;
  name: string;
  displayScale: number;
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
}

export const CHARACTER_DISPLAY_SIZE = {
  mapHeight: 23,
  multiplier: 1.5,
  sceneScale: 0.92 * 1.2,
  standaloneScale: 3.5,
} as const;

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
    id: "albert-marine-espacial",
    modelPath: "/models/characters/albert/marine_espacial.glb",
    name: "Marine Espacial",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "ana-perez",
    modelPath: "/models/characters/all/ana.glb",
    name: "Ana Pérez",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-comisario",
    modelPath: "/models/characters/albert/comisario.glb",
    name: "Comissari",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-adepta-sororitas",
    modelPath: "/models/characters/albert/adepta_sororitas.glb",
    name: "Adepta Sororitas",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-astra-militarum",
    modelPath: "/models/characters/albert/astra_militarum.glb",
    name: "Astra Militarum",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-chaos",
    modelPath: "/models/characters/albert/chaos.glb",
    name: "Chaos",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-tau",
    modelPath: "/models/characters/albert/tau.glb",
    name: "T'au",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-necron",
    modelPath: "/models/characters/albert/necron.glb",
    name: "Necron",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-eldar",
    modelPath: "/models/characters/albert/eldar.glb",
    name: "Eldar",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-orco",
    modelPath: "/models/characters/albert/orco.glb",
    name: "Orco",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-emperador",
    modelPath: "/models/characters/albert/emperador.glb",
    name: "Emperador",
    displayScale: 1,
    actions: {
      walk: { animation: "Walk" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "albert-kroot-hound",
    modelPath: "/models/characters/albert/kroot_hound.glb",
    name: "Kroot Hound",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "albert-manticore",
    modelPath: "/models/characters/albert/manticore.glb",
    name: "Manticore",
    displayScale: 1.2,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "albert-llop-de-fenris",
    modelPath: "/models/characters/albert/llop_de_Fenris.glb",
    name: "Llop de Fenris",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "albert-mastin-khorne",
    modelPath: "/models/characters/albert/mastin_khorne.glb",
    name: "Mastín de Khorne",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "albert-squig-hound",
    modelPath: "/models/characters/albert/squig_hound.glb",
    name: "Squig Hound",
    displayScale: 1,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "mama-elf",
    modelPath: "/models/characters/mama/elf.glb",
    name: "Elfo",
    displayScale: 1,
    actions: {
      walk: { animation: "walk_loop" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "mama-nutcracker",
    modelPath: "/models/characters/mama/nutcracker.glb",
    name: "Cascanueces",
    displayScale: 1,
    actions: {
      walk: { animation: "march_loop" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "mama-penguin",
    modelPath: "/models/characters/mama/penguin.glb",
    name: "Pingüino",
    displayScale: 1,
    actions: { walk: { animation: "waddle_loop" } },
  },
  {
    id: "mama-reindeer",
    modelPath: "/models/characters/mama/reindeer.glb",
    name: "Reno",
    displayScale: 0.8,
    actions: { walk: { animation: "walk_loop" } },
  },
  {
    id: "mama-santa",
    modelPath: "/models/characters/mama/santa.glb",
    name: "Papá Noel",
    displayScale: 1,
    actions: {
      walk: { animation: "walk_loop" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "mama-snowman",
    modelPath: "/models/characters/mama/snowman.glb",
    name: "Muñeco de nieve",
    displayScale: 1,
    actions: { walk: { animation: "wave_sway_loop" } },
  },
  {
    id: "mama-baker",
    modelPath: "/models/characters/mama/baker.glb",
    name: "Panadero",
    displayScale: 1,
    actions: {
      walk: { animation: "walk_loop" },
      sit: { benches: BENCH_SPOTS, pose: SIT_POSE },
      skate: SKATE_ACTION,
    },
  },
  {
    id: "all-crispeta",
    modelPath: "/models/characters/all/crispeta.glb",
    name: "Crispeta",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "all-tequi",
    modelPath: "/models/characters/all/tequi.glb",
    name: "Tequi",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
  {
    id: "all-albert",
    modelPath: "/models/characters/all/albert.glb",
    name: "Albert",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "albert-isma",
    modelPath: "/models/characters/albert/isma.glb",
    name: "Isma",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "albert-sergi",
    modelPath: "/models/characters/albert/sergi.glb",
    name: "Sergi",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "albert-ivan",
    modelPath: "/models/characters/albert/ivan.glb",
    name: "Ivan",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "albert-clara",
    modelPath: "/models/characters/albert/clara.glb",
    name: "Clara",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-nura",
    modelPath: "/models/characters/ana/nura.glb",
    name: "Nura",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-brimstone",
    modelPath: "/models/characters/ana/brimstone.glb",
    name: "Brimstone",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-sage",
    modelPath: "/models/characters/ana/sage.glb",
    name: "Sage",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-yoru",
    modelPath: "/models/characters/ana/yoru.glb",
    name: "Yoru",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-tejo",
    modelPath: "/models/characters/ana/tejo.glb",
    name: "Tejo",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-sova",
    modelPath: "/models/characters/ana/sova.glb",
    name: "Sova",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-killjoy",
    modelPath: "/models/characters/ana/killjoy.glb",
    name: "Killjoy",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-chamber",
    modelPath: "/models/characters/ana/chamber.glb",
    name: "Chamber",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-jett",
    modelPath: "/models/characters/ana/jett.glb",
    name: "Jett",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-cypher",
    modelPath: "/models/characters/ana/cypher.glb",
    name: "Cypher",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-phoenix",
    modelPath: "/models/characters/ana/phoenix.glb",
    name: "Phoenix",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "ana-raze",
    modelPath: "/models/characters/ana/raze.glb",
    name: "Raze",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-zombie",
    modelPath: "/models/characters/papa/zombie.glb",
    name: "Zombi",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-ezequiel",
    modelPath: "/models/characters/papa/ezequiel.glb",
    name: "Ezequiel",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-governador",
    modelPath: "/models/characters/papa/governador.glb",
    name: "Governador",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-carol-peletier",
    modelPath: "/models/characters/papa/carol_peletier.glb",
    name: "Carol Peletier",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-negan",
    modelPath: "/models/characters/papa/negan.glb",
    name: "Negan",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-michonne",
    modelPath: "/models/characters/papa/michonne.glb",
    name: "Michonne",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-daryl-dixon",
    modelPath: "/models/characters/papa/daryl_dixon.glb",
    name: "Daryl Dixon",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-rick-grimes",
    modelPath: "/models/characters/papa/rick_grimes.glb",
    name: "Rick Grimes",
    displayScale: 1,
    actions: { walk: { animation: "Walk" } },
  },
  {
    id: "papa-tigre",
    modelPath: "/models/characters/papa/tigre.glb",
    name: "Tigre",
    displayScale: 0.8,
    actions: { walk: { animation: "trot_loop" } },
  },
];

export function getCharactersForUser(username?: string): VillageCharacterData[] {
  const user = username?.trim().toLowerCase();
  if (!user) return VILLAGE_CHARACTERS;
  const owner = user === "jordi" ? "papa" : user === "caty" ? "mama" : user;
  const language = getLanguage(user);

  return VILLAGE_CHARACTERS.filter((character) => {
    const folders = character.modelPath.split("/");
    const characterOwner = folders.at(-2)?.toLowerCase();

    return !characterOwner || characterOwner === "all" || characterOwner === owner;
  }).map((character) => ({
    ...character,
    name: getCharacterName(character.name, language),
  }));
}
