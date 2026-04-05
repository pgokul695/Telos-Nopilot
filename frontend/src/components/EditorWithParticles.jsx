import { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

const PARTICLE_COUNT = 280;
const FLEE_RADIUS = 150;
const DAMPING = 0.88;

const PERSONA_PALETTE = {
  segfault: ["#ff4444", "#ff2222", "#cc2222", "#ff6655", "#dd3333"],
  gcc: ["#888888", "#aaaaaa", "#666666", "#999977", "#777788"],
  syntaxterror: ["#00ff88", "#00ddaa", "#00ffcc", "#22ff66", "#00cc88"],
};

const PERSONA_PHYSICS = {
  segfault: { fleeStrength: 5.5, returnSpeed: 0.032, damping: 0.84 },
  gcc: { fleeStrength: 3.2, returnSpeed: 0.02, damping: 0.92 },
  syntaxterror: { fleeStrength: 7.8, returnSpeed: 0.018, damping: 0.8 },
};

export default function EditorWithParticles({ persona, ...monacoProps }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, inside: false });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const initParticles = (width, height) => {
    const palette = PERSONA_PALETTE[persona] || PERSONA_PALETTE.gcc;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
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
        context.fillStyle = particle.color;
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
  }, [persona]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
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
      <MonacoEditor {...monacoProps} />
    </div>
  );
}
