/* Puente de madera arqueado sobre el estanque. */
import { BRIDGE, NODES } from "../data/pathGraph";

export function Bridge() {
  const bW = NODES[BRIDGE.from];
  const bE = NODES[BRIDGE.to];
  const midX = (bW.x + bE.x) / 2;

  return (
    <g strokeLinecap="round" fill="none">
      {/* sombra */}
      <path
        d={`M${bW.x - 6} ${bW.y + 3} Q${midX} ${bW.y - 20} ${bE.x + 6} ${bE.y + 3}`}
        stroke="#5a4231"
        strokeWidth="26"
        opacity="0.25"
      />
      {/* tablero */}
      <path d={`M${bW.x} ${bW.y} Q${midX} ${bW.y - 18} ${bE.x} ${bE.y}`} stroke="#8b6a4d" strokeWidth="18" />
      <path
        d={`M${bW.x} ${bW.y} Q${midX} ${bW.y - 18} ${bE.x} ${bE.y}`}
        stroke="#a98763"
        strokeWidth="12"
        strokeDasharray="3 5"
      />
      {/* barandillas */}
      <path d={`M${bW.x} ${bW.y - 9} Q${midX} ${bW.y - 27} ${bE.x} ${bE.y - 9}`} stroke="#5a4231" strokeWidth="2.5" />
      <path d={`M${bW.x} ${bW.y + 9} Q${midX} ${bW.y - 9} ${bE.x} ${bE.y + 9}`} stroke="#5a4231" strokeWidth="2.5" />
    </g>
  );
}
