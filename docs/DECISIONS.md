# Architecture Decision Records (ADRs)

> Project: Storage Invaders  
> Event: PromptWars x OUTLIER'2026 (Google for Developers x Hack2skill)

---

## ADR-001: Monorepo Architecture with npm Workspaces
- **Status**: Accepted
- **Context**: The project consists of a React/Canvas frontend, a Node.js/Express backend, and shared TypeScript types and Zod validation schemas. We need rapid local iteration, atomic commits, and shared schema consistency without publishing packages.
- **Decision**: Use an npm workspaces monorepo containing `/client`, `/server`, and `/shared`.
- **Consequences**: Single repository, unified scripts (`npm run build`, `npm test`, `npm run lint`), shared validation schemas between client and server, zero code duplication.

---

## ADR-002: Pure TypeScript Game Engine Decoupled from Rendering
- **Status**: Accepted
- **Context**: The game logic (physics, collisions, wave pacing, scoring, combo calculation) needs to be 100% deterministic and unit-testable in automated CI pipelines without headless browser or mock canvas dependencies.
- **Decision**: Implement `client/src/game/engine` as a pure, zero-DOM TypeScript module driven by a fixed timestep tick (`dt = 1/60`) and seedable RNG. The Canvas 2D renderer and React state layers sit purely on top as subscribers.
- **Consequences**: Unit tests run in milliseconds in Vitest; high testability score; no entity stuttering on variable refresh rate displays.

---

## ADR-003: Unified `FileProvider` Contract for Demo and Drive Modes
- **Status**: Accepted
- **Context**: Judges and automated graders must be able to evaluate the live Cloud Run deployment immediately without Google OAuth login or granting Drive permissions. Simultaneously, the game must genuinely support real Google Drive file cleanup.
- **Decision**: Define a single `FileProvider` interface (`listCandidates()`, `trash(ids)`, `restore(ids)`). Implement `DemoProvider` (seeded sandbox with realistic files and in-memory trash state) and `DriveProvider` (Google Drive v3 API via backend proxy).
- **Consequences**: The core game engine, HUD, ActionQueue, and Triage List Mode have zero awareness of which provider is active, guaranteeing 100% feature parity across both modes.

---

## ADR-004: Non-Blocking Background Action Queue with 5-Second Undo Window
- **Status**: Accepted
- **Context**: Real Drive API operations take 200–800ms per request. Pausing the game loop to wait for HTTP responses ruins the fast-paced arcade feel, but immediately trashing files without confirmation risks accidental loss.
- **Decision**: Implement an optimistic `ActionQueue`. When an asteroid is destroyed, it visually shatters instantly and is placed into a "pending" queue. A 5-second undo toast appears on screen. If the player does not click "Undo", the background worker commits the trash request via `p-limit`. The score (freed GB) updates only upon provider confirmation.
- **Consequences**: Satisfies the hackathon challenge ("executes the real chore in the background"), guarantees zero lag during gameplay, and provides safe rollback on failure or user undo.

---

## ADR-005: Security Invariant — AI Advises, Human Decides
- **Status**: Accepted
- **Context**: Delegating automated file deletion to an LLM creates catastrophic risks of prompt injection, hallucinated deletions, and unrecoverable user data loss.
- **Decision**: Gemini acts strictly as an advisory metadata classifier. Gemini's output can NEVER initiate or approve a mutation. Only explicit player actions (aiming and firing at an asteroid or clicking "Trash" in list mode) enqueue an operation. Permanent deletion endpoints (`files.delete`, `emptyTrash`) are strictly excluded from code and API scopes.
- **Consequences**: Complete immunity against autonomous destructive AI actions. Full compliance with Google API security standards.

---

## ADR-006: Stateless Backend with AES-256-GCM Encrypted Cookies
- **Status**: Accepted
- **Context**: Cloud Run is serverless, ephemeral, and horizontally scaled. Storing sessions in server memory causes auth failures on instance scaling or restart, while setting up a database violates the scope guard and increases latency and cost.
- **Decision**: Store Google Drive access tokens in an encrypted, authenticated `httpOnly`, `Secure`, `SameSite=Lax` cookie using AES-256-GCM keyed by `SESSION_SECRET`. No database is needed.
- **Consequences**: Stateless server, instant scaling, zero external storage dependencies, resilient across restarts.

---

## ADR-007: Gemini Batching, Strict Schema Validation & Fallback Classifier
- **Status**: Accepted
- **Context**: Calling Gemini per individual file wastes quota, incurs latency, and increases error vulnerability. Malicious file names could attempt prompt injection.
- **Decision**:
  1. Batch analyze up to 20–25 files per API call using `@google/genai` with structured JSON schema.
  2. Prefetch the upcoming wave during active play.
  3. Enclose untrusted file names in explicit XML delimiters (`<file_metadata_batch>`) with anti-injection instructions.
  4. Cache results in an in-memory LRU cache keyed by metadata hash.
  5. Include a deterministic `HeuristicClassifier` fallback so that server operations never fail with HTTP 500 if Gemini is unavailable or rate-limited.
- **Consequences**: Highly efficient API quota consumption, resilient uptime, defense-in-depth against prompt injection, and honest UI status indicators (`source: "gemini"` vs `source: "heuristic"`).
