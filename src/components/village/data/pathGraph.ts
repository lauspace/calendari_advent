/* Red de caminos: nodos (puertas, cruces, puente) y aristas entre ellos. */

export type NodeKind = "door" | "junction" | "bridge";
export interface PathNode {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
}
export interface PathEdge {
  a: string;
  b: string;
  /** Punto de control opcional (curva Bézier cuadrática) */
  c?: readonly [number, number];
}

const n = (id: string, x: number, y: number, kind: NodeKind): PathNode => ({ id, x, y, kind });

/** Puertas (h1..h19): donde empieza/termina el camino de cada casa */
const DOORS: PathNode[] = [
  n("h1", 130, 192, "door"),
  n("h2", 325, 207, "door"),
  n("h3", 520, 212, "door"),
  n("h4", 735, 242, "door"),
  n("h5", 110, 312, "door"),
  n("h6", 330, 322, "door"),
  n("h7", 570, 342, "door"),
  n("h8", 745, 357, "door"),
  n("h9", 105, 432, "door"),
  n("h10", 310, 422, "door"),
  n("h11", 480, 422, "door"),
  n("h12", 640, 447, "door"),
  n("h13", 375, 527, "door"),
  n("h14", 530, 562, "door"),
  n("h15", 765, 552, "door"),
  n("h16", 105, 597, "door"),
  n("h17", 285, 667, "door"),
  n("h18", 525, 677, "door"),
  n("h19", 675, 652, "door"),
];

/** Cruces y puntos del puente */
const JUNCTIONS: PathNode[] = [
  n("j1", 220, 228, "junction"),
  n("j2", 430, 240, "junction"),
  n("j3", 640, 262, "junction"),
  n("j4", 210, 350, "junction"),
  n("j5", 440, 330, "junction"),
  n("j6", 655, 362, "junction"),
  n("j7", 200, 445, "junction"),
  n("j8", 440, 445, "junction"),
  n("j9", 650, 505, "junction"),
  n("j10", 290, 490, "junction"),
  n("j11", 115, 525, "junction"),
  n("j12", 500, 505, "junction"),
  n("j13", 410, 612, "junction"),
  n("j14", 610, 622, "junction"),
  n("j15", 190, 652, "junction"),
  n("bW", 158, 490, "bridge"), // extremo oeste del puente
  n("bE", 252, 490, "bridge"), // extremo este del puente
];

export const NODES: Record<string, PathNode> = Object.fromEntries(
  [...DOORS, ...JUNCTIONS].map((p) => [p.id, p])
);

export const BRIDGE = {
  from: "bW",
  to: "bE",
  control: [(NODES.bW.x + NODES.bE.x) / 2, NODES.bW.y - 18] as const,
};

export const EDGES: PathEdge[] = [
  // fila superior
  { a: "h1", b: "j1", c: [170, 222] },
  { a: "j1", b: "h2", c: [270, 212] },
  { a: "h2", b: "j2", c: [380, 232] },
  { a: "j2", b: "h3", c: [475, 218] },
  { a: "h3", b: "j3", c: [585, 245] },
  { a: "j3", b: "h4", c: [690, 245] },
  // bajada por la izquierda y centro
  { a: "j1", b: "j4", c: [200, 290] },
  { a: "j2", b: "j5", c: [425, 285] },
  { a: "j3", b: "j6", c: [635, 310] },
  // segunda fila
  { a: "h5", b: "j4" },
  { a: "j4", b: "h6", c: [270, 345] },
  { a: "h6", b: "j5", c: [385, 335] },
  { a: "j5", b: "h7", c: [505, 345] },
  { a: "h7", b: "j6", c: [615, 358] },
  { a: "j6", b: "h8", c: [705, 372] },
  { a: "j6", b: "h12", c: [640, 405] },
  // tercera fila
  { a: "j4", b: "j7", c: [195, 400] },
  { a: "h9", b: "j7", c: [150, 445] },
  { a: "j7", b: "h10", c: [255, 440] },
  { a: "j5", b: "j8", c: [450, 390] },
  { a: "h11", b: "j8" },
  { a: "j8", b: "h13", c: [405, 490] },
  { a: "j8", b: "j12", c: [470, 485] },
  { a: "h12", b: "j9", c: [635, 480] },
  { a: "j9", b: "j12", c: [575, 490] },
  { a: "j9", b: "h15", c: [715, 520] },
  { a: "j12", b: "h14", c: [510, 535] },
  // puente y orilla del estanque
  { a: "j11", b: "bW", c: [115, 505] },
  { a: "bW", b: "bE", c: BRIDGE.control },
  { a: "bE", b: "j10", c: [270, 480] },
  { a: "j10", b: "h10", c: [295, 455] },
  { a: "j10", b: "h13", c: [335, 500] },
  // parte inferior
  { a: "h16", b: "j11" },
  { a: "h16", b: "j15", c: [135, 650] },
  { a: "j15", b: "h17", c: [235, 668] },
  { a: "h13", b: "j13", c: [385, 570] },
  { a: "j13", b: "h17", c: [350, 650] },
  { a: "j13", b: "h18", c: [470, 640] },
  { a: "h14", b: "j14", c: [560, 600] },
  { a: "j14", b: "h18", c: [570, 665] },
  { a: "j14", b: "h19", c: [650, 625] },
  { a: "h15", b: "h19", c: [735, 610] },
];
