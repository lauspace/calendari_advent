/* ===================================================================
 * houses.ts — datos, geometrías, materiales y lógica de la casa 3D
 * (sin JSX). Pareja de Houses3D.tsx.
 *
 * - 12 variantes de casa (VARIANTS). Para 24 casas usa variantForDay(día).
 * - Geometrías unitarias y materiales compartidos entre todas las casas.
 * - Dimensiones y recursos por variante (getAssets), cacheados.
 * - useHouseGlow: encendido/apagado suave de ventanas y bombillas.
 *
 * Ejes: Y arriba; la fachada con la puerta mira a +Z.
 * =================================================================== */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type V3 = [number, number, number];

/* ----------------------------- Variantes ----------------------------- */

export type YardDeco = "tree" | "snowman" | "lantern" | "firewood" | "gifts";
export type DoorDeco = "wreath" | "garland" | "star";
export type LightLayout = "all" | "gable" | "eaves";
export type Topper = "none" | "star" | "vane";
export type Annex = "none" | "left" | "right";

export interface HouseVariant {
  name: string;
  /** ancho (X), fondo (Z), alto de paredes, altura extra del hastial */
  w: number;
  l: number;
  h: number;
  r: number;
  wall: string;
  trim: string;
  door: string;
  roof: string;
  /** color de los marcos de ventana y puerta */
  frame: string;
  /** líneas de tablones en las paredes (0 = lisa) */
  planks: number;
  /** x/z = posición (el signo de x elige el lado del tejado); w = lado de la base; h = altura */
  chimney: { x: number; z: number; w: number; h: number; stone?: boolean };
  /** color de las contraventanas, o null */
  shutters: string | null;
  porch: boolean;
  annex: Annex;
  topper: Topper;
  doorDeco: DoorDeco;
  yard: YardDeco;
  /** lado (X) donde va la decoración del jardín */
  yardSide: 1 | -1;
  lights: { colors: string[]; layout: LightLayout };
  /** ventanas en la fachada y en cada lateral */
  front: 1 | 2;
  side: 1 | 2;
  /** color de la luz de las ventanas */
  glass: string;
}

const MULTI = ["#ff6b57", "#ffd27a", "#ffa63d", "#8fd694"];
const WARM = ["#ffd27a", "#ffb454", "#ffe6a8"];
const REDWHITE = ["#ff6b57", "#fff2d6", "#ff6b57", "#fff2d6"];
const ICE = ["#bfe3ff", "#fff2d6", "#9fd3ff"];
const DARK = "#3a2418";

const BASE: Omit<HouseVariant, "name"> = {
  w: 2,
  l: 2.4,
  h: 1.4,
  r: 0.85,
  wall: "#8c4a37",
  trim: "#6b3a2c",
  door: "#5e3022",
  roof: "#3b4250",
  frame: DARK,
  planks: 4,
  chimney: { x: 0.55, z: -0.4, w: 0.34, h: 1.0 },
  shutters: null,
  porch: false,
  annex: "none",
  topper: "none",
  doorDeco: "wreath",
  yard: "tree",
  yardSide: 1,
  lights: { colors: MULTI, layout: "all" },
  front: 1,
  side: 2,
  glass: "#ffa63d",
};

const mk = (name: string, o: Partial<Omit<HouseVariant, "name">> = {}): HouseVariant => ({ name, ...BASE, ...o });

