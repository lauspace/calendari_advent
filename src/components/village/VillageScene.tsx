/* ---------------------------------------------------------------
 * AdventMap — ensambla la escena completa.
 * Orden de capas (de atrás hacia delante):
 *   suelo → claros → estanque → caminos → puente → viñeta →
 *   objetos (casas + pinos ordenados por y) → children → debug
 * --------------------------------------------------------------- */
import type { ReactNode } from "react";
import { MAP_H, MAP_W } from "./constants";
import { TREE_SPOTS } from "./data/spots";
import { Bridge, BridgeForeground } from "./decor/Bridge";
import { DebugOverlay } from "./utils/DebugOverlay";
import { HouseClearings } from "./buildings/HouseClearings";
import { House3DMap } from "./buildings/House3DMap";
import { MapDefs } from "./utils/MapDefs";
import { Paths } from "./terrain/Paths";
import { Pond } from "./nature/Pond";
import { SnowGround } from "./terrain/SnowGround";
import { Tree } from "./nature/Tree";
import { Vignette } from "./utils/Vignette";
import { VillageCharacterLayer } from "./VillageCharacterLayer";
import { getCharactersForUser } from "./data/characters";
import { getLanguage, translate } from "../../i18n";

export interface AdventMapProps {
  /** Dibuja casas y pinos para ver la escena completa */
  showPlaceholders?: boolean;
  /** Ids de casas con luz encendida; por defecto todas */
  litHouses?: number[];
  /** Día de la casa que debe destacar con más intensidad */
  highlightedHouse?: number;
  /** Dibuja el puente de madera sobre el estanque */
  showBridge?: boolean;
  /** Muestra nodos y aristas para depurar la red de caminos */
  debug?: boolean;
  /** Usuario para limitar los personajes según el prefijo de su modelo */
  currentUser?: string;
  className?: string;
  /** Capa superior en las mismas coordenadas (personajes, sillas…) */
  children?: ReactNode;
}

export default function AdventMap({
  showPlaceholders = true,
  litHouses,
  highlightedHouse,
  showBridge = true,
  debug = false,
  currentUser,
  className,
  children,
}: AdventMapProps) {
  const language = getLanguage(currentUser);
  const trees = TREE_SPOTS.map(([x, y, s], i) => <Tree key={`t${i}`} x={x} y={y} s={s} />);

  return (
    <div className="village-map">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className={className}
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label={translate(
          getLanguage(currentUser),
          "Mapa nevado con caminos entre casas",
          "Mapa nevat amb camins entre les cases",
        )}
      >
        <MapDefs />
        <SnowGround />
        <HouseClearings />
        <Pond />
        <Paths />
        {showBridge && <Bridge />}
        <Vignette />
        {showPlaceholders && <g>{trees}</g>}
        {children}
        {debug && <DebugOverlay />}
      </svg>
      <VillageCharacterLayer
        characters={getCharactersForUser(currentUser)}
        language={language}
      />
      {showBridge && (
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }}
        >
          <BridgeForeground />
        </svg>
      )}
      <House3DMap
        litHouses={litHouses}
        highlightedHouse={highlightedHouse}
        showHouses={showPlaceholders}
      />
    </div>
  );
}
