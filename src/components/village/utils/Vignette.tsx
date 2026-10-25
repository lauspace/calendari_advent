/* Oscurecimiento suave de los bordes del mapa. */
import { MAP_H, MAP_W } from "../constants";

export function Vignette() {
  return <rect width={MAP_W} height={MAP_H} fill="url(#am-vignette)" pointerEvents="none" />;
}
