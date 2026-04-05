import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function CompilerSelect({ compilers, selected, onChange, phase }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const isDisabled = phase === "chaos";

  useEffect(() => {
    if (isDisabled) {
      setOpen(false);
    }
  }, [isDisabled]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="relative w-[420px] max-w-full" ref={wrapRef}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-full border px-4 py-2 text-left text-sm transition-all"
        style={{
          borderColor: "var(--accent)",
          color: "var(--accent)",
          opacity: isDisabled ? 0.45 : 1,
          boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 30%, transparent)",
          background: "rgba(8,8,8,0.95)",
        }}
      >
        <span className="truncate">
          {selected.logoGlyph} {selected.displayName}
        </span>
        <span aria-hidden>▾</span>
      </button>

      <AnimatePresence>
        {open && !isDisabled && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border"
            style={{
              borderColor: "var(--border)",
              background: "#0b0b0b",
              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
            }}
          >
            {compilers.map((compiler) => {
              const selectedClass = compiler.id === selected.id;
              return (
                <button
                  key={compiler.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onChange(compiler);
                  }}
                  className="block w-full border-l-2 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                  style={{
                    borderLeftColor: selectedClass ? "var(--accent)" : "transparent",
                    color: selectedClass ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  <div>
                    {compiler.logoGlyph} {compiler.displayName}
                  </div>
                  <div
                    className="mt-0.5 text-xs italic"
                    style={{ color: "color-mix(in srgb, var(--text-primary) 40%, black)" }}
                  >
                    {compiler.tagline}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
