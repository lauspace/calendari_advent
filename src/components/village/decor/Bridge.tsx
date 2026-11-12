/* Puente de madera arqueado sobre el estanque, versión navideña.
 * Misma paleta que las casas (houses.ts): madera, nieve, guirnaldas verdes,
 * bombillas multicolor, lazos rojos y una estrella dorada.
 * Sustituye directamente al Bridge.tsx anterior: mismo import y mismo export.
 * Prop opcional `lit` (por defecto true) para apagar/encender las bombillas. */
import { BRIDGE, NODES } from "../data/pathGraph";

const WOOD = "#6b4a30";
const LOG = "#7a5a3c";
const DECK = "#8a6a48";
const SNOW = "#f6f9fc";
const RED = "#ff6b57";
const GOLD = "#ffd27a";
const PINE = ["#2f5d4a", "#3f7d62"];
const BULBS = ["#ff6b57", "#ffd27a", "#ffa63d", "#8fd694"];
const BULB_OFF = "#5b6070";

const POSTS = [0, 0.25, 0.5, 0.75, 1]; // posiciones de los postes a lo largo del arco
const EDGE = 9; // distancia del borde del tablero al centro
const POST_H = 15; // altura de los postes
const SAG = 6; // caída de cada guirnalda

const star = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r : R;
    return `${(cx + Math.cos(a) * k).toFixed(2)},${(cy + Math.sin(a) * k).toFixed(2)}`;
  }).join(" ");

const renderGarlands = (tops: [number, number][], lit: boolean, keyPrefix: string) =>
  tops.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = tops[i + 1]!;
    const cx = (x0 + x1) / 2;
    const cyg = (y0 + y1) / 2 + SAG * 2 + 3;
    const d = `M${x0} ${y0 + 3} Q${cx} ${cyg} ${x1} ${y1 + 3}`;

    return (
      <g key={`${keyPrefix}-${i}`}>
        <path d={d} stroke={PINE[0]} strokeWidth="4.2" />
        <path d={d} stroke={PINE[1]} strokeWidth="2" strokeDasharray="2 3" />
        {[0.2, 0.5, 0.8].map((s, bulbIndex) => {
          const u = 1 - s;
          const bx = u * u * x0 + 2 * u * s * cx + s * s * x1;
          const by = u * u * (y0 + 3) + 2 * u * s * cyg + s * s * (y1 + 3) + 1.5;
          const color = lit ? BULBS[(i * 3 + bulbIndex) % BULBS.length]! : BULB_OFF;
          return (
            <g key={s}>
              {lit && <circle cx={bx} cy={by} r="3.6" fill={color} opacity="0.28" />}
              <circle cx={bx} cy={by} r="1.7" fill={color} />
            </g>
          );
        })}
      </g>
    );
  });

