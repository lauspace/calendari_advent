/* ===================================================================
 * Houses3D.tsx — componentes react-three-fiber de las casas navideñas.
 * Pareja de houses.ts (datos, geometrías, materiales y lógica).
 *
 *   <House3D variant={3} lit rotationX={0.35} />        // una casa
 *   <House3D variant={variantForDay(day)} />            // casa del día N (1..24)
 *   <HouseGallery />                                    // las 12 variantes, para verlas
 *
 * Origen del grupo = centro de la casa a nivel del suelo; Y arriba; la fachada mira a +Z.
 * rotationX / rotationY (radianes) giran toda la casa con su decoración. Para inclinar el
 * MAPA entero, pon la rotación en un <group> padre en vez de girar cada casa por separado.
 * =================================================================== */
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  G, M, VARIANTS, HOUSE_VARIANT_COUNT, getAssets, useHouseGlow,
  type Assets, type Dims, type V3,
} from "./houses";

/* ------------------------------ Primitivas ------------------------------ */

interface PartProps {
  p?: V3; // posición
  s?: V3 | number; // escala
  r?: V3; // rotación (radianes)
  m: THREE.Material | THREE.Material[];
  cast?: boolean;
  receive?: boolean;
}

const part = (geometry: THREE.BufferGeometry) =>
  function Part({ p, s = 1, r, m, cast, receive }: PartProps) {
    return (
      <mesh geometry={geometry} material={m} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow={receive} />
    );
  };

const Box = part(G.box);
const Ball = part(G.ball);
const Cyl = part(G.cyl);
const Cone = part(G.cone);

/* -------------------------------- Cuerpo -------------------------------- */

/** Cimientos, paredes con hastial, vigas de esquina y líneas de tablones */
function Shell({ d, a, body, planks }: { d: Dims; a: Assets; body: THREE.BufferGeometry; planks: number }) {
  const corners: Array<[number, number]> = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <group>
      <Box p={[0, d.FH / 2, 0]} s={[d.W + 0.1, d.FH, d.L + 0.1]} m={M.stone} receive />
      <mesh geometry={body} material={[a.wallCap, a.wallSide]} position={[0, d.FH, -d.L / 2]} castShadow receiveShadow />
      {corners.map(([cx, cz], i) => (
        <Box key={i} p={[(cx * d.W) / 2, d.FH + d.H / 2, (cz * d.L) / 2]} s={[0.09, d.H, 0.09]} m={a.trim} />
      ))}
      {Array.from({ length: planks }, (_, i) => {
        const y = d.FH + ((i + 1) * d.H) / (planks + 1);
        return (
          <group key={i}>
            <Box p={[d.W / 2 + 0.004, y, 0]} s={[0.008, 0.014, d.L]} m={M.line} />
            <Box p={[-d.W / 2 - 0.004, y, 0]} s={[0.008, 0.014, d.L]} m={M.line} />
            <Box p={[0, y, d.L / 2 + 0.004]} s={[d.W, 0.014, 0.008]} m={M.line} />
            <Box p={[0, y, -d.L / 2 - 0.004]} s={[d.W, 0.014, 0.008]} m={M.line} />
          </group>
        );
      })}
    </group>
  );
}

