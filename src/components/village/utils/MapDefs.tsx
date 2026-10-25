/* Definiciones SVG compartidas (gradientes, filtros). Se renderiza una sola vez. */
import { HouseDefs } from "../buildings/House";
import { PondDefs } from "../nature/Pond";

export function MapDefs() {
  return (
    <defs>
      <linearGradient id="am-snow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f8fb" />
        <stop offset="1" stopColor="#e4ebf3" />
      </linearGradient>
      <radialGradient id="am-vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stopColor="#c9d5e4" stopOpacity="0" />
        <stop offset="1" stopColor="#c9d5e4" stopOpacity="0.55" />
      </radialGradient>
      <filter id="am-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <filter id="am-soft-sm" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <PondDefs />
      <HouseDefs />
    </defs>
  );
}