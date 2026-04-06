# Nopilot Backend API

## Overview

Backend is a stateless FastAPI streaming proxy. It accepts generation requests, chooses persona prompts, calls the model provider, and streams results to the frontend via SSE.

## Base URL

- Local: http://localhost:8000
- Production: set by deployment platform

## Content Type

- Request: application/json
- Response: text/event-stream

## Endpoints

## 1) Roast Stream

- Method: POST
- Path: /generate
- Purpose: stream roast-style persona output for current editor code

Request body:

```json
{
  "code": "<editor source code>",
  "compiler_id": "segfault | gcc | syntaxterror"
}
```

Representative SSE response:

```text
data: segfault.ai: fatal error: ...

data: Your heap has filed a complaint.

data: [DONE]
```

Notes:

- Chunks are emitted as plain text lines.
- Frontend stops reading on [DONE].

## 2) UNPILOT Code Generation Stream

- Method: POST
- Path: /generate (or /generate-code)
- Purpose: stream persona-flavored runnable code generation

Request body:

```json
{
  "user_prompt": "Build a fibonacci function",
  "code_context": "<current editor text>",
  "compiler_id": "segfault | gcc | syntaxterror",
  "language": "javascript | python | cpp"
}
```

Representative SSE response:

```text
data: {"text":"// SyntaxTerror Code Generation - ...\n"}

data: {"text":"function fibonacci(n) { ... }\n"}

data: [DONE]
```

Notes:

- Payload chunks are usually JSON objects containing text field.
- Frontend appends chunk text in order to render streaming assistant output.

## Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| code | string | Roast mode | Source code to critique |
| user_prompt | string | UNPILOT mode | User generation prompt |
| code_context | string | No | Existing editor code for context |
| compiler_id | string | Yes | Persona selector |
| language | string | UNPILOT mode | Target runtime language |

## SSE Contract

- Transport protocol: Server-Sent Events.
- Data lines use data: prefix.
- Stream termination marker is exact token [DONE].
- On stream failure, backend may emit a textual stream error marker as data before completion.

## Error Behavior

Potential failure surfaces:

- 4xx: malformed payload or invalid request shape.
- 5xx: backend/provider failures.
- Stream-time error: data chunk containing stream error text.

| HTTP Code | Meaning | Typical Cause |
|---:|---|---|
| 200 | Stream opened successfully | Request accepted; data events follow |
| 400 | Bad request | Missing/invalid required payload fields |
| 422 | Validation error | Body does not match expected schema |
| 500 | Internal server error | Provider/API failure or backend exception |
| 503 | Service unavailable | Upstream model provider temporarily unavailable |

Frontend handling recommendation:

1. Show transport errors in panel.
2. Preserve partial stream text.
3. Always unlock UI when [DONE] is seen or request fails.

## CORS

Backend must allow frontend origins for local and deployed hosts.

Typical middleware pattern:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "https://your-frontend.example"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
```

## Non-Goals

- No authentication.
- No persistence layer.
- No code execution service.
- No user/session storage.