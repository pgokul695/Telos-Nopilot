# Nopilot Deployment

## Overview

Nopilot is deployed as two services:

- Frontend: static files from dist.
- Backend: FastAPI service for streaming AI responses.

Set frontend environment variable VITE_API_URL to the deployed backend URL.

## Frontend Hosting

All options below serve dist output from frontend build.

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set VITE_API_URL in the Vercel project environment settings.

### Netlify

- Build command: npm run build
- Publish directory: dist
- Add VITE_API_URL in Site Settings -> Environment Variables

### Self-hosted with Nginx

```nginx
server {
  listen 80;
  root /var/www/nopilot/dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Backend Hosting

### Railway (recommended)

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```

Set ANTHROPIC_API_KEY in Railway environment variables.

### Render

- Create new Web Service and set root directory to backend/
- Build command: pip install -r requirements.txt
- Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
- Add ANTHROPIC_API_KEY environment variable

### Fly.io

```bash
cd backend
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

### Self-hosted with systemd

```ini
[Unit]
Description=Nopilot Backend

[Service]
WorkingDirectory=/opt/nopilot/backend
ExecStart=/opt/nopilot/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
EnvironmentFile=/opt/nopilot/backend/.env
Restart=always

[Install]
WantedBy=multi-user.target
```

## CORS Configuration

Backend must allow requests from deployed frontend origin.

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "https://your-frontend.vercel.app",
    ],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
```

## Production Checklist

1. Frontend built and deployed from dist.
2. Backend is reachable over HTTPS.
3. VITE_API_URL points to backend base URL.
4. ANTHROPIC_API_KEY is set only on backend.
5. Backend CORS includes frontend production origin.
6. Health check a full stream from frontend UI before release.