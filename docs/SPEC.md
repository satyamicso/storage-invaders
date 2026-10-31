# SPEC.md: Storage Invaders

> **Hackathon**: PromptWars x OUTLIER'2026 (Google for Developers x Hack2skill)  
> **Role**: Lead Engineer Architecture & Product Specification  
> **Repository**: `storage-invaders`  

---

## 1. Challenge & Problem Statement Alignment

### 1.1 Verbatim Challenge
> *"We all procrastinate on painful digital chores - cleaning out 5,000 unread emails, sorting messy folders, reviewing expenses, or fixing lint errors. Build an experience where playing a fast-paced game or interactive story actually executes the real-world chore in the background."*

### 1.2 Our Answer: "Storage Invaders"
- **The Chore**: Google Drive accumulates gigabytes of forgotten, duplicate, oversized, and stale files (installers, duplicate downloads, old screen recordings, raw exports) that users dread sorting through manually.
- **The Game**: An arcade space shooter. Each incoming asteroid represents a real (or sandboxed) file. The asteroid's visual scale maps logarithmically to the file's size in bytes. The player moves a defense ship and fires projectiles at junk files.
- **The Real Execution in the Background**: Destroying an asteroid does not just play an explosion animation—it enqueues an asynchronous, non-blocking background chore that moves the actual file to Google Drive trash.
- **Human-in-the-Loop & Safety**: Not shooting a file leaves it untouched. Shooting a "keep" file pauses the game with an explicit confirmation dialog ("Are you sure? Gemini flagged this as important"). The player has a 5-second undo toast for each action, and an in-session "Trash Bay" with a full restore capability.
- **Unified Game & Chore Metric**: The player's score is measured directly in confirmed Megabytes/Gigabytes freed from storage. Score increases *only* when the backend provider confirms the file has been moved to trash.

---

## 2. Core Game Design & Mechanics

### 2.1 File Presentation & Entity Mapping
- **Waves**: 20 files per wave, ordered primarily by largest files and least recently viewed/modified.
- **Asteroid Size**: $\text{Radius} \propto \log_{10}(\text{sizeBytes})$ bounded between minimum and maximum canvas radius limits.
- **Visual Encoding (Never Color Alone - WCAG Compliant)**:
  - **Junk**: Red hue + prominent **`X`** pattern overlay + jagged asteroid shape.
  - **Maybe / Unsure**: Amber hue + **`?`** marker overlay + rounded polygonal shape.
  - **Keep**: Gold/Emerald hue + **Shield icon `[🛡]`** overlay + smooth crystalline shape.
- **Asteroid Metadata Badges**: Display file name (truncated with ellipsis), formatted size (e.g., `450 MB`), and verdict icon.
- **Tooltip / Inspect**: Hovering or focusing an asteroid displays "Why did Gemini flag this?" with category and reasoning (up to 80 chars).

### 2.2 Shooting, Combos & Confirmation
- **Immediate Trash**: Asteroids classified as `junk` or `maybe` enter an optimistic pending-trash state upon impact and trigger procedural particle explosions and sound.
- **Guarded Keep**: Hitting an asteroid classified as `keep` pauses the game loop immediately and displays a modal dialog:
  - Header: *"Hold your fire! Keep File Detected"*
  - Details: File name, size, and Gemini's rationale (e.g., *"Looks like an official tax document or active contract"*).
  - Actions: **Cancel / Keep Safe** (default focus) or **Trash Anyway**.
- **Combo Multiplier**: Consecutive successful hits on `junk` files without shooting a `keep` file build a combo multiplier ($1\times, 2\times, 3\times, \dots$). Combo is strictly cosmetic (points multiplier for arcade flair) and never alters trashing behavior.
- **Procedural Graphics & Audio**:
  - 100% procedural HTML5 Canvas 2D rendering (no external copyrighted sprites or assets).
  - Web Audio API synthesized sound effects: laser fire, impact explosions, shield deflect, combo chime, warning sirens, and undo sound.
  - Global sound mute toggle with default state honoring browser autoplay policies.

### 2.3 Non-blocking Background Action Queue & Trash Bay
- **Optimistic Immediate Feedback**: Asteroid shatters on screen without waiting for HTTP network round-trips.
- **5-Second Undo Grace Period**: Trashed files appear immediately in a floating "Undo Toast" and in the dockable "Trash Bay" tray.
- **Provider Dispatch**: Actions are dispatched to the provider with concurrency throttling (using `p-limit`).
- **Confirmed Byte Scoring**: If the trash operation succeeds, the file status switches to `confirmed` and the GB Freed tally increases. If the operation fails, an error toast is displayed and the asteroid status rolls back.
- **Trash Bay & Session Restore**: The Trash Bay lists all files trashed during the session, allowing individual restoration or a global "Restore All" action.
- **End of Wave / Game Summary**:
  - Before vs. After storage visualization bar.
  - Total GB freed, total files trashed, total files kept safe.
  - "Restore All Trashed Files" safety escape hatch.

