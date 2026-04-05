import { useEffect, useMemo, useState } from "react";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function StatusBar({ selectedCompiler, selectedLanguage, phase, tokenCount }) {
  const [bugCount, setBugCount] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setBugCount(0);
  }, [selectedCompiler.id]);

  useEffect(() => {
    if (!(selectedCompiler.statusBarText.includes("[incrementing]") && phase === "chaos")) {
      return;
    }

    const interval = setInterval(() => {
      setBugCount((prev) => prev + randomInt(1, 3));
    }, 300);

    return () => clearInterval(interval);
  }, [phase, selectedCompiler.statusBarText]);

  useEffect(() => {
    if (phase !== "chaos") {
      setFlash(false);
      return;
    }

    setFlash(true);
    const timeout = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(timeout);
  }, [phase, tokenCount]);

  const statusText = useMemo(() => {
    let text = selectedCompiler.statusBarText;
    text = text.replace("[incrementing]", `${bugCount}`);
    text = text.replace("[random]", `${tokenCount}`);
    return text;
  }, [bugCount, selectedCompiler.statusBarText, tokenCount]);

  const engineLabel =
    selectedLanguage.engine === "wandbox"
      ? "Wandbox (remote)"
      : selectedLanguage.engine === "pyodide"
        ? "Pyodide (WASM)"
        : "Web Worker";

  return (
    <footer
      className="status-bar"
      style={{
        borderColor: "var(--border)",
        background: flash ? "var(--accent-dim)" : "#0a0a0a",
        color: "#8d8d8d",
        transition: "background 180ms",
      }}
    >
      <span>
        <span className="status-item">{selectedLanguage.label}</span>
        <span className="status-item status-item--secondary"> · {engineLabel}</span>
        <span className="status-item"> | {statusText.split("|")[0].trim()}</span>
        {statusText
          .split("|")
          .slice(1)
          .map((segment, index) => (
            <span key={`${segment}-${index}`} className="status-item status-item--secondary">
              {` | ${segment.trim()}`}
            </span>
          ))}
      </span>
      <span className="status-item status-item--secondary" style={{ color: "#5e5e5e" }}>
        ctrl+enter run  ·  tab complete
      </span>
      <span className="status-item status-item--secondary" title="does nothing" style={{ color: "#ff3b3b" }}>
          ●
      </span>
      <span className="status-item status-item--secondary" title="also does nothing" style={{ color: "#ffb800" }}>
          ●
      </span>
      <span className="status-item" title="you thought this would do something" style={{ color: "#00ff88" }}>
          ●
      </span>
    </footer>
  );
}
