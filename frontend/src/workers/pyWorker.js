importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;
let loading = false;

async function ensurePyodide() {
  if (pyodide) {
    return pyodide;
  }

  if (loading) {
    while (loading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return pyodide;
  }

  loading = true;
  self.postMessage({ type: "status", message: "Loading Python runtime..." });
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
  });
  loading = false;
  self.postMessage({ type: "status", message: "Python ready." });
  return pyodide;
}

self.onmessage = async function (e) {
  const { code } = e.data;

  try {
    const py = await ensurePyodide();

    py.runPython(`
import sys, io, traceback
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    let exit_code = 0;
    try {
      py.runPython(code);
    } catch (err) {
      py.runPython(`
import traceback, sys
traceback.print_exc(file=sys.stderr)
`);
      exit_code = 1;
    }

    const stdout = py.runPython("sys.stdout.getvalue()") || "";
    const stderr = py.runPython("sys.stderr.getvalue()") || "";

    self.postMessage({
      type: "result",
      stdout,
      stderr,
      exit_code,
      timed_out: false,
    });
  } catch (err) {
    self.postMessage({
      type: "result",
      stdout: "",
      stderr: `Runtime error: ${err.message}`,
      exit_code: 1,
      timed_out: false,
    });
  }
};
