import { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useIsTouchPrimary } from "../utils/inputDevice";

const FLEE_RADIUS = 150;
const DAMPING = 0.88;

const PERSONA_PALETTE = {
  segfault: ["#00ff88", "#00ddaa", "#00ffcc", "#22ff66", "#00cc88"],
  gcc: ["#888888", "#aaaaaa", "#666666", "#999977", "#777788"],
  syntaxterror: ["#ff1a75", "#ff0066", "#ff4da6", "#ff3385", "#cc0052"],
};

const PERSONA_COLORS = {
  segfault: { primary: "#00ff88", secondary: "#00ddaa" },
  gcc: { primary: "#888888", secondary: "#aaaaaa" },
  syntaxterror: { primary: "#ff1a75", secondary: "#ff4da6" },
};

const PERSONA_PHYSICS = {
  segfault: { fleeStrength: 5.5, returnSpeed: 0.032, damping: 0.84 },
  gcc: { fleeStrength: 3.2, returnSpeed: 0.02, damping: 0.92 },
  syntaxterror: { fleeStrength: 7.8, returnSpeed: 0.018, damping: 0.8 },
};

export default function EditorWithParticles({ persona, ...monacoProps }) {
  const { isMobile, isTablet } = useBreakpoint();
  const isTouchPrimary = useIsTouchPrimary();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, inside: false });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const editorRef = useRef(null);

  const particleCount = isTouchPrimary ? 0 : isTablet ? 160 : 280;

  const editorOptions = {
    ...monacoProps.options,
    fontSize: isMobile ? 12 : isTablet ? 13 : 14,
    lineNumbers: isMobile ? "off" : "on",
    minimap: { enabled: !isMobile && !isTablet && monacoProps.options?.minimap?.enabled !== false },
    folding: !isMobile,
    lineDecorationsWidth: isMobile ? 0 : 10,
    renderLineHighlight: isMobile ? "none" : "line",
    scrollBeyondLastLine: false,
    wordWrap: isMobile ? "on" : monacoProps.options?.wordWrap || "off",
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    if (typeof monacoProps.onMount === "function") {
      monacoProps.onMount(editor, monaco);
    }
  };

  const initParticles = (width, height) => {
    const palette = PERSONA_PALETTE[persona] || PERSONA_PALETTE.gcc;
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        originX: x,
        originY: y,
        vx: 0,
        vy: 0,
        w: Math.random() * 5 + 3,
        h: Math.random() * 1.2 + 0.8,
        angle: Math.random() * Math.PI,
        opacity: Math.random() * 0.55 + 0.3,
        color: palette[Math.floor(Math.random() * palette.length)],
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.08 + 0.02,
      };
    });
  };

  useEffect(() => {
    if (isTouchPrimary) {
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (editorRef.current) {
        editorRef.current.layout();
      }

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(rect.width, rect.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        inside: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.inside = false;
    };

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave);

    const tick = () => {
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);

      const { x: mouseX, y: mouseY, inside } = mouseRef.current;
      const colors = PERSONA_COLORS[persona] || PERSONA_COLORS.gcc;
      const physics = PERSONA_PHYSICS[persona] || {
        ...PERSONA_PHYSICS.gcc,
        damping: DAMPING,
      };

      for (const particle of particlesRef.current) {
        particle.driftAngle += 0.003;
        const idleVx = Math.cos(particle.driftAngle) * particle.driftSpeed;
        const idleVy = Math.sin(particle.driftAngle) * particle.driftSpeed;

        if (inside) {
          const dx = particle.x - mouseX;
          const dy = particle.y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < FLEE_RADIUS && distance > 0) {
            const force = (FLEE_RADIUS - distance) / FLEE_RADIUS;
            particle.vx += (dx / distance) * force * physics.fleeStrength;
            particle.vy += (dy / distance) * force * physics.fleeStrength;
          }
        }

        particle.vx += (particle.originX - particle.x) * physics.returnSpeed;
        particle.vy += (particle.originY - particle.y) * physics.returnSpeed;

        particle.vx = (particle.vx + idleVx) * physics.damping;
        particle.vy = (particle.vy + idleVy) * physics.damping;

        particle.x += particle.vx;
        particle.y += particle.vy;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.fillStyle = particle.color || colors.primary;
        context.globalAlpha = particle.opacity;
        context.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
        context.restore();
      }

      context.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      observer.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isTouchPrimary, particleCount, persona]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {isTouchPrimary ? (
        <HexOverlay
          persona={persona}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
      <MonacoEditor
        {...monacoProps}
        onMount={handleEditorMount}
        options={editorOptions}
        height="100%"
        width="100%"
      />
    </div>
  );
}

function HexOverlay({ persona, style }) {
  const colorsByPersona = {
    segfault: { stroke: "#00ff88", opacity: 0.13 },
    gcc: { stroke: "#888888", opacity: 0.1 },
    syntaxterror: { stroke: "#ff1a75", opacity: 0.14 },
  };

  const colors = colorsByPersona[persona] || colorsByPersona.gcc;
  const patternId = `hex-${persona || "gcc"}`;

  return (
    <div aria-hidden="true" style={{ ...style, overflow: "hidden" }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width="42" height="48.497" patternUnits="userSpaceOnUse">
            <polygon
              points="35,12.124 21,0 7,12.124 7,36.373 21,48.497 35,36.373"
              fill="none"
              stroke={colors.stroke}
              strokeOpacity={colors.opacity}
              strokeWidth="0.75"
            />
            <polygon
              points="56,36.373 42,24.249 28,36.373 28,60.622 42,72.746 56,60.622"
              fill="none"
              stroke={colors.stroke}
              strokeOpacity={colors.opacity}
              strokeWidth="0.75"
            />
            <polygon
              points="14,36.373 0,24.249 -14,36.373 -14,60.622 0,72.746 14,60.622"
              fill="none"
              stroke={colors.stroke}
              strokeOpacity={colors.opacity}
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
