/* Posiciones de los objetos decorativos del mapa. */

/** Dónde "pisa" cada casa (base) y qué puerta usa */
export const HOUSE_SPOTS = [
  { id: 1, x: 170, y: 190, door: "h1" },
  { id: 2, x: 310, y: 190, door: "h2" },
  { id: 3, x: 450, y: 210, door: "h3" },
  { id: 4, x: 600, y: 215, door: "h4" },
  { id: 5, x: 750, y: 225, door: "h5" },
  { id: 6, x: 120, y: 300, door: "h6" },
  { id: 7, x: 300, y: 315, door: "h7" },
  { id: 8, x: 480, y: 320, door: "h8" },
  { id: 9, x: 730, y: 340, door: "h9" },
  { id: 10, x: 140, y: 415, door: "h10" },
  { id: 11, x: 260, y: 420, door: "h11" },
  { id: 12, x: 350, y: 410, door: "h12" },
  { id: 13, x: 510, y: 420, door: "h13" },
  { id: 14, x: 690, y: 470, door: "h14" },
  { id: 15, x: 370, y: 495, door: "h15" },
  { id: 16, x: 580, y: 485, door: "h16" },
  { id: 17, x: 800, y: 535, door: "h17" },
  { id: 18, x: 155, y: 600, door: "h18" },
  { id: 19, x: 280, y: 650, door: "h19" },
  { id: 20, x: 435, y: 575, door: "h20" },
  { id: 21, x: 520, y: 645, door: "h21" },
  { id: 22, x: 580, y: 575, door: "h22" },
  { id: 23, x: 680, y: 625, door: "h23" },
  { id: 24, x: 590, y: 325, door: "h24" },
] as const;

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
