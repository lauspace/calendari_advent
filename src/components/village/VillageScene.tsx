/* ---------------------------------------------------------------
 * AdventMap — ensambla la escena completa.
 * Orden de capas (de atrás hacia delante):
 *   suelo → claros → estanque → caminos → puente → viñeta →
 *   objetos (casas + pinos ordenados por y) → children → debug
 * --------------------------------------------------------------- */
import type { ReactNode } from "react";
import { MAP_H, MAP_W } from "./constants";
import { HOUSE_SPOTS, TREE_SPOTS } from "./data/spots";
import { Bridge } from "./decor/Bridge";
import { DebugOverlay } from "./utils/DebugOverlay";
import { House } from "./buildings/House";
import { HouseClearings } from "./buildings/HouseClearings";
import { MapDefs } from "./utils/MapDefs";
import { Paths } from "./terrain/Paths";
import { Pond } from "./nature/Pond";
import { SnowGround } from "./terrain/SnowGround";
import { Tree } from "./nature/Tree";
import { Vignette } from "./utils/Vignette";
import { WalkingElf } from "./movement/WalkingElf";

export interface AdventMapProps {
  /** Dibuja casas y pinos para ver la escena completa */
  showPlaceholders?: boolean;
  /** Ids de casa (1..19) con luz encendida; por defecto todas */
  litHouses?: number[];
  /** Dibuja el puente de madera sobre el estanque */
  showBridge?: boolean;
  /** Muestra nodos y aristas para depurar la red de caminos */
  debug?: boolean;
  className?: string;
  /** Capa superior en las mismas coordenadas (personajes, sillas…) */
  children?: ReactNode;
}

export default function AdventMap({
  showPlaceholders = true,
  litHouses,
  showBridge = true,
  debug = false,
  className,
  children,
}: AdventMapProps) {
  // Pinos y casas mezclados y ordenados por y para respetar la profundidad
  const objects = [
    ...TREE_SPOTS.map(([x, y, s], i) => ({ y, el: <Tree key={`t${i}`} x={x} y={y} s={s} /> })),
    ...HOUSE_SPOTS.map((h) => ({
      y: h.y,
      el: <House key={`h${h.id}`} x={h.x} y={h.y} lit={litHouses ? litHouses.includes(h.id) : true} />,
    })),
  ].sort((a, b) => a.y - b.y);

  return (
    <div className="village-map">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className={className}
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label="Mapa nevado con caminos entre casas"
      >
        <MapDefs />
        <SnowGround />
        <HouseClearings />
        <Pond />
        <Paths />
        {showBridge && <Bridge />}
        <Vignette />
        {showPlaceholders && <g>{objects.map((o) => o.el)}</g>}
        {children}
        {debug && <DebugOverlay />}
      </svg>
      <WalkingElf />
    </div>
  );
}
