self.onmessage = function (e) {
  const { code } = e.data;
  const output = [];
  const errors = [];
  let timedOut = false;

  const killTimer = setTimeout(() => {
    timedOut = true;
    self.postMessage({
      stdout: output.join("\n"),
      stderr: "[Execution timed out after 10 seconds — infinite loop?]",
      exit_code: 124,
      timed_out: true,
    });
    self.close();
  }, 10000);

  const fakeConsole = {
    log: (...args) => output.push(args.map(stringify).join(" ")),
    error: (...args) => errors.push(args.map(stringify).join(" ")),
    warn: (...args) => output.push("Warning: " + args.map(stringify).join(" ")),
    info: (...args) => output.push(args.map(stringify).join(" ")),
    table: (data) => output.push(JSON.stringify(data, null, 2)),
    dir: (data) => output.push(JSON.stringify(data, null, 2)),
  };

  function stringify(val) {
    if (typeof val === "object" && val !== null) {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  try {
    const fn = new Function("console", "alert", "confirm", "prompt", "fetch", `"use strict";\n${code}`);
    fn(
      fakeConsole,
      (msg) => output.push(`[alert] ${msg}`),
      (msg) => {
        output.push(`[confirm] ${msg}`);
        return false;
      },
      (msg) => {
        output.push(`[prompt] ${msg}`);
        return "";
      },
      () => Promise.reject(new Error("fetch is disabled in sandbox"))
    );

    clearTimeout(killTimer);
    self.postMessage({
      stdout: output.join("\n"),
      stderr: errors.join("\n"),
      exit_code: errors.length > 0 ? 1 : 0,
      timed_out: false,
    });
  } catch (err) {
    clearTimeout(killTimer);
    self.postMessage({
      stdout: output.join("\n"),
      stderr: err.toString() + (err.stack ? `\n${err.stack}` : ""),
      exit_code: 1,
      timed_out: timedOut,
    });
  }
};
