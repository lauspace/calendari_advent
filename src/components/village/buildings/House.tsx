/* Casa pseudo-3D (proyección isométrica). (x, y) = esquina frontal en el suelo. */

export interface HouseProps {
  x: number;
  y: number;
  /** Luces encendidas (ventanas brillantes, halo y humo) */
  lit: boolean;
}

/** Gradientes que usa la casa; se renderizan una sola vez dentro de <defs> */
export function HouseDefs() {
  return (
    <>
      <linearGradient id="am-win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe6a8" />
        <stop offset="1" stopColor="#ffa63d" />
      </linearGradient>
      <radialGradient id="am-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffb454" stopOpacity="0.6" />
        <stop offset="1" stopColor="#ffb454" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

export function House({ x, y, lit }: HouseProps) {
  const glass = lit ? "url(#am-win)" : "#39404d";
  const door = lit ? "#ffcf7a" : "#2c313b";
  const heights = [8, 16, 24, 32];
  return (
    <g transform={`translate(${x} ${y}) scale(0.95)`}>
      {/* sombra proyectada sobre la nieve (luz arriba-izquierda) */}
      <ellipse cx="18" cy="3" rx="58" ry="15" fill="#8fa3ba" opacity="0.4" />
      {lit && <ellipse cx="-16" cy="7" rx="28" ry="8" fill="url(#am-glow)" />}

      {/* pared izquierda + hastial (cara iluminada) */}
      <polygon points="-30,-15 0,0 0,-36 -15,-66 -30,-51" fill="#8c4a37" />
      {/* pared derecha (cara en sombra) */}
      <polygon points="0,0 34,-17 34,-53 0,-36" fill="#5e2f24" />
      {/* tablones sutiles */}
      <g stroke="#6d3629" strokeWidth="0.8" opacity="0.6">
        {heights.map((h) => (
          <line key={`l${h}`} x1="-30" y1={-15 - h} x2="0" y2={-h} />
        ))}
      </g>
      <g stroke="#4a241b" strokeWidth="0.8" opacity="0.7">
        {heights.map((h) => (
          <line key={`r${h}`} x1="0" y1={-h} x2="34" y2={-17 - h} />
        ))}
      </g>
      {/* arista frontal con un leve brillo */}
      <line x1="0" y1="0" x2="0" y2="-36" stroke="#a65c45" strokeWidth="1" opacity="0.8" />

      {/* ventanas y puerta en la cara izquierda (eje inclinado) */}
      <g transform="matrix(1 0.5 0 1 -30 -15)">
        <rect x="4" y="-28" width="11" height="14" fill="#3a2418" />
        <rect x="5.2" y="-26.8" width="8.6" height="11.6" fill={glass} />
        <path d="M9.5 -26.8V-15.2M5.2 -21H13.8" stroke="#3a2418" strokeWidth="1" />
        <rect x="17" y="-21" width="9" height="21" fill="#3a2418" />
        <rect x="18.2" y="-19.8" width="6.6" height="19.8" fill={door} />
        <circle cx="23.4" cy="-10" r="0.9" fill="#3a2418" />
      </g>
      {/* ventanas en la cara derecha */}
      <g transform="matrix(1 -0.5 0 1 0 0)">
        <rect x="4" y="-28" width="12" height="15" fill="#3a2418" />
        <rect x="5.2" y="-26.8" width="9.6" height="12.6" fill={glass} />
        <path d="M10 -26.8V-14.2M5.2 -20.5H14.8" stroke="#3a2418" strokeWidth="1" />
        <rect x="20" y="-28" width="12" height="15" fill="#3a2418" />
        <rect x="21.2" y="-26.8" width="9.6" height="12.6" fill={glass} />
        <path d="M26 -26.8V-14.2M21.2 -20.5H30.8" stroke="#3a2418" strokeWidth="1" />
      </g>

      {/* chimenea (prisma con cara clara, cara oscura y tapa nevada) */}
      <polygon points="6,-66 12,-63 12,-84 6,-87" fill="#6b3a2c" />
      <polygon points="12,-63 18,-66 18,-87 12,-84" fill="#4a261e" />
      <polygon points="6,-87 12,-84 18,-87 12,-90" fill="#f4f7fb" />

      {/* plano de tejado visible */}
      <polygon points="-17,-69 19,-86 38,-50 2,-33" fill="#3b4250" />
      <line x1="2" y1="-33" x2="38" y2="-50" stroke="#2a2f3a" strokeWidth="2" />
      {/* nieve sobre el tejado, con borde ondulado */}
      <path
        d="M-17 -69 L19 -86 L34.2 -57.2 Q30 -52 25 -55 Q20 -49 14 -53 Q8 -46 3 -50 Q-1 -42 -1.8 -40.2 Z"
        fill="#f6f9fc"
      />
      <path d="M-17 -69 L19 -86" stroke="#ffffff" strokeWidth="2" />
      {/* sombra de la chimenea sobre la nieve */}
      <polygon points="12,-63 18,-66 24,-62 18,-59" fill="#c7d3e1" opacity="0.8" />
      {/* cantos del tejado (hastial) */}
      <polyline
        points="-33,-48 -17,-69 2,-33"
        fill="none"
        stroke="#e9eff6"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* nieve acumulada en la base */}
      <ellipse cx="-14" cy="-1" rx="20" ry="4.5" fill="#ffffff" opacity="0.95" />
      <ellipse cx="22" cy="-8" rx="16" ry="4" fill="#f1f5fa" opacity="0.95" />

      {/* humo */}
      {lit && (
        <g fill="#ffffff">
          <circle cx="12" cy="-97" r="4" opacity="0.55" />
          <circle cx="16" cy="-106" r="5" opacity="0.4" />
          <circle cx="22" cy="-116" r="6" opacity="0.25" />
        </g>
      )}
    </g>
  );
}
