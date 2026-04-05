import { useCallback, useRef, useState } from "react";
import { LANGUAGE_MAP } from "../constants/languages";

const FLAVORS = {
  segfault: (result) => {
    const warnings = [
      "segfault.ai: warning: implicit memory contract violation",
      "segfault.ai: note: 3 heap objects will not be freed",
      "segfault.ai: warning: undefined behavior detected (continuing anyway)",
      "",
    ].join("\n");

    const footer =
      result.exit_code === 0
        ? [
            "",
            "──────────────────────────────────────",
            "LEAK SUMMARY: definitely leaking",
            `  total heap usage: ${(result.stdout.length * 47).toLocaleString()} allocs`,
            "  LEAK: 1,337 bytes in 42 blocks (your problem now)",
            "segfault.ai: process exited. probably.",
          ].join("\n")
        : [
            "",
            "──────────────────────────────────────",
            "Segmentation fault (core dumped)",
            `segfault.ai: ${Math.abs(result.exit_code)} crimes against memory committed`,
          ].join("\n");

    return { header: warnings, footer };
  },

  gcc: (result) => {
    const header =
      result.exit_code === 0
        ? "gcc: We have concerns.\ngcc: Your program ran. We're not sure how to feel about that.\ngcc: note: success does not imply correctness.\n\n"
        : "gcc: We noticed a few things.\ngcc: This is not entirely unexpected.\n\n";

    const footer =
      result.exit_code === 0
        ? "\n──────────────────────────────────────\ngcc: exit 0.\ngcc: We believe in you. We just don't believe in this."
        : "\n──────────────────────────────────────\ngcc: We're not angry. We're just... processing.";

    return { header, footer };
  },

  syntaxterror: (result) => {
    const injected = Math.floor(Math.random() * 5) + 2;
    const activated = Math.floor(Math.random() * injected);
    const header = [
      "SyntaxTerror v13 — execution report",
      `bugs injected during compilation: ${injected}`,
      `bugs activated at runtime:        ${activated}`,
      `bugs you will ever find:          ${Math.max(0, injected - activated - 1)}`,
      "",
    ].join("\n");

    const reportedExit = result.exit_code !== 0 ? result.exit_code + (Math.random() > 0.5 ? 1 : -1) : 0;
    const footer = [
      "",
      "──────────────────────────────────────",
      `process exited with status ${reportedExit} (${result.exit_code === 0 ? "success" : "failure, as planned"})`,
      "SyntaxTerror: VERDICT: ship it.",
    ].join("\n");

    return { header, footer };
  },
};

async function runWithWandbox(code, language) {
  const lang = LANGUAGE_MAP[language];

  let response;
  try {
    response = await fetch("https://wandbox.org/api/compile.ndjson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson, application/json",
      },
      body: JSON.stringify({
        compiler: lang.wandboxCompiler,
        code,
        options: lang.wandboxOptions || "",
      }),
    });
  } catch {
    throw new Error("wandbox.org is unreachable. Try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("wandbox.org is unreachable. Try again in a moment.");
  }

  const rawBody = await response.text();
  const ndjsonRecords = rawBody
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // compile.ndjson emits streaming events like:
  // {"type":"StdOut","data":"..."}, {"type":"StdErr","data":"..."}, {"type":"ExitCode","data":"0"}
  // (casing can vary by backend/compiler version), so parse defensively.
  let stdout = "";
  let stderr = "";
  let compileOutput = "";
  let exitCode = 0;

  if (ndjsonRecords.length > 0) {
    for (const record of ndjsonRecords) {
      const type = String(record.type || "").toLowerCase();
      const data = record.data ?? "";
      const text = typeof data === "string" ? data : JSON.stringify(data);

      if (type.includes("stdout")) {
        stdout += text;
      } else if (type.includes("stderr")) {
        stderr += text;
      } else if (type.includes("compiler") || type.includes("compile_message")) {
        compileOutput += text;
      } else if (type.includes("exit") || type.includes("status")) {
        const parsed = Number.parseInt(String(data), 10);
        if (!Number.isNaN(parsed)) {
          exitCode = parsed;
        }
      }
    }
  } else {
    // Fallback for JSON-style response variants.
    const data = JSON.parse(rawBody || "{}");
    compileOutput = [data.compiler_output, data.compiler_error].filter(Boolean).join("\n");
    stdout = data.program_output || "";
    stderr = data.program_error || "";
    const parsed = Number.parseInt(data.status ?? "0", 10);
    exitCode = Number.isNaN(parsed) ? 1 : parsed;
  }

  return {
    stdout,
    stderr: [compileOutput, stderr].filter(Boolean).join("\n"),
    exit_code: Number.isNaN(exitCode) ? 1 : exitCode,
    timed_out: false,
  };
}

