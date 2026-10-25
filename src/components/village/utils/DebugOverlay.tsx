/* Capa de depuración: dibuja aristas y nodos de la red de caminos. */
import { EDGES, NODES } from "../data/pathGraph";
import { edgeD } from "../utils/geometry";

export function DebugOverlay() {
  return (
    <g pointerEvents="none">
      {EDGES.map((e, i) => (
        <path key={i} d={edgeD(e)} fill="none" stroke="#e5484d" strokeWidth="1.5" />
      ))}
      {Object.values(NODES).map((p) => (
        <g key={p.id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.kind === "door" ? 4 : 3}
            fill={p.kind === "door" ? "#2b7de9" : p.kind === "bridge" ? "#8b6a4d" : "#e5484d"}
          />
          <text x={p.x + 6} y={p.y - 6} fontSize="11" fill="#1f2a37">
            {p.id}
          </text>
        </g>
      ))}
    </g>
  );
}
