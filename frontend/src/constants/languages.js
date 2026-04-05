export const LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript",
    monacoLang: "javascript",
    extension: ".js",
    engine: "worker",
    wandboxCompiler: null,
    defaultCode: `// JavaScript — Nopilot Edition
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log("Fibonacci sequence:")
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`)
}`,
  },
  {
    id: "python",
    label: "Python",
    monacoLang: "python",
    extension: ".py",
    engine: "pyodide",
    wandboxCompiler: null,
    defaultCode: `# Python — Nopilot Edition
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`,
  },
  {
    id: "cpp",
    label: "C++",
    monacoLang: "cpp",
    extension: ".cpp",
    engine: "wandbox",
    wandboxCompiler: "gcc-13.2.0",
    wandboxOptions: "-O2 -Wall -std=c++17",
    defaultCode: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Fibonacci sequence:" << endl;
    for (int i = 0; i < 10; i++) {
        cout << "F(" << i << ") = " << fibonacci(i) << endl;
    }
    return 0;
}`,
  },
];

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));
export const DEFAULT_LANGUAGE = LANGUAGES[0];
