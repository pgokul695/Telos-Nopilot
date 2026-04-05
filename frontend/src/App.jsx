import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChaoticLoader from "./components/ChaoticLoader";
import CustomCursor from "./components/CustomCursor";
import Editor from "./components/Editor";
import HexBackground from "./components/HexBackground";
import OutputPanel from "./components/OutputPanel";
import StatusBar from "./components/StatusBar";
import TerminalPanel from "./components/TerminalPanel";
import Toolbar from "./components/Toolbar";
import UnpilotPanel from "./components/UnpilotPanel";
import { COMPILERS } from "./constants/compilers";
import { DEFAULT_LANGUAGE } from "./constants/languages";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { useIsTouchPrimary } from "./utils/inputDevice";
import { useExecutor } from "./hooks/useExecutor";
import { usePrankSequence } from "./hooks/usePrankSequence";
import { useStream } from "./hooks/useStream";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function App() {
  const { isMobile, isTablet } = useBreakpoint();
  const isTouchPrimary = useIsTouchPrimary();
  const [phase, setPhase] = useState("idle");
  const [code, setCode] = useState(DEFAULT_LANGUAGE.defaultCode);
  const [selectedCompiler, setSelectedCompiler] = useState(COMPILERS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [rightTab, setRightTab] = useState("unpilot");
  const [tokenCount, setTokenCount] = useState(0);
  const touchStartXRef = useRef(null);

  const { run, isRunning, result, statusMsg } = useExecutor();
  const { isChaos, startChaos } = usePrankSequence();
  const { output, setOutput, isStreaming, error, startStream } = useStream();

  const effectivePhase = useMemo(() => {
    if (isChaos) {
      return "chaos";
    }
    return phase;
  }, [isChaos, phase]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", selectedCompiler.accentColor);
    root.style.setProperty("--accent-dim", selectedCompiler.accentColorDim);
  }, [selectedCompiler]);

  useEffect(() => {
    if (!(effectivePhase === "chaos" || effectivePhase === "output")) {
      return;
    }

    const interval = setInterval(() => {
      setTokenCount((prev) => prev + randomInt(3, 12));
    }, 400);

    return () => clearInterval(interval);
  }, [effectivePhase]);

  useEffect(() => {
    if (!error) {
      return;
    }
    setPhase("output");
  }, [error]);

  const handleCompilerChange = (compiler) => {
    setSelectedCompiler(compiler);
    setOutput("");
    setPhase("idle");
  };

  const handleAnalyze = () => {
    if (effectivePhase === "chaos" || isStreaming) {
      return;
    }

    setRightTab("output");
    setOutput("");
    setPhase("chaos");

    startChaos(selectedCompiler.chaosDurationMs, async () => {
      setPhase("output");
      await startStream(code, selectedCompiler.id);
    });
  };

  const handleRun = useCallback(() => {
    run(code, selectedLanguage.id, selectedCompiler.id);
    setRightTab("terminal");
  }, [code, selectedLanguage.id, selectedCompiler.id, run]);

  const handleInsertCode = useCallback(
    (generatedCode) => {
      if (!generatedCode?.trim()) {
        return;
      }

      if (!code.trim()) {
        setCode(generatedCode);
        return;
      }

      const separator = selectedLanguage.id === "python" ? "# ---- UNPILOT INSERT ----" : "// ---- UNPILOT INSERT ----";
      setCode((prev) => `${prev}\n\n${separator}\n${generatedCode}`);
    },
    [code, selectedLanguage.id]
  );

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  const tabs = ["unpilot", "terminal", "output"];
  const isStacked = isMobile || isTablet;
  const editorHeight = isMobile ? "45vh" : isTablet ? "55vh" : "auto";

  const handlePanelTouchStart = (event) => {
    if (!isMobile) {
      return;
    }
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handlePanelTouchEnd = (event) => {
    if (!isMobile || touchStartXRef.current == null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== "number") {
      touchStartXRef.current = null;
      return;
    }

    const delta = endX - touchStartXRef.current;
    if (Math.abs(delta) > 50) {
      const currentIndex = tabs.indexOf(rightTab);
      const direction = delta < 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
      setRightTab(tabs[nextIndex]);
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-[var(--text-primary)]">
      <HexBackground persona={selectedCompiler.id} />
      {!isTouchPrimary && <CustomCursor persona={selectedCompiler.id} />}

      <div
        className="relative z-[1] flex h-full flex-col"
        style={{
          transition:
            "color 600ms ease, border-color 600ms ease, background-color 600ms ease, box-shadow 600ms ease",
        }}
      >
        <Toolbar
          compilers={COMPILERS}
          selectedCompiler={selectedCompiler}
          onCompilerChange={handleCompilerChange}
          onAnalyze={handleAnalyze}
          phase={effectivePhase}
          selectedLanguage={selectedLanguage}
          onLanguageChange={(lang) => {
            setSelectedLanguage(lang);
          }}
          onRun={handleRun}
          isRunning={isRunning}
          isRoastBusy={effectivePhase === "chaos" || isStreaming}
        />

        <main
          className="min-h-0 flex-1"
          style={
            isStacked
              ? { display: "flex", flexDirection: "column", overflow: "hidden" }
              : { display: "grid", gridTemplateColumns: "58% 42%", overflow: "hidden" }
          }
        >
          <div style={isStacked ? { height: editorHeight, flexShrink: 0, minHeight: 0 } : { minHeight: 0 }}>
            <Editor
              code={code}
              setCode={setCode}
              selectedLanguage={selectedLanguage}
              phase={effectivePhase}
              persona={selectedCompiler.id}
            />
          </div>

          <section
            className="right-pane relative flex min-h-0 flex-col overflow-hidden"
            style={
              isStacked
                ? {
                    borderTop: "1px solid var(--border)",
                    flex: 1,
                  }
                : undefined
            }
          >
            <div
              className="panel-tabs"
              style={{
                borderBottom: "1px solid #1e1e1e",
                background: "#0f0f0f",
                flexShrink: 0,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  className="panel-tab"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    background: "none",
                    border: "none",
                    borderBottom: rightTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                    color: rightTab === tab ? "var(--accent)" : "#444",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {tab === "unpilot"
                    ? isMobile
                      ? "UNPILOT ★"
                      : `UNPILOT ★ · ${selectedCompiler.displayName}`
                    : tab === "terminal" && isRunning
                      ? `● ${tab}`
                      : tab}
                </button>
              ))}
            </div>

            <div
              className="panel-content"
              style={{ flex: 1, overflow: "hidden", position: "relative", padding: 0 }}
              onTouchStart={handlePanelTouchStart}
              onTouchEnd={handlePanelTouchEnd}
            >
              <div
                className={rightTab === "unpilot" ? "panel-tab-content panel-tab-content--active" : "panel-tab-content"}
              >
                <UnpilotPanel
                  selectedCompiler={selectedCompiler}
                  selectedLanguage={selectedLanguage}
                  codeContext={code}
                  onInsertCode={handleInsertCode}
                />
              </div>

              <div
                className={rightTab === "terminal" ? "panel-tab-content panel-tab-content--active" : "panel-tab-content"}
              >
                <TerminalPanel
                  result={result}
                  isRunning={isRunning}
                  statusMsg={statusMsg}
                  selectedCompiler={selectedCompiler}
                />
              </div>

              <div
                className={rightTab === "output" ? "panel-tab-content panel-tab-content--active" : "panel-tab-content"}
              >
                {effectivePhase === "chaos" ? (
                  <ChaoticLoader selectedCompiler={selectedCompiler} phase={effectivePhase} />
                ) : (
                  <>
                    <OutputPanel
                      output={error ? `${output}\n\n[stream error] ${error}` : output}
                      phase={effectivePhase}
                      selectedCompiler={selectedCompiler}
                      isStreaming={isStreaming}
                    />

                    {effectivePhase === "idle" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center text-center text-sm"
                        style={{ color: "#555" }}
                      >
                        Select a compiler and press {selectedCompiler.buttonLabel}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </main>

        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          className="flex items-center border-t px-3 text-[11px] italic"
          style={{ borderColor: "var(--border)", color: "#666", minHeight: 24 }}
        >
          {selectedCompiler.tagline}
        </motion.div>

        <StatusBar
          selectedCompiler={selectedCompiler}
          selectedLanguage={selectedLanguage}
          phase={effectivePhase}
          tokenCount={tokenCount}
        />
      </div>
    </div>
  );
}