/** Tejado a dos aguas con nieve de grosor, bultos en los aleros y cumbrera nevada */
function Roof({ d, a }: { d: Dims; a: Assets }) {
  const sinA = Math.sin(d.ANGLE);
  const cosA = Math.cos(d.ANGLE);
  const slab = d.HYP + d.OV;
  const lumpZ = [-0.38, -0.2, -0.02, 0.16, 0.34].map((f) => f * d.L);
  // pose de una losa en la vertiente s (-1 izquierda, 1 derecha), separada `off` de la pared
  const pose = (s: -1 | 1, off: number): { p: V3; rz: number } => ({
    p: [
      (s * d.W) / 4 + s * sinA * off + (s * cosA * d.OV) / 2,
      d.WALL_TOP + d.R / 2 + cosA * off - (sinA * d.OV) / 2,
      0,
    ],
    rz: -s * d.ANGLE,
  });
  return (
    <group>
      {([-1, 1] as const).map((s) => {
        const base = pose(s, d.ROOF_T / 2);
        const snow = pose(s, d.ROOF_T + d.SNOW_T / 2);
        return (
          <group key={s}>
            <Box p={base.p} r={[0, 0, base.rz]} s={[slab, d.ROOF_T, d.LZ]} m={a.roof} cast />
            <Box p={snow.p} r={[0, 0, snow.rz]} s={[slab - 0.04, d.SNOW_T, d.LZ - 0.06]} m={M.snow} cast />
            {lumpZ.map((z, i) => (
              <Ball
                key={i}
                p={[s * (d.W / 2 + d.OV * cosA - 0.03), d.WALL_TOP - d.OV * sinA + d.ROOF_T + d.SNOW_T * 0.6, z]}
                s={[0.1, 0.05, 0.16 + 0.03 * (i % 2)]}
                m={M.snow}
              />
            ))}
          </group>
        );
      })}
      <Cyl p={[0, d.WALL_TOP + d.R + 0.07, 0]} r={[Math.PI / 2, 0, 0]} s={[0.13, d.LZ - 0.06, 0.13]} m={M.snow} />
    </group>
  );
}

/** Ventana con marco, cruceta, alféizar nevado y contraventanas opcionales. +Z hacia fuera. */
function Window({
  p, ry = 0, glass, a, w = 0.5, h = 0.55, shutters = false,
}: { p: V3; ry?: number; glass: THREE.Material; a: Assets; w?: number; h?: number; shutters?: boolean }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0, 0.02]} s={[w + 0.1, h + 0.1, 0.05]} m={a.frame} />
      <mesh geometry={G.plane} material={glass} position={[0, 0, 0.048]} scale={[w, h, 1]} />
      <Box p={[0, 0, 0.056]} s={[0.03, h, 0.02]} m={a.frame} />
      <Box p={[0, 0, 0.056]} s={[w, 0.03, 0.02]} m={a.frame} />
      <Box p={[0, -(h / 2 + 0.08), 0.07]} s={[w + 0.18, 0.05, 0.14]} m={M.stone} />
      <Box p={[0, -(h / 2 + 0.045), 0.07]} s={[w + 0.14, 0.04, 0.12]} m={M.snow} />
      {shutters && a.shutter && (
        <>
          <Box p={[-(w / 2 + 0.14), 0, 0.03]} s={[0.16, h + 0.1, 0.03]} m={a.shutter} />
          <Box p={[w / 2 + 0.14, 0, 0.03]} s={[0.16, h + 0.1, 0.03]} m={a.shutter} />
        </>
      )}
    </group>
  );
}

/* ------------------------- Puerta, porche y adornos ------------------------- */

const BERRY_ANGLES = [0.9, 2.4, 4.6];

