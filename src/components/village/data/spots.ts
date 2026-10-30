/* Posiciones de los objetos decorativos del mapa. */

/** Base de cada casa, puerta asociada y rotación en radianes. */
export interface HouseSpot {
  id: number;
  x: number;
  y: number;
  rotation: number;
  door: string;
  /** Color opcional de las paredes; si falta, se usa el color de la variante. */
  wallColor: string | null;
}

export const HOUSE_SPOTS: HouseSpot[] = [
  { id: 1, x: 180, y: 195, rotation: -Math.PI / 3, door: "h1", wallColor: "#A94452" },
  { id: 2, x: 280, y: 190, rotation: -Math.PI / 20, door: "h2", wallColor: "#426B57" },
  { id: 3, x: 465, y: 210, rotation: 0, door: "h3", wallColor: "#6487A5" },
  { id: 4, x: 600, y: 220, rotation: -Math.PI / 3.5, door: "h4", wallColor: "#C46F52" },
  { id: 5, x: 740, y: 230, rotation: -Math.PI / 4, door: "h5", wallColor: "#9BAF91" },
  { id: 6, x: 80, y: 300, rotation: 0, door: "h6", wallColor: "#426B70" },
  { id: 7, x: 295, y: 313, rotation: 0, door: "h7", wallColor: "#D5A0A0" },
  { id: 8, x: 490, y: 315, rotation: -Math.PI / 5, door: "h8", wallColor: "#D4AE63" },
  { id: 9, x: 710, y: 345, rotation: -Math.PI / 16, door: "h9", wallColor: "#79566F" },
  { id: 10, x: 140, y: 415, rotation: 0, door: "h10", wallColor: "#99704F" },
  { id: 11, x: 260, y: 420, rotation: 0, door: "h11", wallColor: "#B1C9B7" },
  { id: 12, x: 350, y: 410, rotation: 0, door: "h12", wallColor: "#E8DDC8" },
  { id: 13, x: 510, y: 420, rotation: 0, door: "h13", wallColor: "#A94452" },
  { id: 14, x: 690, y: 470, rotation: 0, door: "h14", wallColor: "#426B57" },
  { id: 15, x: 370, y: 495, rotation: 0, door: "h15", wallColor: "#6487A5" },
  { id: 16, x: 580, y: 485, rotation: 0, door: "h16", wallColor: "#C46F52" },
  { id: 17, x: 800, y: 535, rotation: 0, door: "h17", wallColor: "#9BAF91" },
  { id: 18, x: 155, y: 600, rotation: 0, door: "h18", wallColor: "#426B70" },
  { id: 19, x: 280, y: 650, rotation: 0, door: "h19", wallColor: "#D5A0A0" },
  { id: 20, x: 435, y: 575, rotation: 0, door: "h20", wallColor: "#D4AE63" },
  { id: 21, x: 520, y: 645, rotation: 0, door: "h21", wallColor: "#79566F" },
  { id: 22, x: 580, y: 575, rotation: 0, door: "h22", wallColor: "#99704F" },
  { id: 23, x: 680, y: 625, rotation: 0, door: "h23", wallColor: "#B1C9B7" },
  { id: 24, x: 585, y: 330, rotation: -Math.PI / 5, door: "h24", wallColor: "#E8DDC8" },
] as const;

/** [x, y, rotación, escala] */
export type BenchSpot = [x: number, y: number, rotation: number, scale: number];

export const BENCH_SPOTS: BenchSpot[] = [
  [200, 250, Math.PI / 4, 7], [370, 615, Math.PI / 4, 7],
];

/** Pinos: [x, y, escala] (x, y = base del tronco) */
export const TREE_SPOTS: Array<[number, number, number]> = [
  [90, 215, 1.1], [70, 340, 0.8], [90, 495, 0.9], [40, 570, 0.8], [82, 660, 0.8],
  [385, 180, 0.8], [520, 205, 0.8], [390, 300, 1], [240, 322, 0.7], [680, 192, 1],
  [670, 295, 0.7], [770, 390, 0.9], [745, 460, 1], [790, 630, 1.1],
  [770, 628, 0.9], [380, 690, 0.9], [270, 470, 0.8], [170, 682, 0.8],
  [185, 676, 0.9], [565, 410, 0.7], [510, 480, 0.8], [495, 475, 0.7],
];

/** Montículos de nieve del fondo: [cx, cy, rx, ry] */
export const DRIFT_SPOTS: Array<[number, number, number, number]> = [
  [150, 120, 190, 70],
  [560, 120, 210, 60],
  [760, 170, 130, 60],
  [90, 330, 110, 80],
  [470, 400, 200, 60],
  [650, 560, 190, 80],
  [330, 720, 260, 50],
  [760, 700, 140, 60],
  [60, 700, 120, 60],
];
