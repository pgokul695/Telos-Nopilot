import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LANGUAGES } from "../constants/languages";
import { useBreakpoint } from "../hooks/useBreakpoint";
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
  const { isMobile, isTablet } = useBreakpoint();

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

  const languagePills = (compact = false, scrollable = false) => (
    <div
      className={scrollable ? "flex items-center gap-2 overflow-x-auto" : "flex items-center gap-2"}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => onLanguageChange(lang)}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: compact ? 10 : 11,
            padding: compact ? "4px 8px" : "4px 10px",
            borderRadius: 20,
            border: `1px solid ${selectedLanguage.id === lang.id ? "var(--accent)" : "#2a2a2a"}`,
            background: selectedLanguage.id === lang.id ? "var(--accent)" : "transparent",
            color: selectedLanguage.id === lang.id ? "#000" : "#555",
            cursor: "pointer",
            transition: "all 150ms",
            letterSpacing: "0.03em",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {compact ? (lang.id === "javascript" ? "JS" : lang.id === "python" ? "PY" : "C++") : lang.label}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <header
          className="relative flex h-[44px] items-center justify-between px-3"
          style={{
            borderBottom: "1px solid var(--border)",
            boxShadow: `0 1px 0 color-mix(in srgb, var(--accent) ${phase === "chaos" ? "100%" : "20%"}, transparent)`,
          }}
        >
          <div className="min-w-0">
            <div className="text-base font-bold leading-none" style={{ color: "var(--accent)" }}>
              Nopilot
            </div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">not your copilot</div>
          </div>

          <div className="flex items-center gap-2">
            <RunButton onClick={onRun} isRunning={isRunning} disabled={phase === "chaos"} />
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isRoastBusy}
              className="h-[32px] w-[32px] rounded border text-sm"
              style={{
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                background: "transparent",
                opacity: isRoastBusy ? 0.45 : 1,
              }}
              title={buttonText}
            >
              ⚙
            </button>
          </div>
        </header>

        <div className="mobile-toolbar">
          {languagePills(true, true)}
          <CompilerSelect
            compilers={compilers}
            selected={selectedCompiler}
            onChange={onCompilerChange}
            phase={phase}
            fullWidth
            compact
          />
        </div>
      </>
    );
  }

  if (isTablet) {
    return (
      <header
        className="relative flex h-[48px] items-center justify-between gap-2 px-3"
        style={{
          borderBottom: "1px solid var(--border)",
          boxShadow: `0 1px 0 color-mix(in srgb, var(--accent) ${phase === "chaos" ? "100%" : "20%"}, transparent)`,
        }}
      >
        <div className="min-w-0 text-base font-bold leading-none" style={{ color: "var(--accent)" }}>
          Nopilot
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {languagePills(true, true)}
          <RunButton onClick={onRun} isRunning={isRunning} disabled={phase === "chaos"} />
          <CompilerSelect
            compilers={compilers}
            selected={selectedCompiler}
            onChange={onCompilerChange}
            phase={phase}
            compact
          />
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isRoastBusy}
            className="h-[32px] w-[32px] rounded border text-sm"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              background: "transparent",
              opacity: isRoastBusy ? 0.45 : 1,
            }}
            title={buttonText}
          >
            ⚙
          </button>
        </div>
      </header>
    );
  }

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
          {languagePills()}
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
