/* Estanque helado con reflejos y borde nevado. */

export const POND_D =
  "M132 478 C170 470 215 480 252 494 C290 508 310 535 340 552 C365 566 372 585 350 592 " +
  "C310 600 260 590 215 568 C170 548 135 525 128 505 C124 492 125 482 132 478 Z";

export function PondDefs() {
  return (
    <>
      <linearGradient id="am-ice" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d3e1ee" />
        <stop offset="0.55" stopColor="#bcd0e2" />
        <stop offset="1" stopColor="#c9d9e8" />
      </linearGradient>
      <clipPath id="am-pond-clip">
        <path d={POND_D} />
      </clipPath>
    </>
  );
}

export function Pond() {
  return (
    <g>
      <path d={POND_D} fill="#aebfd2" transform="translate(0 4)" opacity="0.6" />
      <path d={POND_D} fill="url(#am-ice)" />
      <g clipPath="url(#am-pond-clip)" opacity="0.55" fill="none" stroke="#f4f8fc" strokeLinecap="round">
        <path d="M150 505 Q210 520 262 545" strokeWidth="2" />
        <path d="M200 548 Q260 565 320 575" strokeWidth="1.5" />
        <path d="M270 506 Q300 530 330 545" strokeWidth="1.5" />
      </g>
      <path d={POND_D} fill="none" stroke="#f9fbfd" strokeWidth="5" opacity="0.9" />
    </g>
  );
}
