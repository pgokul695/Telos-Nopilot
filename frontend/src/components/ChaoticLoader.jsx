import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import FakeProgressBar from "./FakeProgressBar";

const LOG_SNIPPETS = [
  "Initializing compiler runtime...",
  "Parsing AST...",
  "Warning: deprecated API usage",
  "Resolving phantom dependencies...",
  "Inlining unresolved promises...",
  "Error: see above",
  "Patching optimism...",
  "Rewriting your stack trace...",
  "Injecting confidence failure...",
  "Verifying impossible assumptions...",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ChaoticLoader({ selectedCompiler, phase }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const activeMessage = useMemo(
    () => selectedCompiler.chaosMessages[messageIndex % selectedCompiler.chaosMessages.length],
    [messageIndex, selectedCompiler]
  );

  useEffect(() => {
    setMessageIndex(0);
    setLogs([]);
  }, [selectedCompiler.id]);

  useEffect(() => {
    if (phase !== "chaos") {
      return;
    }

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => prev + 1);
    }, 400);

    const start = performance.now();
    const logInterval = setInterval(() => {
      const elapsed = performance.now() - start;
      const mm = "00";
      const ss = String(Math.floor(elapsed / 1000)).padStart(2, "0");
      const ms = String(Math.floor(elapsed % 1000)).padStart(3, "0");
      const line = `[${mm}:${ss}.${ms}] ${pickRandom(LOG_SNIPPETS)}`;

      setLogs((prev) => [...prev, line].slice(-6));
    }, 150);

    return () => {
      clearInterval(messageInterval);
      clearInterval(logInterval);
    };
  }, [phase]);

  if (phase !== "chaos") {
    return null;
  }

  return (
    <div className="flex h-full flex-col justify-start gap-5 p-6" style={{ background: "#090909" }}>
      <div className="h-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeMessage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="text-sm"
            style={{ color: "var(--accent)" }}
          >
            {activeMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      <FakeProgressBar compiler={selectedCompiler} />

      <div
        className="mt-2 h-[180px] overflow-hidden rounded border px-3 py-2"
        style={{ borderColor: "var(--border)", background: "rgba(0, 0, 0, 0.6)" }}
      >
        <AnimatePresence initial={false}>
          {logs.map((line) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12 }}
              className="font-mono text-[10px] leading-5"
              style={{ color: "#5c5c5c" }}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
