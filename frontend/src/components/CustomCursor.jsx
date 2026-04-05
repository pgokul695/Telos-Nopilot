import { useEffect, useMemo, useRef } from "react";

const CURSOR_VARIANTS = {
  segfault: {
    size: 12,
    color: "#ff3333",
    shape: "crosshair",
  },
  gcc: {
    size: 10,
    color: "#888888",
    shape: "dot",
  },
  syntaxterror: {
    size: 14,
    color: "#00ff88",
    shape: "glitch",
  },
};

export default function CustomCursor({ persona }) {
  const cursorRef = useRef(null);
  const posRef = useRef({ x: -100, y: -100 });
  const smoothRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);

  const variant = useMemo(() => CURSOR_VARIANTS[persona] || CURSOR_VARIANTS.gcc, [persona]);

  useEffect(() => {
    const onMove = (event) => {
      posRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      const cursor = cursorRef.current;
      if (cursor) {
        smoothRef.current.x = lerp(smoothRef.current.x, posRef.current.x, 0.18);
        smoothRef.current.y = lerp(smoothRef.current.y, posRef.current.y, 0.18);
        const x = smoothRef.current.x - variant.size;
        const y = smoothRef.current.y - variant.size;
        cursor.style.transform = `translate(${x}px, ${y}px)`;
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
  }, [variant]);

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