export const VARIANTS: HouseVariant[] = [
  mk("Clásica"),
  mk("Porche", {
    w: 2.1, r: 0.8, wall: "#9a5a3f", trim: "#d9c9ad", door: "#2f5d4a", frame: "#d9c9ad", planks: 3,
    chimney: { x: -0.6, z: -0.3, w: 0.34, h: 1.0 }, porch: true, doorDeco: "garland", yard: "gifts",
    lights: { colors: WARM, layout: "gable" }, glass: "#ffb454",
  }),
  mk("Anexo", {
    l: 2.5, h: 1.35, r: 0.9, wall: "#a0553a", roof: "#4a3a33", planks: 5, annex: "left",
    chimney: { x: 0.6, z: -0.45, w: 0.34, h: 1.0 }, yard: "firewood", lights: { colors: MULTI, layout: "eaves" },
  }),
  mk("Contraventanas", {
    l: 2.3, wall: "#b07a43", trim: "#f0e6d2", door: "#2f5d4a", frame: "#f0e6d2", planks: 0, shutters: "#2f5d4a",
    chimney: { x: -0.55, z: 0, w: 0.34, h: 1.0 }, yard: "snowman", lights: { colors: WARM, layout: "all" },
    glass: "#ff9a3c",
  }),
  mk("Torre", {
    w: 1.7, l: 1.9, h: 1.9, r: 1.0, wall: "#7d3f2f", trim: "#5a2f23", roof: "#2f3540", planks: 5,
    chimney: { x: 0.4, z: -0.3, w: 0.3, h: 1.1 }, topper: "star", doorDeco: "star", yard: "lantern", yardSide: -1,
    lights: { colors: REDWHITE, layout: "gable" }, glass: "#ffd27a",
  }),
  mk("Cabaña", {
    w: 2.2, l: 2.6, h: 1.25, r: 0.7, wall: "#80603f", trim: "#5a4129", door: "#4a2e1f", roof: "#4a3a33", planks: 8,
    chimney: { x: 0.6, z: -0.5, w: 0.4, h: 0.9, stone: true }, porch: true, yard: "firewood", yardSide: -1,
    lights: { colors: WARM, layout: "eaves" }, glass: "#ffc060",
  }),
  mk("Salvia", {
    wall: "#6b8266", trim: "#efe6d2", door: "#8c4a37", frame: "#efe6d2", planks: 0, shutters: "#efe6d2",
    chimney: { x: 0.5, z: -0.4, w: 0.34, h: 1.0 }, yard: "tree", yardSide: -1, lights: { colors: MULTI, layout: "gable" },
  }),
  mk("Cottage ancho", {
    w: 2.7, l: 2.2, h: 1.25, r: 0.7, wall: "#9b5640", trim: "#e9dcc4", frame: "#e9dcc4", planks: 3,
    chimney: { x: 0.9, z: -0.3, w: 0.4, h: 0.9, stone: true }, doorDeco: "garland", yard: "snowman", topper: "vane",
    front: 2, side: 1, lights: { colors: MULTI, layout: "eaves" },
  }),
  mk("Azul", {
    h: 1.5, r: 0.9, wall: "#5d7488", trim: "#e6edf4", frame: "#e6edf4", roof: "#2f3540", planks: 0, annex: "right",
    chimney: { x: -0.55, z: -0.4, w: 0.34, h: 1.0, stone: true }, topper: "star", doorDeco: "star", yard: "tree",
    yardSide: -1, lights: { colors: ICE, layout: "all" }, glass: "#ffcf7a",
  }),
  mk("Burdeos", {
    w: 2.1, wall: "#7a2f3a", trim: "#e9dcc4", door: "#2f5d4a", frame: "#e9dcc4", porch: true,
    chimney: { x: 0.6, z: -0.4, w: 0.34, h: 1.0 }, yard: "tree", lights: { colors: REDWHITE, layout: "all" },
  }),
  mk("Mostaza", {
    w: 1.9, h: 1.5, r: 0.8, wall: "#b88a3e", trim: "#6b4a22", roof: "#4a3a33", planks: 0, shutters: "#6b4a22",
    chimney: { x: 0.5, z: -0.4, w: 0.32, h: 1.0 }, yard: "snowman", yardSide: -1, glass: "#ff9a3c",
  }),
  mk("Jengibre", {
    w: 2.1, h: 1.35, r: 0.95, wall: "#d9c3a0", trim: "#8a3b32", door: "#8a3b32", roof: "#8a3b32", frame: "#8a3b32",
    planks: 0, shutters: "#8a3b32", chimney: { x: 0.5, z: -0.4, w: 0.34, h: 1.0 }, topper: "star",
    doorDeco: "garland", yard: "lantern", glass: "#ffb454",
  }),
];

export const HOUSE_VARIANT_COUNT = VARIANTS.length; // 12

/** Reparto de variantes por día (1..24): sin repetir en días consecutivos y cada variante sale dos veces */
const ORDER = [0, 5, 2, 9, 4, 11, 6, 1, 8, 3, 10, 7];
export function variantForDay(day: number): number {
  const i = Math.max(0, Math.min(23, Math.floor(day) - 1));
  return i < 12 ? ORDER[i] : ORDER[(i - 12 + 6) % 12];
}