/** Puerta con adorno navideño (corona, guirnalda o estrella). Origen = base de la puerta. */
function Door({ a, p }: { a: Assets; p: V3 }) {
  const deco = a.v.doorDeco;
  return (
    <group position={p}>
      <Box p={[0, 0.49, 0.02]} s={[0.52, 0.98, 0.05]} m={a.frame} />
      <Box p={[0, 0.46, 0.035]} s={[0.42, 0.9, 0.05]} m={a.door} />
      <Box p={[0, 0.46, 0.062]} s={[0.012, 0.9, 0.005]} m={M.line} />
      <Ball p={[0.14, 0.45, 0.078]} s={0.03} m={M.gold} />
      {!a.v.porch && (
        <>
          <Box p={[0, 0.03, 0.17]} s={[0.62, 0.06, 0.3]} m={M.stone} />
          <Box p={[0, 0.07, 0.17]} s={[0.6, 0.04, 0.28]} m={M.snow} />
        </>
      )}

      {deco === "wreath" && (
        <>
          <mesh geometry={G.wreath} material={M.wreath} position={[0, 0.64, 0.085]} />
          {BERRY_ANGLES.map((an, i) => (
            <Ball key={i} p={[0.115 * Math.cos(an), 0.64 + 0.115 * Math.sin(an), 0.115]} s={0.022} m={M.red} />
          ))}
          <Ball p={[0, 0.525, 0.115]} s={[0.05, 0.035, 0.03]} m={M.red} />
          <Box p={[-0.03, 0.49, 0.11]} s={[0.025, 0.07, 0.01]} r={[0, 0, 0.35]} m={M.red} />
          <Box p={[0.03, 0.49, 0.11]} s={[0.025, 0.07, 0.01]} r={[0, 0, -0.35]} m={M.red} />
        </>
      )}
      {deco === "garland" && (
        <>
          <Box p={[0, 0.99, 0.06]} s={[0.58, 0.07, 0.05]} m={M.wreath} />
          <Box p={[-0.285, 0.5, 0.06]} s={[0.06, 0.98, 0.05]} m={M.wreath} />
          <Box p={[0.285, 0.5, 0.06]} s={[0.06, 0.98, 0.05]} m={M.wreath} />
          {[-0.285, 0, 0.285].map((x) => (
            <Ball key={x} p={[x, 0.99, 0.1]} s={[0.05, 0.04, 0.025]} m={M.red} />
          ))}
          {[0.3, 0.55, 0.78].map((y) => (
            <group key={y}>
              <Ball p={[-0.285, y, 0.092]} s={0.02} m={M.gold} />
              <Ball p={[0.285, y, 0.092]} s={0.02} m={M.gold} />
            </group>
          ))}
        </>
      )}
      {deco === "star" && (
        <>
          <mesh geometry={G.octa} material={M.star} position={[0, 0.66, 0.09]} scale={[0.12, 0.12, 0.03]} />
          <Ball p={[0, 0.5, 0.1]} s={[0.045, 0.032, 0.02]} m={M.red} />
          <Ball p={[-0.14, 0.78, 0.085]} s={0.02} m={M.gold} />
          <Ball p={[0.14, 0.78, 0.085]} s={0.02} m={M.gold} />
        </>
      )}
    </group>
  );
}

/** Porche: suelo de madera, dos postes y un tejadillo nevado sobre la puerta */
function Porch({ a, p }: { a: Assets; p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.05, 0.4]} s={[0.95, 0.1, 0.8]} m={M.wood} receive />
      <Box p={[-0.4, 0.6, 0.72]} s={[0.07, 1.0, 0.07]} m={a.trim} />
      <Box p={[0.4, 0.6, 0.72]} s={[0.07, 1.0, 0.07]} m={a.trim} />
      <Box p={[0, 1.16, 0.4]} r={[0.18, 0, 0]} s={[1.0, 0.06, 0.95]} m={a.roof} cast />
      <Box p={[0, 1.215, 0.4]} r={[0.18, 0, 0]} s={[0.96, 0.06, 0.9]} m={M.snow} />
    </group>
  );
}

/** Anexo lateral bajo, con su propio tejado a dos aguas y una ventana */
function AnnexWing({ a, glass }: { a: Assets; glass: THREE.Material }) {
  const an = a.annex;
  if (!an) return null;
  const ad = an.d;
  return (
    <group position={[an.x, 0, an.z]}>
      <Shell d={ad} a={a} body={an.body} planks={Math.max(0, a.v.planks - 2)} />
      <Roof d={ad} a={a} />
      <Window p={[0, ad.FH + ad.H * 0.55, ad.L / 2]} glass={glass} a={a} w={0.3} h={0.35} />
    </group>
  );
}