---

## 3. Dual-Mode Architecture & The `FileProvider` Contract

The game engine and UI are completely decoupled from storage backends through a unified TypeScript interface:

```typescript
export interface FileProvider {
  readonly mode: 'demo' | 'drive';
  listCandidates(limit?: number): Promise<FileMeta[]>;
  trash(ids: string[]): Promise<ActionResult[]>;
  restore(ids: string[]): Promise<ActionResult[]>;
}
```

### 3.1 Demo Mode (Default, No Login Required)
- **Zero-Friction Access**: Cloud Run deployment and local instances boot directly into Demo Mode without requiring any Google account sign-in.
- **Seeded Realistic Sandbox**: A pool of ~60 realistic mock files covering:
  - Obvious Junk: Duplicate downloads (`project_v2 (1).zip`, `setup_installer_x64.exe`, `Screen Recording 2022-04-12.mov`, `node_modules_backup.tar.gz`).
  - Ambiguous (`maybe`): Old presentation drafts (`Pitch_Deck_Draft_2021.pptx`), uncompressed photos (`IMG_9821.RAW`).
  - Critical Keep: `Tax_Return_2025_Final.pdf`, `Passport_Scan_JP.pdf`, `Executive_Employment_Agreement.pdf`.
- **Hybrid AI & Heuristic Classifier**: Calls the live Gemini endpoint for triage; falls back transparently to a deterministic rule-based `HeuristicClassifier` if Gemini is unavailable, offline, or rate-limited.
- **Simulated Latency & In-Memory Trash State**: Simulates non-blocking background queue behavior and undo/restore in memory.

### 3.2 Drive Mode ("Connect your Google Drive")
- **Real Google Drive API v3**: Authenticated via Google OAuth 2.0.
- **File Retrieval**: Queries the user's non-folder, non-Google-native files, sorted by `quotaBytesUsed desc`, filtered with strict `fields` projection.
- **Non-Destructive Trashing**: Uses `files.update` setting `trashed: true`. Never uses permanent deletion (`files.delete` or `emptyTrash`).

---

## 4. System Architecture & Tech Stack

```
storage-invaders/
├── client/                     # Vite + React 18 + TypeScript
│   ├── src/
│   │   ├── game/
│   │   │   ├── engine/         # Pure TS game engine (deterministic, tick-based, no DOM)
│   │   │   ├── renderer/       # Procedural 2D Canvas renderer
│   │   │   └── audio/          # Web Audio API sound synthesizer
│   │   ├── providers/          # FileProvider implementations (DemoProvider, DriveProvider)
│   │   ├── queue/              # Non-blocking ActionQueue with 5s undo & rollback
│   │   ├── components/         # HUD, TrashBay, TriageListMode, KeepDialog, StorageBar
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config.ts           # Validated env vars & secrets
│   │   ├── routes/
│   │   │   ├── analyze.ts      # Gemini batch triage with schema validation & LRU cache
│   │   │   ├── auth.ts         # OAuth 2.0 flow & AES-256-GCM encrypted cookies
│   │   │   ├── drive.ts        # Drive v3 candidates, trash, restore
│   │   │   └── healthz.ts      # Liveness probe
│   │   ├── services/
│   │   │   ├── gemini.ts       # @google/genai structured outputs + injection firewall
│   │   │   ├── heuristic.ts    # Fallback classifier & prompt injection protection
│   │   │   ├── drive.ts        # Drive client with p-limit batching
│   │   │   └── crypto.ts       # AES-256-GCM session cookie encryption
│   │   └── index.ts            # Express app, helmet, rate limiting, compression, SIGTERM
│   ├── package.json
│   └── tsconfig.json
├── shared/                     # Shared Zod schemas & TypeScript types
│   ├── src/
│   │   ├── schemas.ts          # FileMeta, Verdict, Analysis, ActionResult, API contracts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── SPEC.md                 # This architecture & design specification
│   └── DECISIONS.md            # Architecture Decision Records (ADRs)
├── Dockerfile                  # Multi-stage production container
└── package.json                # Root package with npm workspaces
```