/* ------------------------------ Medidas ------------------------------ */

export interface Dims {
  W: number;
  L: number;
  H: number;
  R: number;
  FH: number; // cimientos
  WALL_TOP: number;
  ANGLE: number; // inclinación del tejado
  HYP: number; // largo de una vertiente (sin vuelo)
  OV: number; // vuelo del alero
  ROOF_T: number;
  SNOW_T: number;
  LZ: number; // largo del tejado
}

export function makeDims(w: number, l: number, h: number, r: number, ov = 0.22, lzExtra = 0.3): Dims {
  const FH = 0.16;
  return {
    W: w, L: l, H: h, R: r, FH, WALL_TOP: FH + h,
    ANGLE: Math.atan2(r, w / 2), HYP: Math.hypot(w / 2, r),
    OV: ov, ROOF_T: 0.07, SNOW_T: 0.09, LZ: l + lzExtra,
  };
}

/** Paredes + hastial en una sola pieza: perfil extruido a lo largo de Z */
export function makeBodyGeometry(d: Dims) {
  const s = new THREE.Shape();
  s.moveTo(-d.W / 2, 0);
  s.lineTo(d.W / 2, 0);
  s.lineTo(d.W / 2, d.H);
  s.lineTo(0, d.H + d.R);
  s.lineTo(-d.W / 2, d.H);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: d.L, bevelEnabled: false });
}

/* ------------------- Geometrías y materiales compartidos ------------------- */

/** Geometrías unitarias: el tamaño se da con `scale` en cada malla */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.SphereGeometry(1, 14, 10),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 12),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(1, 28),
  ring: new THREE.RingGeometry(0.7, 1, 28),
  octa: new THREE.OctahedronGeometry(1, 0),
  wreath: new THREE.TorusGeometry(0.115, 0.04, 10, 28),
  bulb: new THREE.SphereGeometry(0.045, 10, 8),
};

const std = (color: THREE.ColorRepresentation, extra: Record<string, unknown> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });

export const M = {
  stone: std("#5f6472"),
  wood: std("#6b4a30"),
  log: std("#7a5a3c"),
  dark: std("#2a2f3a"),
  coal: std("#1c1f26"),
  snow: std("#f6f9fc", { roughness: 1 }),
  red: std("#ff6b57"),
  carrot: std("#ff8a3d"),
  gold: std("#ffd27a", { emissive: new THREE.Color("#ffd27a"), emissiveIntensity: 0.45 }),
  star: std("#ffd27a", { emissive: new THREE.Color("#ffcf7a"), emissiveIntensity: 1.2 }),
  wreath: std("#2f5d4a"),
  green1: std("#3f7d62"),
  green2: std("#386b55"),
  green3: std("#2f5d4a"),
  line: std("#2a140e", { transparent: true, opacity: 0.22 }),
  shadow: new THREE.MeshBasicMaterial({ color: "#7b8ea5", transparent: true, opacity: 0.28, depthWrite: false }),
};

/* --------------------------- Recursos por variante --------------------------- */

export interface AnnexAssets {
  d: Dims;
  body: THREE.ExtrudeGeometry;
  /** centro del anexo en X y Z, y lado (-1 izquierda, 1 derecha) */
  x: number;
  z: number;
  side: -1 | 1;
}

export interface Assets {
  v: HouseVariant;
  d: Dims;
  body: THREE.ExtrudeGeometry;
  wallCap: THREE.MeshStandardMaterial;
  wallSide: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  chimney: THREE.MeshStandardMaterial;
  shutter: THREE.MeshStandardMaterial | null;
  bulbs: V3[];
  annex: AnnexAssets | null;
}

