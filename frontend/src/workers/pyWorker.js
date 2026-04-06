importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;
let loading = false;

const PYODIDE_PACKAGES = ["numpy", "pandas", "scipy", "matplotlib", "sympy", "pillow", "cryptography"];
const MICROPIP_PACKAGES = ["requests"];

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

function extractRequestedModules(code) {
  const requested = new Set();

  const importMatches = [...code.matchAll(/^\s*import\s+([^\n#]+)/gm)];
  for (const match of importMatches) {
    const raw = match[1] || "";
    for (const part of raw.split(",")) {
      const moduleExpr = part.trim();
      if (!moduleExpr) {
        continue;
      }
      const moduleName = moduleExpr.split(/\s+as\s+/i)[0].trim().split(".")[0];
      if (moduleName) {
        requested.add(moduleName);
      }
    }
  }

  const fromMatches = [...code.matchAll(/^\s*from\s+([\w.]+)\s+import\s+/gm)];
  for (const match of fromMatches) {
    const moduleName = (match[1] || "").trim().split(".")[0];
    if (moduleName) {
      requested.add(moduleName);
    }
  }

  return [...requested];
}

async function loadRequiredPackages(py, code) {
  const requestedModules = extractRequestedModules(code);

  const toLoad = requestedModules.filter((name) => PYODIDE_PACKAGES.includes(name));
  if (toLoad.length > 0) {
    self.postMessage({ type: "status", message: `Loading packages: ${toLoad.join(", ")}...` });
    await py.loadPackage(toLoad);
  }

  const toInstall = requestedModules.filter((name) => MICROPIP_PACKAGES.includes(name));
  if (toInstall.length > 0) {
    self.postMessage({ type: "status", message: `Installing packages: ${toInstall.join(", ")}...` });
    await py.loadPackage("micropip");
    const micropip = py.pyimport("micropip");
    try {
      for (const pkg of toInstall) {
        await micropip.install(pkg);
      }
    } finally {
      micropip.destroy?.();
    }
  }
}

self.onmessage = async function (e) {
  const { code, stdin = "" } = e.data;

  try {
    const py = await ensurePyodide();

    let stdout = "";
    let stderr = "";
    py.setStdout({
      batched: (text) => {
        stdout += `${text}\n`;
      },
    });
    py.setStderr({
      batched: (text) => {
        stderr += `${text}\n`;
      },
    });

    let exit_code = 0;
    try {
      await loadRequiredPackages(py, code);
      const stdinLiteral = JSON.stringify(stdin);
      await py.runPythonAsync(`import sys, io\nsys.stdin = io.StringIO(${stdinLiteral})`);
      await py.runPythonAsync(code);
    } catch (err) {
      exit_code = 1;
      if (err?.message) {
        stderr += `${err.message}\n`;
      }
    }

    self.postMessage({
      type: "result",
      stdout: stdout.replace(/\n+$/g, ""),
      stderr: stderr.replace(/\n+$/g, ""),
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
