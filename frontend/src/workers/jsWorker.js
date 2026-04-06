self.onmessage = function (e) {
  const { code, stdin = "" } = e.data;
  const output = [];
  const errors = [];
  let timedOut = false;

  const stdinLines = String(stdin).split("\n");
  let stdinCursor = 0;

  // Node.js modules (require("readline")) are unavailable in this sandbox.
  // We only emulate line-based stdin access for prompt()/readline()/process.stdin helpers.
  function readStdinLine() {
    if (stdinCursor < stdinLines.length) {
      const line = stdinLines[stdinCursor];
      stdinCursor += 1;
      output.push(line);
      return line;
    }
    // Competitive programming style behavior: exhausted stdin returns empty string.
    return "";
  }

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
    const fakeProcess = {
      stdin: {
        readline: () => readStdinLine(),
        read: () => {
          if (stdinCursor >= stdinLines.length) {
            return "";
          }
          const remaining = stdinLines.slice(stdinCursor).join("\n");
          stdinCursor = stdinLines.length;
          if (remaining) {
            output.push(remaining);
          }
          return remaining;
        },
      },
    };

    const fn = new Function(
      "console",
      "alert",
      "confirm",
      "prompt",
      "readline",
      "process",
      "fetch",
      `"use strict";\n${code}`
    );
    fn(
      fakeConsole,
      (msg) => output.push(`[alert] ${msg}`),
      (msg) => {
        output.push(`[confirm] ${msg}`);
        return false;
      },
      (msg) => {
        if (msg) {
          output.push(String(msg));
        }
        return readStdinLine();
      },
      readStdinLine,
      fakeProcess,
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
