import { useCallback, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://telosb.gokulp.online");

export function useStream() {
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const startStream = useCallback(async (code, compilerId) => {
    setOutput("");
    setError("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, compiler: compilerId }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let done = false;
      let doneFromMarker = false;
      const READ_TIMEOUT_MS = 25000;

      const readWithTimeout = async () => {
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error("Stream timed out waiting for completion marker"));
          }, READ_TIMEOUT_MS);

          reader
            .read()
            .then((result) => {
              clearTimeout(timer);
              resolve(result);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });
      };

      while (!done) {
        const { value, done: readerDone } = await readWithTimeout();
        done = readerDone;
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n");

        let splitIndex = buffer.indexOf("\n\n");
        while (splitIndex !== -1) {
          const eventChunk = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);

          const lines = eventChunk.split("\n");
          const dataLines = [];
          for (const line of lines) {
            if (!line.startsWith("data: ")) {
              continue;
            }
            dataLines.push(line.slice(6).replace(/\r$/, ""));
          }

          if (dataLines.length > 0) {
            const payload = dataLines.join("\n");
            if (payload.trim() === "[DONE]") {
              done = true;
              doneFromMarker = true;
              break;
            }

            setOutput((prev) => prev + payload);
          }

          if (doneFromMarker) {
            break;
          }

          splitIndex = buffer.indexOf("\n\n");
        }

        if (doneFromMarker) {
          break;
        }
      }

      await reader.cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown stream error");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { output, setOutput, isStreaming, error, startStream };
}
