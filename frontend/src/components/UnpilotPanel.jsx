import { useEffect, useMemo, useRef, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://telosb.gokulp.online");

function mapFenceLang(lang, fallback) {
  const value = String(lang || "").toLowerCase();
  if (value === "js" || value === "javascript") {
    return "javascript";
  }
  if (value === "py" || value === "python") {
    return "python";
  }
  if (value === "c++" || value === "cpp" || value === "cc") {
    return "cpp";
  }
  return fallback;
}

function extractCodeBlocks(content, fallbackLanguage) {
  const codeBlocks = [];
  const fenced = /```([\w+#-]*)\n([\s\S]*?)```/g;
  let match = fenced.exec(content);

  while (match) {
    codeBlocks.push({
      language: mapFenceLang(match[1], fallbackLanguage),
      code: match[2] || "",
    });
    match = fenced.exec(content);
  }

  if (codeBlocks.length === 0 && content) {
    codeBlocks.push({ language: fallbackLanguage, code: content });
  }

  return codeBlocks;
}

const PLACEHOLDERS = {
  segfault: "Describe your next heap crime...",
  gcc: "What are you trying to accomplish. We'll wait.",
  syntaxterror: "WHAT DO YOU WANT ME TO BREAK",
};

const LOADING_MESSAGES = {
  segfault: "Compiling your mistake...",
  gcc: "Processing. We have concerns.",
  syntaxterror: "Installing features...",
};

export default function UnpilotPanel({ selectedCompiler, selectedLanguage, codeContext, onInsertCode }) {
  const { isMobile } = useBreakpoint();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [streamingId, setStreamingId] = useState(null);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[selectedCompiler.id]);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const inputBarRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[selectedCompiler.id] || "Describe what code you want...");
  }, [selectedCompiler.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamError]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 96);
    textareaRef.current.style.height = `${Math.max(nextHeight, 40)}px`;
  }, [input]);

  useEffect(() => {
    if (!isMobile || typeof window === "undefined" || !window.visualViewport || !inputBarRef.current) {
      return;
    }

    const viewport = window.visualViewport;
    const updateInset = () => {
      if (!inputBarRef.current) {
        return;
      }
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      inputBarRef.current.style.transform = keyboardHeight > 50 ? `translateY(-${keyboardHeight}px)` : "translateY(0)";
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);
    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
      if (inputBarRef.current) {
        inputBarRef.current.style.transform = "translateY(0)";
      }
    };
  }, [isMobile]);

  const loadingMessage = useMemo(() => LOADING_MESSAGES[selectedCompiler.id] || "Generating...", [selectedCompiler.id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) {
      return;
    }

    const userId = `${Date.now()}-u`;
    const assistantId = `${Date.now()}-a`;
    setStreamError("");
    setIsStreaming(true);
    setStreamingId(assistantId);
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text, done: true },
      { id: assistantId, role: "assistant", content: "", done: false },
    ]);
    setInput("");

    try {
      const response = await fetch(`${API_BASE}/api/unpilot-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: text,
          code_context: codeContext,
          compiler_id: selectedCompiler.id,
          language: selectedLanguage.id,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to start generation stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n");

        let splitIndex = buffer.indexOf("\n\n");
        while (splitIndex !== -1) {
          const eventChunk = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);

          const dataLines = eventChunk
            .split("\n")
            .filter((line) => line.startsWith("data: "))
            .map((line) => line.slice(6).replace(/\r$/, ""));

          if (dataLines.length > 0) {
            const payload = dataLines.join("\n");
            if (payload.trim() === "[DONE]") {
              done = true;
              break;
            }

            let chunkText = payload;
            try {
              const parsed = JSON.parse(payload);
              if (parsed && typeof parsed.text === "string") {
                chunkText = parsed.text;
              }
            } catch {
              chunkText = payload;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: msg.content + chunkText,
                    }
                  : msg
              )
            );
          }

          splitIndex = buffer.indexOf("\n\n");
        }
      }

      await reader.cancel();
      setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, done: true } : msg)));
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : "Unknown stream error");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: msg.content || "[stream error] Failed to generate code",
                done: true,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCodeTouchStart = (codeContent) => {
    if (!isMobile) {
      return;
    }

    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(async () => {
      longPressTriggeredRef.current = true;
      try {
        await navigator.clipboard.writeText(codeContent);
      } catch {
        // Ignore clipboard errors in unsupported environments.
      }
    }, 600);
  };

  const handleCodeTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCodeTap = (codeContent) => {
    if (!isMobile || longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onInsertCode(codeContent);
  };

  return (
    <div className="unpilot-panel" style={{ background: "#0a0a0a" }}>
      <div
        ref={listRef}
        className="unpilot-messages"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div className="rounded border px-3 py-2 text-xs" style={{ borderColor: "#1e1e1e", color: "#555" }}>
            UNPILOT is ready. Ask for runnable code. It will judge you in comments.
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const codeBlocks = !isUser && msg.done ? extractCodeBlocks(msg.content, selectedLanguage.monacoLang) : [];

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "92%",
                width: "100%",
              }}
            >
              <div
                className="rounded border px-3 py-2 text-xs"
                style={{
                  borderColor: isUser ? "color-mix(in srgb, var(--accent) 35%, #1e1e1e)" : "#1e1e1e",
                  background: isUser ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.4)",
                  color: isUser ? "#999" : "#e0e0e0",
                }}
              >
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
                  <code>{msg.content || (msg.id === streamingId ? loadingMessage : "")}</code>
                </pre>
              </div>

              {!isUser && msg.done &&
                codeBlocks.map((block, index) => (
                  <div
                    key={`${msg.id}-code-${index}`}
                    className="mt-2 overflow-hidden rounded border"
                    style={{ borderColor: "#1e1e1e" }}
                    onClick={() => handleCodeTap(block.code)}
                    onTouchStart={() => handleCodeTouchStart(block.code)}
                    onTouchEnd={handleCodeTouchEnd}
                    onTouchCancel={handleCodeTouchEnd}
                  >
                    <pre
                      className="max-h-[260px] overflow-auto p-3 text-[12px]"
                      style={{
                        whiteSpace: "pre",
                        margin: 0,
                        fontFamily: "JetBrains Mono, monospace",
                        background: "#0b0b0b",
                        color: "#e8e8e8",
                      }}
                    >
                      <code>{block.code}</code>
                    </pre>
                    <div className="flex justify-end border-t px-2 py-2" style={{ borderColor: "#1e1e1e" }}>
                      <button
                        type="button"
                        onClick={() => onInsertCode(block.code)}
                        className="rounded px-2 py-1 text-[10px] tracking-[0.06em]"
                        style={{
                          border: "1px solid var(--accent)",
                          color: "#000",
                          background: "var(--accent)",
                        }}
                      >
                        INSERT INTO EDITOR
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}

        {streamError && (
          <div className="text-xs" style={{ color: "#ff6b6b" }}>
            {streamError}
          </div>
        )}
      </div>

      <div
        ref={inputBarRef}
        className="unpilot-input-bar"
        style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={placeholder}
            rows={1}
            className="max-h-24 min-h-10 flex-1 resize-none rounded border px-2 py-2 outline-none"
            style={{
              borderColor: "#2a2a2a",
              background: "#0a0a0a",
              color: "#e8e8e8",
              fontSize: isMobile ? 16 : 12,
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="h-10 rounded px-3 text-xs"
            style={{
              background: "var(--accent)",
              color: "#000",
              opacity: isStreaming || !input.trim() ? 0.45 : 1,
              border: "1px solid var(--accent)",
            }}
          >
            ▶
          </button>
        </div>
        {isStreaming && (
          <div className="mt-2 text-[11px]" style={{ color: "var(--accent)" }}>
            {loadingMessage}
          </div>
        )}
      </div>
    </div>
  );
}