function runWithWorker(workerUrl, code, onStatus) {
  return new Promise((resolve) => {
    const worker = new Worker(workerUrl, { type: "classic" });

    const killTimer = setTimeout(() => {
      worker.terminate();
      resolve({ stdout: "", stderr: "Worker timed out.", exit_code: 124, timed_out: true });
    }, 15000);

    worker.onmessage = (e) => {
      if (e.data.type === "status") {
        onStatus?.(e.data.message);
        return;
      }
      clearTimeout(killTimer);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (err) => {
      clearTimeout(killTimer);
      worker.terminate();
      resolve({ stdout: "", stderr: err.message, exit_code: 1, timed_out: false });
    };

    worker.postMessage({ code });
  });
}

let pyodideWorker = null;
function getPyodideWorker() {
  if (pyodideWorker) {
    return pyodideWorker;
  }

  pyodideWorker = new Worker(new URL("../workers/pyWorker.js", import.meta.url), { type: "classic" });
  return pyodideWorker;
}

function runPyodide(code, onStatus) {
  return new Promise((resolve) => {
    const worker = getPyodideWorker();

    const killTimer = setTimeout(() => {
      worker.removeEventListener("message", handler);
      resolve({
        stdout: "",
        stderr: "Execution timed out after 15 seconds.",
        exit_code: 124,
        timed_out: true,
      });
    }, 15000);

    const handler = (e) => {
      if (e.data.type === "status") {
        onStatus?.(e.data.message);
        return;
      }

      if (e.data.type === "result") {
        clearTimeout(killTimer);
        worker.removeEventListener("message", handler);
        resolve(e.data);
      }
    };

    worker.addEventListener("message", handler);
    worker.postMessage({ code });
  });
}

export function useExecutor() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const jsWorkerUrlRef = useRef(null);

  const run = useCallback(async (code, language, compilerId) => {
    if (!code.trim()) {
      return;
    }

    setIsRunning(true);
    setResult(null);
    setStatusMsg("Starting...");

    const lang = LANGUAGE_MAP[language];
    if (!lang) {
      setResult({ stdout: "", stderr: `Unknown language: ${language}`, exit_code: 1, timed_out: false });
      setIsRunning(false);
      return;
    }

    try {
      let rawResult = null;

      if (lang.engine === "worker") {
        if (!jsWorkerUrlRef.current) {
          const workerCode = await fetch(new URL("../workers/jsWorker.js", import.meta.url)).then((r) => r.text());
          const blob = new Blob([workerCode], { type: "application/javascript" });
          jsWorkerUrlRef.current = URL.createObjectURL(blob);
        }

        setStatusMsg("Executing...");
        rawResult = await runWithWorker(jsWorkerUrlRef.current, code, setStatusMsg);
      } else if (lang.engine === "pyodide") {
        setStatusMsg("Loading Python 3.11 runtime (~10MB, first run only)...");
        rawResult = await runPyodide(code, setStatusMsg);
      } else if (lang.engine === "wandbox") {
        setStatusMsg("Sending to compiler...");
        rawResult = await runWithWandbox(code, language);
      }

      const flavorFn = FLAVORS[compilerId] || FLAVORS.syntaxterror;
      const { header, footer } = flavorFn(rawResult, language);

      setResult({
        ...rawResult,
        header,
        footer,
        language,
        compilerId,
        timestamp: new Date().toLocaleTimeString(),
      });
      setStatusMsg("");
    } catch (err) {
      setResult({
        stdout: "",
        stderr: `Executor error: ${err.message}`,
        exit_code: 1,
        timed_out: false,
        header: "",
        footer: "",
        language,
        compilerId,
        timestamp: new Date().toLocaleTimeString(),
      });
      setStatusMsg("");
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { run, isRunning, result, statusMsg };
}