/** Adorno de la cumbrera: estrella o veleta */
function RidgeTopper({ d, kind }: { d: Dims; kind: "star" | "vane" }) {
  const y = d.WALL_TOP + d.R;
  if (kind === "star") {
    return <mesh geometry={G.octa} material={M.star} position={[0, y + 0.3, d.L / 2 - 0.1]} scale={[0.1, 0.1, 0.04]} />;
  }
  return (
    <group position={[0, y + 0.2, 0.3]}>
      <Cyl p={[0, 0.22, 0]} s={[0.015, 0.44, 0.015]} m={M.dark} />
      <Box p={[0, 0.4, 0]} s={[0.34, 0.04, 0.015]} m={M.dark} />
      <Cone p={[0.2, 0.4, 0]} r={[0, 0, -Math.PI / 2]} s={[0.05, 0.1, 0.02]} m={M.dark} />
      <Box p={[-0.16, 0.44, 0]} s={[0.06, 0.1, 0.012]} m={M.dark} />
    </group>
  );
}

/* ----------------------- Chimenea, humo y luces ----------------------- */

const PUFFS = 4;

function Smoke({ k, position }: { k: MutableRefObject<number>; position: V3 }) {
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(
    () =>
      Array.from(
        { length: PUFFS },
        () => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false })
      ),
    []
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.visible = k.current > 0.02;
    g.children.forEach((child, i) => {
      const ph = (t * 0.22 + i / PUFFS) % 1;
      child.position.set(Math.sin(t * 0.8 + i) * 0.05 + ph * 0.3, ph * 1.2, 0);
      child.scale.setScalar(0.06 + ph * 0.16);
      mats[i].opacity = (1 - ph) * 0.5 * k.current;
    });
  });
  return (
    <group ref={group} position={position}>
      {mats.map((m, i) => (
        <mesh key={i} geometry={G.ball} material={m} />
      ))}
    </group>
  );
}

function Chimney({ a, k }: { a: Assets; k: MutableRefObject<number> }) {
  const { d, v } = a;
  const c = v.chimney;
  const surfaceY = d.WALL_TOP + d.R * (1 - Math.abs(c.x) / (d.W / 2)); // altura del tejado bajo la chimenea
  const cy = surfaceY + 0.3;
  return (
    <group position={[c.x, 0, c.z]}>
      <Box p={[0, cy, 0]} s={[c.w, c.h, c.w]} m={a.chimney} cast />
      <Box p={[0, cy + 0.05, 0]} s={[c.w + 0.025, 0.05, c.w + 0.025]} m={a.wallSide} />
      <Box p={[0, cy + c.h / 2 + 0.04, 0]} s={[c.w + 0.1, 0.09, c.w + 0.1]} m={M.snow} />
      <Smoke k={k} position={[0, cy + c.h / 2 + 0.12, 0]} />
    </group>
  );
}

function Lights({ a, bulbs }: { a: Assets; bulbs: THREE.Material[] }) {
  return (
    <group>
      {a.bulbs.map((p, i) => (
        <mesh key={i} geometry={G.bulb} material={bulbs[i % bulbs.length]} position={p} />
      ))}
    </group>
  );
}

/* ----------------------- Decoración del jardín ----------------------- */

const TIERS = [
  { r: 0.42, h: 0.55, y: 0.45, m: M.green1 },
  { r: 0.32, h: 0.5, y: 0.8, m: M.green2 },
  { r: 0.22, h: 0.45, y: 1.1, m: M.green3 },
];
const SNOW_F = 0.45;
const ORNAMENTS: Array<[number, number, number, THREE.Material]> = [
  [0, 0.35, 0.6, M.red], [0, 0.5, 3.8, M.gold], [1, 0.75, 2.0, M.red], [1, 0.9, 5.2, M.gold], [2, 1.05, 0.8, M.red],
];

function ChristmasTree({ p }: { p: V3 }) {
  return (
    <group position={p} scale={0.85}>
      <Cyl p={[0, 0.11, 0]} s={[0.06, 0.22, 0.06]} m={M.log} />
      {TIERS.map((t, i) => (
        <group key={i}>
          <Cone p={[0, t.y, 0]} s={[t.r, t.h, t.r]} m={t.m} cast />
          <Cone
            p={[0, t.y + t.h / 2 - (t.h * SNOW_F) / 2, 0]}
            s={[t.r * SNOW_F * 1.06, t.h * SNOW_F * 1.02, t.r * SNOW_F * 1.06]}
            m={M.snow}
          />
        </group>
      ))}
      {ORNAMENTS.map(([tier, y, an, m], i) => {
        const t = TIERS[tier];
        const rad = (t.r * (t.y + t.h / 2 - y)) / t.h + 0.02;
        return <Ball key={i} p={[rad * Math.cos(an), y, rad * Math.sin(an)]} s={0.04} m={m} />;
      })}
      <mesh geometry={G.octa} material={M.star} position={[0, 1.44, 0]} scale={[0.09, 0.09, 0.04]} />
    </group>
  );
}

