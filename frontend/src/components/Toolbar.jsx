import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LANGUAGES } from "../constants/languages";
import CompilerSelect from "./CompilerSelect";
import GlitchText from "./GlitchText";
import RunButton from "./RunButton";

export default function Toolbar({
  compilers,
  selectedCompiler,
  onCompilerChange,
  onAnalyze,
  phase,
  selectedLanguage,
  onLanguageChange,
  onRun,
  isRunning,
  isRoastBusy,
}) {
  const [buttonText, setButtonText] = useState(selectedCompiler.buttonLabel);

  useEffect(() => {
    if (phase !== "chaos") {
      setButtonText(selectedCompiler.buttonLabel);
      return;
    }

    const cycle = selectedCompiler.chaosMessages.slice(0, 4);
    let index = 0;
    setButtonText(cycle[index]);

    const id = setInterval(() => {
      index = (index + 1) % cycle.length;
      setButtonText(cycle[index]);
    }, 300);

    return () => clearInterval(id);
  }, [phase, selectedCompiler]);

  return (
    <header
      className="relative flex h-[52px] items-center justify-between px-4"
      style={{
        borderBottom: "1px solid var(--border)",
        boxShadow: `0 1px 0 color-mix(in srgb, var(--accent) ${phase === "chaos" ? "100%" : "20%"}, transparent)`,
      }}
    >
      <div className="min-w-0">
        <div className="text-lg font-bold leading-none">
          <GlitchText text="Nopilot" active={phase === "chaos"} color="var(--accent)" />
          <span className="animate-blink" style={{ color: "var(--accent)" }}>
            ▋
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">not your copilot</div>
      </div>

      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => onLanguageChange(lang)}
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 20,
                border: `1px solid ${selectedLanguage.id === lang.id ? "var(--accent)" : "#2a2a2a"}`,
                background: selectedLanguage.id === lang.id ? "var(--accent)" : "transparent",
                color: selectedLanguage.id === lang.id ? "#000" : "#555",
                cursor: "pointer",
                transition: "all 150ms",
                letterSpacing: "0.03em",
              }}
            >
              {lang.label}
            </button>
          ))}
          <RunButton onClick={onRun} isRunning={isRunning} disabled={phase === "chaos"} />
        </div>

        <div className="h-6 w-px" style={{ background: "#1e1e1e" }} />

        <CompilerSelect compilers={compilers} selected={selectedCompiler} onChange={onCompilerChange} phase={phase} />
      </div>

      <motion.button
        key={`${selectedCompiler.id}-${selectedCompiler.buttonLabel}`}
        type="button"
        onClick={onAnalyze}
        disabled={isRoastBusy}
        initial={{ scale: 1 }}
        animate={{ scale: phase === "chaos" ? [1, 1.03, 1] : [1, 1.05, 1] }}
        exit={{ scale: 1 }}
        transition={{
          duration: 0.25,
          repeat: phase === "chaos" ? Infinity : 0,
          repeatType: "loop",
        }}
        className="compile-button h-[34px] min-w-[200px] rounded px-3 text-xs"
        style={{
          border: "1px solid var(--accent)",
          color: phase === "chaos" ? "#000" : "var(--accent)",
          background: phase === "chaos" ? "var(--accent)" : "transparent",
          transition: "all 200ms",
          opacity: isRoastBusy ? 0.55 : 1,
          cursor: isRoastBusy ? "not-allowed" : "pointer",
        }}
      >
        {buttonText}
      </motion.button>
    </header>
  );
}
