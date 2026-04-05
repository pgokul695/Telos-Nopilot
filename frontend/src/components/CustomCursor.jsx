import { useEffect, useRef } from "react";

const CURSOR_VARIANTS = {
  segfault: {
    size: 12,
    color: "#00ff88",
    shape: "crosshair",
    innerLerp: null,
    outerLerp: null,
  },
  gcc: {
    size: 10,
    color: "#888888",
    shape: "dot",
    innerLerp: null,
    outerLerp: null,
  },
  syntaxterror: {
    innerSize: 7,
    outerSize: 30,
    color: "#ff1a75",
    shape: "dualring",
    innerLerp: 0.3,
    outerLerp: 0.11,
  },
};

export default function CustomCursor({ persona }) {
  const cursorRef = useRef(null);
  const innerRef = useRef(null);
  const outerRef = useRef(null);
  const mousePos = useRef({ x: -200, y: -200 });
  const innerPos = useRef({ x: -200, y: -200 });
  const outerPos = useRef({ x: -200, y: -200 });
  const currentPos = useRef({ x: -200, y: -200 });
  const rafRef = useRef(null);
  const variant = CURSOR_VARIANTS[persona] || CURSOR_VARIANTS.gcc;
  const isDualRing = variant.shape === "dualring";

  useEffect(() => {
    const onMove = (event) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      const activeVariant = CURSOR_VARIANTS[persona] || CURSOR_VARIANTS.gcc;

      if (activeVariant.shape === "dualring") {
        innerPos.current.x = lerp(innerPos.current.x, mousePos.current.x, activeVariant.innerLerp);
        innerPos.current.y = lerp(innerPos.current.y, mousePos.current.y, activeVariant.innerLerp);

        outerPos.current.x = lerp(outerPos.current.x, innerPos.current.x, activeVariant.outerLerp);
        outerPos.current.y = lerp(outerPos.current.y, innerPos.current.y, activeVariant.outerLerp);

        if (innerRef.current) {
          innerRef.current.style.transform = `translate(${innerPos.current.x - activeVariant.innerSize / 2}px, ${innerPos.current.y - activeVariant.innerSize / 2}px)`;
        }

        if (outerRef.current) {
          outerRef.current.style.transform = `translate(${outerPos.current.x - activeVariant.outerSize / 2}px, ${outerPos.current.y - activeVariant.outerSize / 2}px)`;
        }
      } else {
        currentPos.current.x = lerp(currentPos.current.x, mousePos.current.x, 0.18);
        currentPos.current.y = lerp(currentPos.current.y, mousePos.current.y, 0.18);

        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${currentPos.current.x - activeVariant.size / 2}px, ${currentPos.current.y - activeVariant.size / 2}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [persona]);

  if (isDualRing) {
    return (
      <>
        <div
          ref={innerRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: variant.innerSize,
            height: variant.innerSize,
            borderRadius: "50%",
            backgroundColor: variant.color,
            pointerEvents: "none",
            zIndex: 99999,
            willChange: "transform",
            mixBlendMode: "difference",
          }}
        />
        <div
          ref={outerRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: variant.outerSize,
            height: variant.outerSize,
            borderRadius: "50%",
            border: `1.5px solid ${variant.color}`,
            backgroundColor: "transparent",
            opacity: 0.65,
            pointerEvents: "none",
            zIndex: 99998,
            willChange: "transform",
            mixBlendMode: "difference",
          }}
        />
      </>
    );
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: variant.size * 2,
        height: variant.size * 2,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform",
        mixBlendMode: "difference",
      }}
    >
      <CursorShape shape={variant.shape} size={variant.size} color={variant.color} />
    </div>
  );
}

function CursorShape({ shape, size, color }) {
  if (shape === "crosshair") {
    return (
      <svg width={size * 2} height={size * 2} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="2" x2="12" y2="8" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="16" x2="12" y2="22" stroke={color} strokeWidth="1.5" />
        <line x1="2" y1="12" x2="8" y2="12" stroke={color} strokeWidth="1.5" />
        <line x1="16" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }

  if (shape === "dot") {
    return (
      <svg width={size * 2} height={size * 2} viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" fill={color} opacity="0.9" />
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="0.75" opacity="0.4" />
      </svg>
    );
  }

  if (shape === "glitch") {
    return (
      <svg width={size * 2} height={size * 2} viewBox="0 0 24 24" fill="none">
        <rect x="8" y="2" width="2" height="14" fill={color} opacity="0.9" />
        <rect x="10" y="4" width="2" height="14" fill={color} opacity="0.4" />
        <rect x="6" y="14" width="8" height="2" fill={color} opacity="0.6" />
      </svg>
    );
  }

  return null;
}