function Snowman({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Ball p={[0, 0.2, 0]} s={0.22} m={M.snow} cast />
      <Ball p={[0, 0.52, 0]} s={0.16} m={M.snow} />
      <Ball p={[0, 0.76, 0]} s={0.12} m={M.snow} />
      <Ball p={[-0.04, 0.79, 0.105]} s={0.015} m={M.coal} />
      <Ball p={[0.04, 0.79, 0.105]} s={0.015} m={M.coal} />
      <Cone p={[0, 0.76, 0.15]} r={[Math.PI / 2, 0, 0]} s={[0.02, 0.1, 0.02]} m={M.carrot} />
      <Ball p={[0, 0.55, 0.15]} s={0.015} m={M.coal} />
      <Ball p={[0, 0.48, 0.155]} s={0.015} m={M.coal} />
      <Cyl p={[0, 0.65, 0]} s={[0.15, 0.04, 0.15]} m={M.red} />
      <Cyl p={[0, 0.9, 0]} s={[0.085, 0.1, 0.085]} m={M.coal} />
      <Cyl p={[0, 0.85, 0]} s={[0.14, 0.015, 0.14]} m={M.coal} />
      <Box p={[-0.2, 0.56, 0]} r={[0, 0, 0.45]} s={[0.22, 0.015, 0.015]} m={M.log} />
      <Box p={[0.2, 0.56, 0]} r={[0, 0, -0.45]} s={[0.22, 0.015, 0.015]} m={M.log} />
    </group>
  );
}

function Lantern({ p, glass }: { p: V3; glass: THREE.Material }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.5, 0]} s={[0.03, 1.0, 0.03]} m={M.dark} />
      <Box p={[0, 1.08, 0]} s={[0.16, 0.2, 0.16]} m={M.dark} />
      <mesh geometry={G.box} material={glass} position={[0, 1.08, 0]} scale={[0.175, 0.15, 0.12]} />
      <mesh geometry={G.box} material={glass} position={[0, 1.08, 0]} scale={[0.12, 0.15, 0.175]} />
      <Cone p={[0, 1.25, 0]} s={[0.13, 0.1, 0.13]} m={M.dark} />
      <Ball p={[0, 1.3, 0]} s={[0.09, 0.03, 0.09]} m={M.snow} />
    </group>
  );
}

function Firewood({ p }: { p: V3 }) {
  const rows: Array<[number, number[]]> = [[0.07, [-0.15, 0, 0.15]], [0.2, [-0.075, 0.075]], [0.33, [0]]];
  return (
    <group position={p}>
      {rows.map(([y, xs]) =>
        xs.map((x) => <Cyl key={`${y}${x}`} p={[x, y, 0]} r={[Math.PI / 2, 0, 0]} s={[0.07, 0.7, 0.07]} m={M.log} cast />)
      )}
      <Box p={[0, 0.405, 0]} s={[0.46, 0.04, 0.72]} m={M.snow} />
    </group>
  );
}

