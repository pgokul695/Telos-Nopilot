import { useMemo } from "react";
import { useIsTouchPrimary } from "../utils/inputDevice";

const PERSONA_HEX_COLORS = {
  segfault: {
    stroke: "#00ff88",
    strokeOpacity: 0.12,
    fill: "none",
    bgGlow: "rgba(0, 255, 136, 0.015)",
  },
  gcc: {
    stroke: "#888888",
    strokeOpacity: 0.1,
    fill: "none",
    bgGlow: "rgba(136, 136, 136, 0.012)",
  },
  syntaxterror: {
    stroke: "#ff1a75",
    strokeOpacity: 0.13,
    fill: "none",
    bgGlow: "rgba(255, 26, 117, 0.018)",
  },
};

export default function HexBackground({ persona }) {
  const isTouch = useIsTouchPrimary();

  if (!isTouch) {
    return null;
  }

  const colors = useMemo(() => PERSONA_HEX_COLORS[persona] || PERSONA_HEX_COLORS.gcc, [persona]);
  const patternId = `hex-pattern-${persona || "gcc"}`;

  const polygonStyle = {
    "--hex-stroke": colors.stroke,
    "--hex-opacity": colors.strokeOpacity,
  };

  return (
    <div
      aria-hidden="true"
      className="hex-background"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${colors.bgGlow} 0%, transparent 70%)`,
        }}
      />

      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern id={patternId} x="0" y="0" width="42" height="48.497" patternUnits="userSpaceOnUse">
            <polygon
              className="hex-background-polygon"
              style={polygonStyle}
              points="35,12.124 21,0 7,12.124 7,36.373 21,48.497 35,36.373"
              fill={colors.fill}
              stroke="var(--hex-stroke)"
              strokeOpacity="var(--hex-opacity)"
              strokeWidth="0.75"
            />
            <polygon
              className="hex-background-polygon"
              style={polygonStyle}
              points="56,36.373 42,24.249 28,36.373 28,60.622 42,72.746 56,60.622"
              fill={colors.fill}
              stroke="var(--hex-stroke)"
              strokeOpacity="var(--hex-opacity)"
              strokeWidth="0.75"
            />
            <polygon
              className="hex-background-polygon"
              style={polygonStyle}
              points="14,36.373 0,24.249 -14,36.373 -14,60.622 0,72.746 14,60.622"
              fill={colors.fill}
              stroke="var(--hex-stroke)"
              strokeOpacity="var(--hex-opacity)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
