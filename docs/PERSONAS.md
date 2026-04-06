# Nopilot Persona Reference

This document defines the three compiler personas used across roast mode and UNPILOT code generation.

## Persona Matrix

| Persona ID | Display Name | Core Personality | Accent Color | Cursor Style |
|---|---|---|---|---|
| segfault | SegFault.ai | Crusty low-level programmer offended by your memory choices | `#00ff88` | Targeting crosshair |
| gcc | GCC (Gaslighting Code Compiler) | Calm passive-aggressive therapist-engineer | `#888888` | Dot with outer ring |
| syntaxterror | SyntaxTerror | Hyperactive chaos gremlin | `#ff1a75` | Dual-ring lag cursor |

## Roast Mode Prompt Behavior

### SegFault.ai

- Opens with fake fatal compiler line.
- Calls out memory leaks, undefined behavior, and pointer crimes.
- Mentions the heap as if it were sentient.
- Ends with Segmentation fault style signature and verdict.

### GCC

- Opens with calm observation.
- Highlights issues in a quietly devastating tone.
- Includes rhetorical judgment phrasing.
- Ends with: We believe in you. We just do not believe in this.

### SyntaxTerror

- Opens with bug installation report format.
- Lists exactly three absurd bugs as if they were features.
- Adds side effects section.
- Ends with: VERDICT: Ship it.

## UNPILOT Generation Behavior

All personas generate runnable code under runtime constraints. Persona tone appears in comments and naming, not in broken syntax.

### Shared Generation Constraints

- Output raw code only.
- Honor selected language comment syntax.
- Keep code executable in target environment.
- Include persona-flavored opening and closing comment lines.

### Persona Generation Style

- SegFault.ai: aggressively low-level style and memory-themed insults.
- GCC: over-engineered but technically correct style with clinical commentary.
- SyntaxTerror: chaotic-looking constructs that still run.

## Visual System

### Color Palettes

- SegFault palette: green variants centered on `#00ff88`.
- GCC palette: neutral grey variants centered on `#888888`.
- SyntaxTerror palette: pink variants centered on `#ff1a75`.

### Cursor Definitions

- SegFault: SVG reticle with crosshair and center ring.
- GCC: small filled dot plus thin outer ring.
- SyntaxTerror: inner dot tracks quickly; larger ring follows with lag.

## Particle and Physics Values

Pointer devices render dash particles over editor canvas. Particle count scales by device class.

- Desktop pointer: 280 particles.
- Tablet pointer: 160 particles.
- Touch/coarse pointer: particles disabled.

Persona physics profile:

| Persona | fleeStrength | returnSpeed | damping |
|---|---:|---:|---:|
| SegFault.ai | 5.5 | 0.032 | 0.84 |
| GCC | 3.2 | 0.02 | 0.92 |
| SyntaxTerror | 7.8 | 0.018 | 0.80 |

These values shape how strongly particles flee the cursor and how quickly they settle.

## Touch Device Hex Grid

- Triggered by coarse pointer media conditions.
- Uses SVG pattern tiles with flat-top hex polygons.
- Persona switch updates hex stroke color with smooth transition.
- No per-frame animation loop required for base render.

## UX Text Personalization

- Placeholder text in UNPILOT input is persona-specific.
- Loading status text in UNPILOT stream is persona-specific.
- Status bar includes persona-flavored state summaries.

## Design Guardrails

- Persona hostility is theatrical, not abusive toward protected groups.
- Generated code must remain syntactically valid for selected runtime.
- Personality should not override runtime constraints or break execution.