function Gifts({ p }: { p: V3 }) {
  const gift = (gp: V3, size: number, m: THREE.Material, ry = 0) => (
    <group position={gp} rotation={[0, ry, 0]}>
      <Box p={[0, size / 2, 0]} s={[size, size * 0.85, size]} m={m} cast />
      <Box p={[0, size / 2, 0]} s={[size * 1.01, size * 0.86, 0.045]} m={M.gold} />
      <Box p={[0, size / 2, 0]} s={[0.045, size * 0.86, size * 1.01]} m={M.gold} />
      <Ball p={[0, size * 0.85 + 0.02, 0]} s={[0.05, 0.035, 0.05]} m={M.gold} />
    </group>
  );
  return (
    <group position={p}>
      {gift([0, 0, 0], 0.28, M.red)}
      {gift([0.3, 0, 0.05], 0.2, M.wreath, 0.4)}
      {gift([-0.22, 0, 0.12], 0.16, M.stone, -0.3)}
    </group>
  );
}

/* --------------------------------- Casa --------------------------------- */

export interface House3DProps {
  /** Variante 0..11 (ver VARIANTS). Para el día N usa variantForDay(N). */
  variant?: number;
  /** Color opcional de las paredes; por defecto usa el color de la variante. */
  wallColor?: string;
  position?: V3;
  scale?: number;
  /** Rotación sobre el eje X (radianes) */
  rotationX?: number;
  /** Rotación sobre el eje Y (radianes) */
  rotationY?: number;
  /** Luces encendidas (ventanas, guirnalda, farol y humo, con transición suave) */
  lit?: boolean;
  /** Intensidad relativa de las luces de la casa cuando están encendidas */
  glowIntensity?: number;
  /** Decoración del jardín (árbol, muñeco, regalos…) */
  decorations?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

export function House3D({
  variant = 0, wallColor, position = [0, 0, 0], scale = 1, rotationX = 0, rotationY = 0,
  lit = true, glowIntensity = 1, decorations = true, onClick, onPointerOver, onPointerOut,
}: House3DProps) {
  const baseAssets = getAssets(variant);
  const a = useMemo(() => {
    if (!wallColor) return baseAssets;

    const color = new THREE.Color(wallColor);
    return {
      ...baseAssets,
      wallCap: new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
      wallSide: new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.93), roughness: 0.9 }),
    };
  }, [baseAssets, wallColor]);
  useEffect(
    () => () => {
      if (!wallColor) return;
      a.wallCap.dispose();
      a.wallSide.dispose();
    },
    [a, wallColor]
  );
  const { v, d } = a;
  const { glass, bulbs, k } = useHouseGlow(lit, v, glowIntensity);

  // distribución de ventanas y puerta
  const upper = d.H > 1.7; // casas altas: dos filas de ventanas
  const lowY = d.FH + d.H * (upper ? 0.38 : 0.58);
  const upY = d.FH + d.H * 0.82;
  const rows = upper ? [lowY, upY] : [lowY];
  const doorX = v.front === 1 ? 0.22 * d.W : 0;
  const frontX = v.front === 1 ? [-0.28 * d.W] : [-(d.W / 2 - 0.33), d.W / 2 - 0.33];
  const sideZ = v.side === 2 ? [-0.21 * d.L, 0.21 * d.L] : [0.1 * d.L];
  const hasShutters = a.shutter !== null && v.front === 1;
  const atticY = d.WALL_TOP + Math.min(0.4, d.R * 0.5);

  // las ventanas laterales del lado del anexo no deben quedar tapadas por él
  const annexMinZ = a.annex ? d.L / 2 - a.annex.d.L : Infinity;
  const sideWindows = (side: -1 | 1) =>
    sideZ.filter((z) => !(a.annex && a.annex.side === side) || z + 0.32 < annexMinZ);

  const yardX = v.yardSide * (d.W / 2 + 0.75);
  const yardZ = d.L / 2 + 0.1;

  return (
    <group
      position={position}
      scale={scale}
      rotation={[rotationX, rotationY, 0]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* sombra falsa de contacto */}
      <mesh
        geometry={G.circle}
        material={M.shadow}
        position={[0.25, 0.004, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[d.W * 1.15 + (a.annex ? 0.9 : 0), d.L * 0.8, 1]}
      />

      <Shell d={d} a={a} body={a.body} planks={v.planks} />
      <Roof d={d} a={a} />
      <Chimney a={a} k={k} />
      <AnnexWing a={a} glass={glass} />
      {v.topper !== "none" && <RidgeTopper d={d} kind={v.topper} />}

      {/* fachada */}
      {rows.flatMap((y, ri) => [
        ...(ri === 1 && v.front === 1 ? [doorX] : []),
        ...frontX,
      ].map((x) => (
        <Window key={`f${ri}${x}`} p={[x, y, d.L / 2]} glass={glass} a={a} shutters={hasShutters && x === frontX[0]} />
      )))}
      <Door a={a} p={[doorX, d.FH, d.L / 2]} />
      {v.porch && <Porch a={a} p={[doorX, d.FH, d.L / 2]} />}
      <group position={[0, atticY, d.L / 2 + 0.012]}>
        <mesh geometry={G.ring} material={a.frame} scale={0.17} />
        <mesh geometry={G.circle} material={glass} position={[0, 0, 0.004]} scale={0.12} />
      </group>

      {/* laterales y parte trasera */}
      {rows.map((y, ri) => (
        <group key={ri}>
          {sideWindows(1).map((z) => (
            <Window key={`r${z}`} p={[d.W / 2, y, z]} ry={Math.PI / 2} glass={glass} a={a} shutters={a.shutter !== null} />
          ))}
          {sideWindows(-1).map((z) => (
            <Window key={`l${z}`} p={[-d.W / 2, y, z]} ry={-Math.PI / 2} glass={glass} a={a} shutters={a.shutter !== null} />
          ))}
          <Window p={[0, y, -d.L / 2]} ry={Math.PI} glass={glass} a={a} />
        </group>
      ))}

      <Lights a={a} bulbs={bulbs} />

      {/* nieve acumulada junto a los muros */}
      <Ball p={[-d.W / 2 - 0.08, 0.05, d.L / 2 - 0.2]} s={[0.4, 0.13, 0.3]} m={M.snow} />
      <Ball p={[d.W / 2 + 0.1, 0.05, -0.2]} s={[0.3, 0.12, 0.55]} m={M.snow} />

      {decorations && (
        <>
          {v.yard === "tree" && <ChristmasTree p={[yardX, 0, yardZ]} />}
          {v.yard === "snowman" && <Snowman p={[yardX, 0, yardZ]} />}
          {v.yard === "lantern" && <Lantern p={[yardX, 0, yardZ]} glass={glass} />}
          {v.yard === "firewood" && <Firewood p={[v.yardSide * (d.W / 2 + 0.22), 0, 0.2]} />}
          {v.yard === "gifts" && <Gifts p={[yardX - v.yardSide * 0.1, 0, yardZ]} />}
        </>
      )}
    </group>
  );
}

