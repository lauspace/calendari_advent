/* Pino pseudo-3D: tres pisos cónicos con cara iluminada y cara en sombra. */

export interface TreeProps {
  x: number;
  y: number;
  /** Escala (1 = tamaño normal) */
  s?: number;
}

/** Un piso del pino: cono con mitad iluminada, mitad en sombra y nieve en la punta */
function Tier({ w, ay, by, ry }: { w: number; ay: number; by: number; ry: number }) {
  const f = 0.42;
  const sy = ay + (by - ay) * f;
  const sw = w * f;
  return (
    <g>
      <path d={`M0 ${ay} L${-w} ${by} A${w} ${ry} 0 0 0 0 ${by + ry} Z`} fill="#3f7d62" />
      <path d={`M0 ${ay} L0 ${by + ry} A${w} ${ry} 0 0 0 ${w} ${by} Z`} fill="#2a5846" />
      <path
        d={`M0 ${ay} L${-sw} ${sy} Q${-sw * 0.5} ${sy + 3} 0 ${sy + 1} Z`}
        fill="#f6f9fc"
      />
      <path
        d={`M0 ${ay} L0 ${sy + 1} Q${sw * 0.5} ${sy + 3} ${sw} ${sy} Z`}
        fill="#d5dfeb"
      />
    </g>
  );
}

export function Tree({ x, y, s = 1 }: TreeProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="9" cy="2" rx="22" ry="6" fill="#8fa3ba" opacity="0.4" />
      <rect x="-3" y="-12" width="3" height="13" fill="#6b4e38" />
      <rect x="0" y="-12" width="3" height="13" fill="#4a3526" />
      <Tier w={19} ay={-34} by={-12} ry={5.5} />
      <Tier w={15} ay={-52} by={-30} ry={4.5} />
      <Tier w={11} ay={-68} by={-48} ry={3.5} />
    </g>
  );
}