/** Bombillas: bajo los bordes de los dos hastiales y/o a lo largo de los aleros laterales */
function bulbPositions(d: Dims, layout: LightLayout): V3[] {
  const out: V3[] = [];
  const sinA = Math.sin(d.ANGLE);
  const cosA = Math.cos(d.ANGLE);
  if (layout !== "eaves") {
    for (const zs of [1, -1]) {
      for (const s of [-1, 1]) {
        for (const t of [0.12, 0.31, 0.5, 0.69, 0.88]) {
          const px = ((s * d.W) / 2) * (1 - t);
          const py = d.WALL_TOP + d.R * t;
          out.push([px - s * sinA * 0.1, py - cosA * 0.1, zs * (d.L / 2 + 0.07)]);
        }
      }
    }
  }
  if (layout !== "gable") {
    const n = layout === "eaves" ? 9 : 7;
    const half = d.L / 2 - 0.2;
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) out.push([s * (d.W / 2 + 0.05), d.WALL_TOP - 0.12, -half + (i * 2 * half) / (n - 1)]);
    }
  }
  return out;
}

function build(i: number): Assets {
  const v = VARIANTS[i];
  const d = makeDims(v.w, v.l, v.h, v.r);

  let annex: AnnexAssets | null = null;
  if (v.annex !== "none") {
    const side = v.annex === "left" ? -1 : 1;
    const aw = 0.95;
    const al = d.L * 0.55;
    const ad = makeDims(aw, al, d.H * 0.62, 0.45, 0.15, 0.2);
    annex = { d: ad, body: makeBodyGeometry(ad), x: side * (d.W / 2 + aw / 2 - 0.03), z: d.L / 2 - al / 2, side };
  }

  return {
    v,
    d,
    body: makeBodyGeometry(d),
    wallCap: std(v.wall),
    wallSide: std(new THREE.Color(v.wall).multiplyScalar(0.93)),
    trim: std(v.trim),
    door: std(v.door),
    roof: std(v.roof),
    frame: std(v.frame),
    chimney: std(v.chimney.stone ? "#6b6f7b" : "#6b3a2c"),
    shutter: v.shutters ? std(v.shutters) : null,
    bulbs: bulbPositions(d, v.lights.layout),
    annex,
  };
}

const cache = new Map<number, Assets>();

/** Recursos de la variante `i` (0..11; se normaliza). Se crean una vez y se reutilizan. */
export function getAssets(i: number): Assets {
  const n = HOUSE_VARIANT_COUNT;
  const idx = ((Math.floor(i) % n) + n) % n;
  let a = cache.get(idx);
  if (!a) {
    a = build(idx);
    cache.set(idx, a);
  }
  return a;
}

/* ------------------------------ Luces animadas ------------------------------ */

const GLASS_OFF = new THREE.Color("#39404d");
const BULB_OFF = new THREE.Color("#5b6070");

/** Materiales de luz de UNA casa. Al cambiar `lit` hay una transición suave. */
export function useHouseGlow(lit: boolean, v: HouseVariant, intensity = 1) {
  /** 0 = apagado; los valores mayores aumentan la intensidad del brillo */
  const [initialGlow] = useState(lit ? intensity : 0);
  const k = useRef(initialGlow);

  const mats = useMemo(() => {
    const glassOn = new THREE.Color(v.glass);
    const glass = new THREE.MeshStandardMaterial({ roughness: 0.25, emissive: glassOn });
    const bulbOn = v.lights.colors.map((c) => new THREE.Color(c));
    const bulbs = bulbOn.map(() => new THREE.MeshStandardMaterial({ roughness: 0.4 }));
    const apply = (t: number) => {
      glass.color.lerpColors(GLASS_OFF, glassOn, t);
      glass.emissiveIntensity = 1.1 * t;
      bulbs.forEach((m, i) => {
        m.color.lerpColors(BULB_OFF, bulbOn[i], t);
        m.emissive.copy(bulbOn[i]);
        m.emissiveIntensity = 1.6 * t;
      });
    };
    apply(initialGlow);
    return { glass, bulbs, apply };
  }, [initialGlow, v]);

  useFrame((_, dt) => {
    const target = lit ? intensity : 0;
    if (k.current === target) return;
    k.current =
      Math.abs(target - k.current) < 0.005 ? target : k.current + (target - k.current) * Math.min(1, dt * 6);
    mats.apply(k.current);
  });

  useEffect(
    () => () => {
      mats.glass.dispose();
      mats.bulbs.forEach((m) => m.dispose());
    },
    [mats]
  );

  return { glass: mats.glass, bulbs: mats.bulbs, k };
}
