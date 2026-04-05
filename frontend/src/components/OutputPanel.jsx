import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const GLITCH_SYMBOLS = ["░", "▒", "▓", "█"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function formatTimestamp(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export default function OutputPanel({ output, phase, selectedCompiler, isStreaming }) {
  const [timestamp, setTimestamp] = useState(formatTimestamp(new Date()));
  const [glitch, setGlitch] = useState(null);

  useEffect(() => {
    if (phase === "output") {
      setTimestamp(formatTimestamp(new Date()));
    }
  }, [phase, selectedCompiler.id]);

  useEffect(() => {
    if (!(isStreaming && selectedCompiler.outputGlitch && output.length > 0)) {
      setGlitch(null);
      return;
    }

    const interval = setInterval(() => {
      const index = randomInt(0, Math.max(0, output.length - 1));
      const symbol = pick(GLITCH_SYMBOLS);
      setGlitch({ index, symbol });
      setTimeout(() => setGlitch(null), 120);
    }, 800);

    return () => clearInterval(interval);
  }, [isStreaming, output, selectedCompiler.outputGlitch]);

  const displayedOutput = useMemo(() => {
    if (!glitch || !selectedCompiler.outputGlitch) {
      return output;
    }

    return `${output.slice(0, glitch.index)}${glitch.symbol}${output.slice(glitch.index)}`;
  }, [glitch, output, selectedCompiler.outputGlitch]);

  if (phase === "idle") {
    return <div style={{ display: "none" }} />;
  }

  return (
    <AnimatePresence>
      <motion.section
        key={selectedCompiler.id + phase}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative flex h-full flex-col overflow-hidden"
        style={{ background: selectedCompiler.outputBg }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 text-xs"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--accent)" }}>// {selectedCompiler.outputHeaderLabel}</span>
          <span className="text-neutral-500">{timestamp}</span>
        </div>

        <div
          className="relative flex-1 overflow-auto p-5 text-[13px] leading-[1.7]"
          style={{ color: selectedCompiler.outputTextColor, whiteSpace: "pre-wrap" }}
        >
          {displayedOutput}
          {isStreaming && <span className="animate-blink">▋</span>}
        </div>

        {!isStreaming && output && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: selectedCompiler.endBadgePulse ? [1, 1.05, 1] : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.25,
              repeat: selectedCompiler.endBadgePulse ? Infinity : 0,
              repeatType: "loop",
            }}
            className="absolute bottom-3 right-3 rounded px-3 py-1 text-[10px] tracking-[0.14em]"
            style={{
              background: selectedCompiler.accentColor,
              color: selectedCompiler.endBadgeTextColor,
            }}
          >
            {selectedCompiler.endBadgeLabel}
          </motion.div>
        )}
      </motion.section>
    </AnimatePresence>
  );
}
