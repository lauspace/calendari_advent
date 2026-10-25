/* Suelo nevado: degradado base + montículos difuminados. */
import { MAP_H, MAP_W } from "../constants";
import { DRIFT_SPOTS } from "../data/spots";

export function SnowGround() {
  return (
    <g>
      <rect width={MAP_W} height={MAP_H} fill="url(#am-snow)" />
      <g filter="url(#am-soft)">
        {DRIFT_SPOTS.map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity="0.8" />
        ))}
      </g>
    </g>
  );
}
