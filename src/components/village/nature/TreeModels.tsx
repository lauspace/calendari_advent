import { useThree } from "@react-three/fiber";
import { DoubleSide, Shape } from "three";
import { MAP_H, MAP_W } from "../constants";

type TreeSpot = [x: number, y: number, scale: number];

const PIXELS_PER_WORLD_UNIT = 25;
const CAMERA_ELEVATION_SIN = Math.SQRT1_2;

function mapPointToWorld(x: number, y: number, scale: number): [number, number, number] {
  return [
    ((x - MAP_W / 2) / PIXELS_PER_WORLD_UNIT) * scale,
    0,
    ((y - MAP_H / 2) / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN)) * scale,
  ];
}

function makeRectangle(left: number, top: number, right: number, bottom: number) {
  const shape = new Shape();
  shape.moveTo(left, top);
  shape.lineTo(right, top);
  shape.lineTo(right, bottom);
  shape.lineTo(left, bottom);
  shape.closePath();
  return shape;
}

function makeTierShapes(width: number, top: number, bottom: number, radius: number) {
  const x = (pixels: number) => pixels / PIXELS_PER_WORLD_UNIT;
  const y = (pixels: number) => -pixels / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN);
  const snowY = top + (bottom - top) * 0.42;
  const snowWidth = width * 0.42;
  const left = new Shape();
  left.moveTo(x(0), y(top));
  left.lineTo(x(-width), y(bottom));
  left.quadraticCurveTo(x(-width * 0.8), y(bottom + radius), x(0), y(bottom + radius));
  left.closePath();

  const right = new Shape();
  right.moveTo(x(0), y(top));
  right.lineTo(x(0), y(bottom + radius));
  right.quadraticCurveTo(x(width), y(bottom + radius), x(width), y(bottom));
  right.closePath();

  const leftSnow = new Shape();
  leftSnow.moveTo(x(0), y(top));
  leftSnow.lineTo(x(-snowWidth), y(snowY));
  leftSnow.quadraticCurveTo(x(-snowWidth * 0.5), y(snowY + 3), x(0), y(snowY + 1));
  leftSnow.closePath();

  const rightSnow = new Shape();
  rightSnow.moveTo(x(0), y(top));
  rightSnow.lineTo(x(0), y(snowY + 1));
  rightSnow.quadraticCurveTo(x(snowWidth * 0.5), y(snowY + 3), x(snowWidth), y(snowY));
  rightSnow.closePath();

  return { left, right, leftSnow, rightSnow };
}

const TREE_TIERS = [
  makeTierShapes(19, -34, -12, 5.5),
  makeTierShapes(15, -52, -30, 4.5),
  makeTierShapes(11, -68, -48, 3.5),
];
const trunkX = (pixels: number) => pixels / PIXELS_PER_WORLD_UNIT;
const trunkY = (pixels: number) => -pixels / (PIXELS_PER_WORLD_UNIT * CAMERA_ELEVATION_SIN);
const TRUNK_LEFT = makeRectangle(trunkX(-3), trunkY(-12), 0, 0);
const TRUNK_RIGHT = makeRectangle(0, trunkY(-12), trunkX(3), 0);
const TREE_SHADOW = new Shape();
TREE_SHADOW.absellipse(
  trunkX(9),
  trunkY(2),
  trunkX(22),
  trunkY(6),
  0,
  Math.PI * 2,
  false,
  0,
);

function TreeModel({ x, y, scale: treeScale }: { x: number; y: number; scale: number }) {
  const mapScale = useThree(({ size }) => size.width / MAP_W);
  const scale = mapScale * treeScale;

  return (
    <group position={mapPointToWorld(x, y, mapScale)} scale={scale}>
      <mesh position={[0, 0, -0.002]}>
        <shapeGeometry args={[TREE_SHADOW]} />
        <meshBasicMaterial color="#8fa3ba" transparent opacity={0.4} depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <shapeGeometry args={[TRUNK_LEFT]} />
        <meshBasicMaterial color="#6b4e38" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <shapeGeometry args={[TRUNK_RIGHT]} />
        <meshBasicMaterial color="#4a3526" side={DoubleSide} />
      </mesh>
      {TREE_TIERS.map(({ left, right, leftSnow, rightSnow }, index) => (
        <group key={index}>
          <mesh>
            <shapeGeometry args={[left]} />
            <meshBasicMaterial color="#3f7d62" side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <shapeGeometry args={[right]} />
            <meshBasicMaterial color="#2a5846" side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <shapeGeometry args={[leftSnow]} />
            <meshBasicMaterial color="#f6f9fc" side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <shapeGeometry args={[rightSnow]} />
            <meshBasicMaterial color="#d5dfeb" side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TreeModels({ spots }: { spots: readonly TreeSpot[] }) {
  return spots.map(([x, y, scale], index) => (
    <TreeModel key={index} x={x} y={y} scale={scale} />
  ));
}