### 4.1 Pure Game Engine Architecture
- **Location**: `client/src/game/engine/`.
- **Pure Functional Logic**: Decoupled completely from React components, DOM elements, and browser events.
- **Fixed Timestep Loop**: Deterministic $60\,\text{Hz}$ physics tick (`dt = 1/60`) for predictable collision detection and movement regardless of display refresh rate.
- **Object Pooling**: Pre-allocated pools for bullets, particles, and asteroid entities to prevent Garbage Collection pauses during gameplay.
- **Fully Testable**: 100% unit-testable in Node/Vitest without canvas mocking.

### 4.2 Gemini API Integration (@google/genai)
- **Batch Processing**: Files are evaluated in batches of up to 20–25 per wave, drastically reducing API calls and latency.
- **Wave Prefetching**: When Wave $N$ starts, the client triggers a background prefetch for Wave $N+1$'s analysis.
- **Strict Response Schema**: Instructs Gemini to return structured JSON conforming to the `AnalysisBatchSchema`.
- **Server-Side Validation**: All Gemini output is parsed and strictly validated using Zod.
- **Prompt Injection Defense**:
  - File names are treated as untrusted user input.
  - Placed inside a bounded, strongly delimited data envelope (`<file_metadata_batch> ... </file_metadata_batch>`).
  - Explicit system instruction to treat input strictly as passive data and ignore any instructions contained within file names.
- **Caching**: In-memory LRU cache keyed by a SHA-256 hash of file metadata (`id + name + size + modifiedTime`).
- **Resilient Fallback**: If Gemini times out (5-second deadline) or hits quota limits, the server seamlessly falls back to `HeuristicClassifier` with badge `source: "heuristic"`.

### 4.3 Google Drive Integration (@googleapis/drive)
- **Minimal Scopes**: `https://www.googleapis.com/auth/drive` (Required to trash files created by other applications, as `drive.file` only applies to files created by this app).
- **Quota-Aware Querying**:
  - `trashed = false`
  - `'me' in owners`
  - `mimeType != 'application/vnd.google-apps.folder'`
  - Exclude Google Docs/Sheets/Slides (zero byte footprint against quota).
  - Ordered by `quotaBytesUsed desc`.
  - Field masking: `fields: 'files(id, name, mimeType, size, modifiedTime, viewedByMeTime, parents)'`.
- **Trash Execution**: Calls `files.update` with `{ trashed: true }`. Never invokes `files.delete`.
- **Concurrency Throttling**: Batch updates limited with `p-limit` to prevent Google API rate-limit errors (HTTP 429).

### 4.4 Stateless Authentication & Session Management
- **No Database**: Cloud Run instances remain completely stateless and horizontally scalable.
- **Encrypted Session Cookie**:
  - Google OAuth access token is encrypted server-side using AES-256-GCM with authenticated tags.
  - Stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie keyed by `SESSION_SECRET`.
  - Strict OAuth `state` parameter validation using short-lived cryptographically signed tokens.
  - No offline refresh token requested, ensuring zero persistent long-term token exposure.

---

## 5. Security & Safety Principles

1. **AI Advises, Human Decides**: Gemini outputs visual hints, confidence, and triage suggestions. Gemini *never* initiates trashing or mutation. Only explicit player actions (shooting or clicking Trash in List Mode) trigger an action.
2. **Non-Destructive by Design (Trash Only)**: Absolute ban on permanent deletion (`files.delete` or `emptyTrash`). Trashed files are easily recoverable directly in Google Drive or via the in-app restore buttons.
3. **Metadata-Only Ingestion**: Under no circumstance is file content opened, downloaded, or sent to an LLM. Only public metadata (name, MIME type, size, modified date, viewed date) is processed.
4. **Prompt Injection Hardening**: Delimited metadata tags + negative prompting + programmatic schema validation.
5. **Network & App Hardening**:
   - `helmet` with strict Content Security Policy (CSP).
   - `express-rate-limit` (general API rate limit + strict limiter on `/api/analyze`).
   - Request body payload size limits (`max 100kb`).
   - Graceful `SIGTERM` connection draining.
   - Cloud Run non-root user execution.

---

## 6. Accessibility & Inclusivity (WCAG 2.2 AA)

- **Equal Alternative: Triage List Mode**: Complete, non-game interface displaying an accessible table of files with direct keyboard-focusable "Trash" and "Keep" buttons. All background queues, undo windows, and Gemini explanations work identically in List Mode.
- **Keyboard Playability**:
  - `Arrow Left` / `Arrow Right` (or `A` / `D`): Move ship.
  - `Space`: Fire laser.
  - `Escape`: Pause game / Open menu.
  - `Tab` / `Shift+Tab`: Focus UI controls, Undo toast, and modal actions.