export function Bridge({ lit = true }: { lit?: boolean }) {
  const bW = NODES[BRIDGE.from];
  const bE = NODES[BRIDGE.to];
  const [controlX, controlY] = BRIDGE.control;

  /** punto del arco en t (0..1), desplazado dy en vertical */
  const at = (t: number, dy = 0): [number, number] => {
    const u = 1 - t;
    return [
      u * u * bW.x + 2 * u * t * controlX + t * t * bE.x,
      u * u * bW.y + 2 * u * t * controlY + t * t * bE.y + dy,
    ];
  };
  /** el arco entero desplazado dy */
  const arc = (dy = 0, ext = 0) =>
    `M${bW.x - ext} ${bW.y + dy} Q${controlX} ${controlY + dy} ${bE.x + ext} ${bE.y + dy}`;
  const deck = `M${bW.x} ${bW.y - EDGE} Q${controlX} ${controlY - EDGE} ${bE.x} ${bE.y - EDGE}
    L${bE.x} ${bE.y + EDGE} Q${controlX} ${controlY + EDGE} ${bW.x} ${bW.y + EDGE} Z`;

  /** un lado del puente: postes, barandilla, guirnalda, bombillas */
  const side = (edge: number, front: boolean) => {
    const top = edge - POST_H;
    const tops = POSTS.map((t) => at(t, top));
    return (
      <g>
        {/* postes */}
        {POSTS.map((t, i) => {
          const [x, y0] = at(t, edge);
          return (
            <g key={`p${i}`}>
              <line x1={x} y1={y0} x2={x} y2={tops[i][1]} stroke={WOOD} strokeWidth="4.2" />
              <line x1={x} y1={y0} x2={x} y2={tops[i][1]} stroke={LOG} strokeWidth="2.6" />
              <ellipse cx={x} cy={tops[i][1] - 1} rx="3.2" ry="1.9" fill={SNOW} />
            </g>
          );
        })}
        {/* barandilla con nieve encima */}
        <path d={arc(top + 3)} stroke={WOOD} strokeWidth="3" />
        <path d={arc(top + 1.6)} stroke={SNOW} strokeWidth="2" strokeDasharray="9 3 5 4" opacity="0.95" />
        {/* guirnaldas entre postes */}
        {renderGarlands(tops, lit, front ? "front-garland" : "back-garland")}
        {/* lazos rojos en los postes (solo delante) */}
        {front &&
          tops.map(([x, y], i) => (
            <g key={`b${i}`} fill={RED}>
              <ellipse cx={x - 2.6} cy={y + 3.4} rx="2.6" ry="1.6" transform={`rotate(-25 ${x - 2.6} ${y + 3.4})`} />
              <ellipse cx={x + 2.6} cy={y + 3.4} rx="2.6" ry="1.6" transform={`rotate(25 ${x + 2.6} ${y + 3.4})`} />
              <circle cx={x} cy={y + 3.6} r="1.4" fill="#c94a3a" />
            </g>
          ))}
      </g>
    );
  };

  const [wx, wy] = at(0.5, EDGE - POST_H + 11); // corona colgada en el centro delantero
  const [sx, sy] = at(0.5, -EDGE - POST_H - 7); // estrella sobre el poste central trasero

  return (
    <g strokeLinecap="round" fill="none">
      {/* sombra */}
      <path d={arc(3, 6)} stroke="#5a4231" strokeWidth="26" opacity="0.25" />

      {/* lado trasero (queda detrás del tablero) */}
      {side(-EDGE, false)}

      {/* tablero: borde, madera, tablones y nieve acumulada */}
      <path d={deck} fill={WOOD} stroke="none" />
      <path d={arc()} stroke={DECK} strokeWidth="16" />
      {[-5, 0, 5].map((dy) => (
        <path key={dy} d={arc(dy)} stroke="#2a140e" strokeWidth="0.8" opacity="0.42" />
      ))}
      <path d={arc(EDGE - 2)} stroke={SNOW} strokeWidth="2.6" strokeDasharray="8 4 3 7 11 5" opacity="0.95" />
      <path d={arc(-EDGE + 2)} stroke={SNOW} strokeWidth="2" strokeDasharray="5 9 10 4" opacity="0.8" />

      {/* estrella dorada */}
      <circle cx={sx} cy={sy} r="7" fill={GOLD} opacity={lit ? 0.3 : 0} />
      <polygon points={star(sx, sy, 5, 2.2)} fill={lit ? GOLD : BULB_OFF} stroke="none" />

      {/* lado delantero (por encima del tablero) */}
      {side(EDGE, true)}

      {/* corona con lazo */}
      <circle cx={wx} cy={wy} r="5" stroke={PINE[0]} strokeWidth="3.4" />
      <circle cx={wx} cy={wy} r="5" stroke={PINE[1]} strokeWidth="1.4" strokeDasharray="2 2.6" />
      {[0.4, 2.2, 4.1].map((a) => (
        <circle key={a} cx={wx + Math.cos(a) * 5} cy={wy + Math.sin(a) * 5} r="1" fill={RED} stroke="none" />
      ))}
      <path d={`M${wx} ${wy - 5} l-3 -2.2 l0 4.2 z M${wx} ${wy - 5} l3 -2.2 l0 4.2 z`} fill={RED} stroke="none" />
    </g>
  );
}

/** Repeated above the character canvas so walkers appear between the rails. */
export function BridgeForeground() {
  const bW = NODES[BRIDGE.from];
  const bE = NODES[BRIDGE.to];
  const [controlX, controlY] = BRIDGE.control;
  const at = (t: number, dy = 0): [number, number] => {
    const u = 1 - t;
    return [
      u * u * bW.x + 2 * u * t * controlX + t * t * bE.x,
      u * u * bW.y + 2 * u * t * controlY + t * t * bE.y + dy,
    ];
  };
  const arc = (dy = 0) =>
    `M${bW.x} ${bW.y + dy} Q${controlX} ${controlY + dy} ${bE.x} ${bE.y + dy}`;
  const top = EDGE - POST_H;
  const tops = POSTS.map((t) => at(t, top));

  return (
    <g strokeLinecap="round" fill="none">
      {POSTS.map((t, i) => {
        const [x, y] = at(t, EDGE);
        const [, yTop] = at(t, top);
        return (
          <g key={`front-post-${i}`}>
            <line x1={x} y1={y} x2={x} y2={yTop} stroke={WOOD} strokeWidth="4.2" />
            <line x1={x} y1={y} x2={x} y2={yTop} stroke={LOG} strokeWidth="2.6" />
            <ellipse cx={x} cy={yTop - 1} rx="3.2" ry="1.9" fill={SNOW} />
          </g>
        );
      })}
      <path d={arc(top + 3)} stroke={WOOD} strokeWidth="3" />
      <path d={arc(top + 1.6)} stroke={SNOW} strokeWidth="2" strokeDasharray="9 3 5 4" opacity="0.95" />
      {renderGarlands(tops, true, "front-garland-foreground")}
    </g>
  );
}
