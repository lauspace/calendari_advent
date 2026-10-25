/* Caminos de nieve compactada: sombra difusa, borde y centro claro. */
import { EDGES } from "../data/pathGraph";
import { edgeD } from "../utils/geometry";

export function Paths() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <g filter="url(#am-soft-sm)" stroke="#b4c3d4" strokeWidth="34" opacity="0.55">
        {EDGES.map((e, i) => (
          <path key={i} d={edgeD(e)} />
        ))}
      </g>
      <g stroke="#c5d2e1" strokeWidth="26">
        {EDGES.map((e, i) => (
          <path key={i} d={edgeD(e)} />
        ))}
      </g>
      <g stroke="#dfe7f0" strokeWidth="17">
        {EDGES.map((e, i) => (
          <path key={i} d={edgeD(e)} />
        ))}
      </g>
    </g>
  );
}
