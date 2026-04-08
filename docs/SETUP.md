# Nopilot Setup

## Prerequisites

- Node.js 18+
- Python 3.10+
- Google AI Studio API key from https://aistudio.google.com/
- Internet connection (required for Wandbox C++ and Gemini API calls)

## Repository Clone

```bash
git clone <repo-url>
cd nopilot
```

## Frontend Local Development

Run from the frontend project root:

```bash
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:3001
```

## Backend Local Development

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi uvicorn google-generativeai python-dotenv
```

Create backend environment file:

```env
GOOGLE_API_KEY=your_google_ai_studio_key
```

Start backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at:

```text
http://localhost:8000
```

## Environment Variables

| Variable | Location | Required | Description |
|---|---|---|---|
| GOOGLE_API_KEY | backend/.env | Yes | Google AI Studio API key used by FastAPI backend |
| VITE_API_URL | frontend/.env | No | Backend base URL, defaults to http://localhost:8000 |

## Frontend Build

```bash
npm run build
```

Build output:

```text
dist/
```

Serve dist with any static hosting platform.

## Local Run Checklist

1. Backend is running on port 8000.
2. Frontend is running on port 3001.
3. Frontend points to backend URL through VITE_API_URL when needed.
4. Google AI Studio API key is present in backend environment.

## Common Local Issues

- Blank AI output:
  - Verify backend is running and key is valid.
- C++ compile failures:
  - Verify internet access and Wandbox availability.
- Slow first Python run:
  - Expected while Pyodide runtime downloads once.