- **Cognitive & Motion Settings**:
  - Honors `prefers-reduced-motion` (disables screen shake, flash effects, particle clutter, and slows default speed).
  - Configurable Game Speed selector ($0.5\times, 0.75\times, 1.0\times, 1.25\times$).
- **Visual & Auditory Inclusivity**:
  - Contrast ratios conform to 4.5:1 minimum.
  - Multi-attribute visual coding (Color + Icon + Pattern).
  - ARIA Live regions (`aria-live="polite"`, `role="status"`, `role="alert"`) for real-time score changes, trashed file announcements, and error reports.
  - Visible keyboard focus rings on all interactive elements.
  - Screen reader accessible canvas fallback with `aria-label` and textual mirror.

---

## 7. Rubric & Automated Code Assessment Signals

| Assessment Signal | Implementation Details & Evidence | Target Score |
|---|---|---|
| **Problem Statement Alignment** | Verbatim quote in README; background execution mapping; score equals real freed storage bytes; non-blocking action queue. | 10 / 10 |
| **Effective Use of Google Services** | Gemini API (`@google/genai`) for structured triage; Drive API v3 for targeted query & trash; Google OAuth 2.0; Cloud Run container; Secret Manager. | 10 / 10 |
| **Code Quality** | TypeScript `strict: true`, ESLint, Prettier, clean monorepo separation, pure game engine without DOM coupling, shared Zod schemas, zero dead code, ADR documentation in `docs/DECISIONS.md`. | 10 / 10 |
| **Security** | Zero content reading; AI advises/human decides; trash-only guarantee; AES-256-GCM session cookies; helmet CSP; rate limiting; prompt injection firewall; no hardcoded secrets. | 10 / 10 |
| **Efficiency** | Batched Gemini analysis + wave prefetching; LRU metadata cache; Drive `fields` masking; `p-limit` throttling; object pooling in game loop; gzip compression; slim multi-stage container. | 10 / 10 |
| **Testing** | Comprehensive Vitest suite: Engine unit tests, ActionQueue tests (undo/rollback), Provider contract tests (Demo & Drive), Mocked API integration tests, and Axe accessibility audits. | 10 / 10 |
| **Accessibility** | Dual-mode (Arcade Shooter vs. Full Triage List Mode); ARIA Live announcements; WCAG 2.2 AA non-color cues; keyboard navigation; `prefers-reduced-motion` compliance. | 10 / 10 |

---

## 8. Out-of-Scope Boundaries (Scope Guard)

The following items are strictly out of scope:
- No database (PostgreSQL, MongoDB, SQLite, Redis).
- No custom user registration or password management.
- No permanent file deletion endpoints.
- No Gmail, Google Calendar, or Google Photos integration.
- No multiplayer or online leaderboards.
- No native mobile apps (responsive web only).
- No reading or parsing of file contents.

---

## 9. Phased Implementation Roadmap

- **Phase 1: Playable Core (Local Demo Mode)**:
  - Monorepo scaffold (`client`, `server`, `shared`), TypeScript strict, ESLint, Prettier, Vitest, CI workflow.
  - Shared Zod schemas (`FileMeta`, `Verdict`, `Analysis`, `ActionResult`).
  - Pure game engine (physics, collision, combo, scoring, wave control).
  - `DemoProvider` with ~60 realistic mock files and `HeuristicClassifier`.
  - Non-blocking `ActionQueue` with 5s undo window and session rollback.
  - Procedural Canvas renderer, HUD, Web Audio synth, Trash Bay, Pause Menu, Storage Bar.
  - Unit tests for engine, queue, and provider contracts.
- **Phase 2: Gemini, Hardening, Accessibility & Cloud Run Deploy**:
  - Gemini API endpoint (`/api/analyze`) with structured JSON schemas and prompt-injection defense.
  - LRU caching and graceful heuristic fallback.
  - Hardening (helmet, rate limiting, compression, healthz, graceful shutdown).
  - Triage List Mode with full keyboard navigation and ARIA Live announcements.
  - Automated Axe accessibility tests.
  - Multi-stage Dockerfile and deployment to Google Cloud Run with secret integration.
- **Phase 3: Real Google Drive Mode**:
  - OAuth 2.0 flow with encrypted session cookie and state verification.
  - Drive v3 candidate retrieval with quota ordering and field masks.
  - Drive trash and restore with `p-limit` concurrency control.
  - `DriveProvider` implementation adhering to `FileProvider` contract.
  - Consent and permissions modal.
- **Phase 4: Self-Audit & Comprehensive Documentation**:
  - 7-signal rubric evaluation and automated audit.
  - Accessibility audit and zero-dependency security verification.
  - Comprehensive README with problem mapping, architecture diagrams, and test instructions.
