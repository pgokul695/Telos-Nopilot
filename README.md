# Nopilot 🚫🤖
### Not your copilot. Not anyone's copilot.

Nopilot is the AI coding assistant that confidently does nothing useful.
Choose your compiler, submit your code, and receive the feedback you deserve.

**Available Compilers:**
- ⚠ **SegFault.ai** — The premier tool for writing morally reprehensible C++ code
- ◈ **GCC** (Gaslighting Code Compiler) — Compiles your insecurities, not your binaries
- ☠ **SyntaxTerror** — Doesn't find bugs. Creates them.

**Setup:**
Backend:
  cd backend
  pip install fastapi uvicorn google-generativeai python-dotenv
  cp ../.env.example .env   # add your GOOGLE_API_KEY
  python main.py            # runs on http://localhost:3000

Frontend:
  cd frontend
  npm install
  npm run dev               # runs on http://localhost:3001

Built for the April 7 hackathon. Ships nothing. Compiles everything.
