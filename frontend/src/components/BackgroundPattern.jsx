import React from "react";

// Decorative, low-opacity scattered icon pattern used behind page content
// instead of stock photography (kept as lightweight inline SVG so no
// external image assets are needed). Purely decorative — aria-hidden and
// pointer-events-none so it never interferes with the real UI.
const ICONS = {
  bowl: "M6 22C6 22 6 34 24 34C42 34 42 22 42 22H6Z M4 19H44V23H4Z",
  leaf: "M24 4C24 4 8 12 8 26C8 36 16 42 24 42C32 42 40 36 40 26C40 12 24 4 24 4Z",
  heart: "M24 42C24 42 6 30 6 17C6 10 11 6 17 6C20.5 6 23 8 24 10C25 8 27.5 6 31 6C37 6 42 10 42 17C42 30 24 42 24 42Z",
};

const BackgroundPattern = ({ tint = "#16A34A", icon = "bowl", density = 12 }) => {
  const path = ICONS[icon] || ICONS.bowl;
  // Positions are in a 0-100 viewBox grid (percent-like), which SVG
  // transforms handle correctly (unlike literal "%" units in transform).
  const positions = Array.from({ length: density }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    s: 0.6 + ((i * 7) % 10) / 10,
    r: (i * 47) % 360,
    o: 0.035 + ((i % 3) * 0.02),
  }));

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${p.r}) scale(${p.s * 0.06})`}>
          <path d={path} transform="translate(-24,-24)" fill={tint} opacity={p.o} />
        </g>
      ))}
    </svg>
  );
};

export default BackgroundPattern;
