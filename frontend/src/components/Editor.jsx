import { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

export const BAD_PYTHON_SNIPPET = `# // paste your code here. nopilot will handle the rest.

def recurse_forever(n):
    print("depth:", n)
    return recurse_forever(n + 1)


def load_data(path):
    f = open(path, "r")
    data = f.read()
    data_final = data.strip()
    data_final_v2 = data_final.lower()
    data2 = data_final_v2 + "::cached"
    return data2


result = load_data("secrets.txt")
print(result)
value = recurse_forever(0)
print("done", value)
# TODO: fix everything`;

export default function Editor({ code, setCode, phase, selectedLanguage }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !selectedLanguage) {
      return;
    }

    editorRef.current.setValue(selectedLanguage.defaultCode);
    setCode(selectedLanguage.defaultCode);
    const model = editorRef.current.getModel();
    if (model) {
      monacoRef.current.editor.setModelLanguage(model, selectedLanguage.monacoLang);
    }
  }, [selectedLanguage.id, selectedLanguage.defaultCode, selectedLanguage.monacoLang, setCode]);

  return (
    <div className="relative h-full w-full overflow-hidden border-r" style={{ borderColor: "var(--border)" }}>
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language={selectedLanguage.monacoLang}
        defaultValue={selectedLanguage.defaultCode}
        value={code}
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: { enabled: false },
          readOnly: phase === "chaos",
          fontFamily: "JetBrains Mono",
          fontSize: 13,
          lineHeight: 22,
          smoothScrolling: true,
          wordWrap: "on",
          overviewRulerLanes: 0,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
          monaco.editor.defineTheme("nopilot-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#111111",
            },
          });
          monaco.editor.setTheme("nopilot-dark");
          editor.updateOptions({ readOnly: phase === "chaos" });
        }}
      />

      {phase === "chaos" && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-[2px] animate-scanline"
          style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
        />
      )}
    </div>
  );
}
