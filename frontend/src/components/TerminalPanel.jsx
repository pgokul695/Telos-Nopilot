import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { motion } from "framer-motion";

const COMPILER_THEMES = {
  segfault: {
    foreground: "#ff6b6b",
    cursor: "#ff3b3b",
    cursorAccent: "#000000",
    selectionBackground: "#3b0000",
  },
  gcc: {
    foreground: "#c4b5fd",
    cursor: "#a78bfa",
    cursorAccent: "#000000",
    selectionBackground: "#1a0a2e",
  },
  syntaxterror: {
    foreground: "#00ff88",
    cursor: "#00ff88",
    cursorAccent: "#000000",
    selectionBackground: "#001a0d",
  },
};

const BASE_THEME = {
  background: "#0a0a0a",
  black: "#0a0a0a",
  brightBlack: "#333333",
  red: "#ff3b3b",
  brightRed: "#ff6b6b",
  green: "#00ff88",
  brightGreen: "#00ffaa",
  yellow: "#ffb800",
  brightYellow: "#ffd000",
  blue: "#4488ff",
  brightBlue: "#66aaff",
  magenta: "#a78bfa",
  brightMagenta: "#c4b5fd",
  cyan: "#00ffcc",
  brightCyan: "#66ffee",
  white: "#e8e8e8",
  brightWhite: "#ffffff",
};

function escapeXterm(str) {
  return String(str)
    .replace(/\x1b/g, "")
    .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, "");
}

export default function TerminalPanel({ result, isRunning, statusMsg, selectedCompiler }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const compilerTheme = COMPILER_THEMES[selectedCompiler?.id] || COMPILER_THEMES.syntaxterror;
    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorStyle: "bar",
      cursorBlink: true,
      scrollback: 1000,
      theme: { ...BASE_THEME, ...compilerTheme },
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln("\x1b[2m// nopilot terminal ready\x1b[0m");
    term.writeln("\x1b[2m// select a language, write code, click ▶ RUN\x1b[0m");
    term.writeln("");

    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!termRef.current || !selectedCompiler) {
      return;
    }

    const compilerTheme = COMPILER_THEMES[selectedCompiler.id] || COMPILER_THEMES.syntaxterror;
    termRef.current.options.theme = { ...BASE_THEME, ...compilerTheme };
  }, [selectedCompiler]);

  useEffect(() => {
    const term = termRef.current;
    if (!term || !result) {
      return;
    }

    term.writeln("");
    term.writeln(`\x1b[2m──────────── run at ${escapeXterm(result.timestamp)} ────────────\x1b[0m`);
    term.writeln("");

    if (result.header) {
      result.header
        .trimEnd()
        .split("\n")
        .forEach((line) => term.writeln(`\x1b[2m${escapeXterm(line)}\x1b[0m`));
      term.writeln("");
    }

    if (result.stderr) {
      result.stderr
        .trimEnd()
        .split("\n")
        .forEach((line) => {
          if (line.trim()) {
            term.writeln(`\x1b[33m${escapeXterm(line)}\x1b[0m`);
          }
        });
      if (result.stdout) {
        term.writeln("");
      }
    }

    if (result.stdout) {
      result.stdout
        .trimEnd()
        .split("\n")
        .forEach((line) => term.writeln(escapeXterm(line)));
    }

    if (!result.stdout && !result.stderr) {
      term.writeln("\x1b[2m(no output)\x1b[0m");
    }

    if (result.footer) {
      result.footer
        .trimEnd()
        .split("\n")
        .forEach((line) => term.writeln(`\x1b[2m${escapeXterm(line)}\x1b[0m`));
    }

    term.writeln("");
    const exitColor = result.exit_code === 0 ? "\x1b[32m" : "\x1b[31m";
    const exitLabel = result.exit_code === 0 ? "[OK] EXIT 0" : `[ERR] EXIT ${escapeXterm(result.exit_code)}`;
    term.writeln(`${exitColor}${exitLabel}\x1b[0m`);
    term.writeln("");
  }, [result]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) {
      return;
    }
    if (isRunning && statusMsg) {
      term.writeln(`\x1b[2m${escapeXterm(statusMsg)}\x1b[0m`);
    }
  }, [isRunning, statusMsg]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 32,
          background: "#0f0f0f",
          borderBottom: "1px solid #1e1e1e",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
            color: "var(--accent, #00ff88)",
            opacity: 0.7,
            letterSpacing: "0.05em",
          }}
        >
          // TERMINAL
        </span>
        {isRunning && (
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#ffb800",
              animation: "blink 1s step-end infinite",
            }}
          >
            * {statusMsg || "running..."}
          </span>
        )}
        {!isRunning && result && (
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: result.exit_code === 0 ? "#00ff88" : "#ff3b3b",
            }}
          >
            {result.exit_code === 0 ? "* exit 0" : `* exit ${result.exit_code}`}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            termRef.current?.clear();
            termRef.current?.writeln("\x1b[2m// terminal cleared\x1b[0m");
            termRef.current?.writeln("");
          }}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid #1e1e1e",
            color: "#444",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            padding: "2px 8px",
            cursor: "pointer",
            borderRadius: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent, #00ff88)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#444";
          }}
        >
          clear
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, padding: "4px 4px 0 4px" }} />
    </motion.div>
  );
}
