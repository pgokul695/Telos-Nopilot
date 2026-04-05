import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChaoticLoader from "./components/ChaoticLoader";
import Editor from "./components/Editor";
import OutputPanel from "./components/OutputPanel";
import StatusBar from "./components/StatusBar";
import TerminalPanel from "./components/TerminalPanel";
import Toolbar from "./components/Toolbar";
import UnpilotPanel from "./components/UnpilotPanel";
import { COMPILERS } from "./constants/compilers";
import { DEFAULT_LANGUAGE } from "./constants/languages";
import { useExecutor } from "./hooks/useExecutor";
import { usePrankSequence } from "./hooks/usePrankSequence";
import { useStream } from "./hooks/useStream";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function App() {
  const [phase, setPhase] = useState("idle");
  const [code, setCode] = useState(DEFAULT_LANGUAGE.defaultCode);
  const [selectedCompiler, setSelectedCompiler] = useState(COMPILERS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [rightTab, setRightTab] = useState("unpilot");
  const [tokenCount, setTokenCount] = useState(0);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-[var(--text-primary)]">
      <div
        className="grid h-full"
        style={{
          gridTemplateRows: "52px 1fr 28px",
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

        <main className="grid min-h-0" style={{ gridTemplateColumns: "58% 42%" }}>
          <Editor
            code={code}
            setCode={setCode}
            selectedLanguage={selectedLanguage}
            phase={effectivePhase}
          />

          <section className="relative flex min-h-0 flex-col overflow-hidden">
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #1e1e1e",
                background: "#0f0f0f",
                flexShrink: 0,
              }}
            >
              {["unpilot", "terminal", "output"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    padding: "8px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: rightTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                    color: rightTab === tab ? "var(--accent)" : "#444",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {tab === "unpilot"
                    ? `UNPILOT ★ · ${selectedCompiler.displayName}`
                    : tab === "terminal" && isRunning
                      ? `● ${tab}`
                      : tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <div style={{ display: rightTab === "unpilot" ? "block" : "none", height: "100%" }}>
                <UnpilotPanel
                  selectedCompiler={selectedCompiler}
                  selectedLanguage={selectedLanguage}
                  codeContext={code}
                  onInsertCode={handleInsertCode}
                />
              </div>

              {rightTab === "terminal" && (
                <TerminalPanel
                  result={result}
                  isRunning={isRunning}
                  statusMsg={statusMsg}
                  selectedCompiler={selectedCompiler}
                />
              )}

              {rightTab === "output" &&
                (effectivePhase === "chaos" ? (
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
                ))}
            </div>
          </section>
        </main>

        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          className="flex items-center border-t px-3"
          style={{ borderColor: "var(--border)", color: "#666" }}
        >
          <motion.div
            key={selectedCompiler.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="text-[11px] italic"
          >
            {selectedCompiler.tagline}
          </motion.div>
        </motion.div>
      </div>

      <StatusBar
        selectedCompiler={selectedCompiler}
        selectedLanguage={selectedLanguage}
        phase={effectivePhase}
        tokenCount={tokenCount}
      />
    </div>
  );
}
