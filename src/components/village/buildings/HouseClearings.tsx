/* Claros de nieve limpia bajo cada casa. */
import { HOUSE_SPOTS } from "../data/spots";

export function HouseClearings() {
  return (
    <g filter="url(#am-soft)">
      {HOUSE_SPOTS.map((h) => (
        <ellipse key={h.id} cx={h.x} cy={h.y + 18} rx={78} ry={42} fill="#ffffff" opacity="0.95" />
      ))}
    </g>
  );
}