/* -------------------------- Galería de las 12 variantes -------------------------- */

/** Las 12 casas en una cuadrícula con control de rotación X y luces, para revisarlas. */
export function HouseGallery() {
  const [deg, setDeg] = useState(0);
  const [lit, setLit] = useState(true);
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#eef3f8" }}>
      <div style={{ position: "absolute", zIndex: 1, top: 12, left: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          Rotación X: {deg}°{" "}
          <input type="range" min={-90} max={90} value={deg} onChange={(e: { target: { value: string } }) => setDeg(Number(e.target.value))} />
        </label>
        <button onClick={() => setLit((x) => !x)}>{lit ? "Apagar luces" : "Encender luces"}</button>
      </div>
      <Canvas shadows camera={{ position: [0, 15, 24], fov: 35 }}>
        <color attach="background" args={["#eef3f8"]} />
        <ambientLight intensity={0.9} color="#dbe7f5" />
        <directionalLight
          position={[-6, 12, 8]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#f6f8fb" roughness={1} />
        </mesh>
        {VARIANTS.slice(0, HOUSE_VARIANT_COUNT).map((_, i) => (
          <House3D
            key={i}
            variant={i}
            lit={lit}
            rotationX={(deg * Math.PI) / 180}
            position={[((i % 4) - 1.5) * 7, 0, (Math.floor(i / 4) - 1) * 7]}
          />
        ))}
      </Canvas>
    </div>
  );
}
