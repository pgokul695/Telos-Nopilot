# Contributing to Nopilot

Thanks for contributing. Nopilot is a parody product with real runtime behavior, so contributions should keep both technical correctness and product tone intact.

## Workflow

1. Fork the repository.
2. Create a feature branch from main.
3. Make focused changes.
4. Open a pull request with clear scope and testing notes.

## Branch Naming

Use descriptive branch names:

- feat/persona-loading-copy
- fix/sse-done-marker
- docs/deployment-railway

## Pull Request Requirements

Include the following in each PR:

1. What changed.
2. Why it changed.
3. How it was tested.
4. Screenshots or short recordings for UI changes.
5. Any known caveats or follow-up tasks.

## Code Style Notes

- Keep frontend behavior explicit and readable.
- Avoid introducing hidden backend state.
- Preserve persona-specific behavior and tone boundaries.
- Keep setup and deployment docs synchronized with runtime behavior.
- Use small, focused commits.

## Testing Guidance

Before opening a PR, verify:

1. JavaScript executes in worker mode.
2. Python executes via Pyodide and reports expected first-load behavior.
3. C++ executes via Wandbox.
4. Roast mode streaming completes with [DONE].
5. UNPILOT generation stream finishes and insert flow works.
6. Desktop, tablet, and mobile layouts are usable.
7. Touch devices render hex background instead of particles.

## Documentation Updates

If you change any of the following, update docs in the same PR:

- API route names or request shapes.
- Environment variables.
- Runtime execution constraints.
- Persona behavior, color, cursor, or physics parameters.
- Deployment assumptions.

## Scope Boundaries

Please do not add enterprise features that conflict with project intent, such as account systems, persistent multi-user state, or productivity-first positioning.

## Reporting Issues

When filing issues, include:

1. Environment details (OS, browser, Node/Python versions).
2. Steps to reproduce.
3. Expected vs actual behavior.
4. Relevant console/network logs.