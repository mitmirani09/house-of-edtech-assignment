# 🏗️ House of Edtech — Fullstack Assignment Breakdown

> **Role:** Fullstack Developer (Fulltime)
> **Assignment:** Local-First Collaborative Document Editor
> **Version:** 2.1, April 2026

---

## 📌 What You're Building (Plain English)

A **Google Docs-like collaborative editor** that works **offline first** — meaning users can edit documents even without internet. When internet comes back, changes sync automatically and conflicts are resolved intelligently. Users also get a full version history to travel back in time to any saved state.

---

## 🛠️ Tech Stack

### Mandatory
| Layer | Technology |
|---|---|
| Frontend + Backend | **Next.js 16** (App Router, TypeScript) |
| Styling | **Tailwind CSS** (+ shadcn/ui or Radix UI) |
| Database | **PostgreSQL** |
| Version Control | **Git** (GitHub repo required) |
| Language | **TypeScript** throughout |

### Strongly Recommended / Good-to-Have
| Purpose | Options |
|---|---|
| Auth | NextAuth / Auth.js (JWT-based) |
| Real-time sync | **Yjs** (CRDT library) + WebSockets / PartyKit |
| Rich Text Editor | **TipTap** (built on ProseMirror, has Yjs plugin) |
| ORM | **Prisma** (with PostgreSQL) |
| Local storage | **IndexedDB** (via `idb` or `Dexie.js`) |
| AI features | Vercel AI SDK + OpenAI / Gemini / Groq |
| Deployment | **Vercel** (easiest for Next.js) |
| CI/CD | GitHub Actions |
| Background sync | Service Workers |
| Testing (bonus) | Playwright (E2E), Vitest (unit) |

---

## 🎯 Features & Functionalities — Complete Breakdown

### ✅ MUST HAVE (Non-negotiable)

---

#### 1. 🔐 Authentication & Authorization
**What they want:** Secure login/signup with role-based access control (RBAC). Three roles: **Owner**, **Editor**, **Viewer**. Viewers cannot write. Owners can assign roles.

**What to build:**
- Use **NextAuth.js (Auth.js)** with JWT + credentials (email/password) or OAuth (Google sign-in is a nice bonus)
- Store users in PostgreSQL via Prisma
- Middleware on API routes to verify JWT and check role
- Document invite system: Owner can invite others by email and assign role
- Protect WebSocket/sync endpoint — reject write events from Viewers at the server level

**Implementation suggestion:**
```
- next-auth for session handling
- Prisma schema: User, Document, DocumentMember (userId, documentId, role)
- Middleware: check req.session.user.role before allowing writes
```

---

#### 2. 🖥️ Local-First Architecture (The Core Challenge)
**What they want:** The editor must work with zero internet. All edits happen locally first, server is secondary.

**What to build:**
- Use **IndexedDB** (via `Dexie.js`) as the local database in the browser
- Every keystroke saves to IndexedDB instantly — no network call blocks typing
- When online, changes sync to PostgreSQL in the background
- Use **Yjs** — a CRDT (Conflict-free Replicated Data Type) library that handles merge logic automatically
- Yjs has a `y-indexeddb` persistence provider that saves doc state locally

**Implementation suggestion:**
```
- TipTap editor + Yjs (y-prosemirror)
- y-indexeddb: persists Yjs document state in the browser
- y-websocket: syncs when online
- On mount: load from IndexedDB, apply any pending offline ops
```

**Key concept:** CRDT = the math that lets two people edit the same document offline and merge perfectly when reconnected. Yjs gives you this for free.

---

#### 3. 🔄 Background Sync Engine
**What they want:** When the user comes back online, queue and push local changes to the server, pull remote changes, without destroying local work.

**What to build:**
- A **sync queue** stored in IndexedDB that captures offline operations
- A **Service Worker** (or an `online` event listener) that detects connectivity
- On reconnect: push the local Yjs state update to the server, server merges and broadcasts to other clients
- Use Yjs's built-in `update` encoding — only send the *diff* (delta), not the whole document

**Implementation suggestion:**
```
- navigator.onLine + window addEventListener('online') to detect reconnect
- Yjs encodeStateAsUpdate() to capture local diff
- POST /api/sync with the encoded Yjs update
- Server applies update via Y.applyUpdate() and broadcasts via WebSocket
```

---

#### 4. ⏳ Version History & Time Travel
**What they want:** Users can snapshot the document, browse a timeline, and restore to any past version — without breaking the live document for other collaborators.

**What to build:**
- A "Save Version" button that calls `POST /api/documents/:id/versions`
- Store a **Yjs snapshot** (encoded binary) + metadata (timestamp, user, optional label) in PostgreSQL
- A version timeline sidebar showing all snapshots
- "Preview" mode: load snapshot in a read-only editor instance
- "Restore" button: apply snapshot as a new Yjs update on top of current state (so collaborators see the restore as a regular edit, not a hard overwrite)

**Implementation suggestion:**
```
- DB: VersionSnapshot table { id, documentId, createdBy, createdAt, label, yState (bytea) }
- Y.encodeSnapshot() to capture, Y.createDocFromSnapshot() to preview
- Restore = encode the snapshot as an update, apply via Y.applyUpdate()
```

---

#### 5. 🔒 Security & Data Validation
**What they want:** Stop malicious payloads from crashing the server. Row Level Security in PostgreSQL.

**What to build:**
- **Payload size limit** on sync endpoint (e.g., max 2MB per request using `next.config` body parser limits)
- **Schema validation** on incoming sync payload using `zod`
- **Rate limiting** on API routes (use `upstash/ratelimit` or a simple in-memory counter)
- **Row Level Security (RLS)** in PostgreSQL: policies that prevent a user from reading/writing documents they don't have access to
- Validate that the `documentId` in the payload matches an actual document the user is a member of
- Sanitize any rich text content to prevent XSS

**Implementation suggestion:**
```
- zod schema for /api/sync payload
- next.config.js: api: { bodyParser: { sizeLimit: '2mb' } }
- PostgreSQL RLS: CREATE POLICY on documents table
- Prisma: always scope queries to userId (no raw "find by id" without user check)
```

---

#### 6. 🌐 Conflict Resolution (Deterministic)
**What they want:** Two users edit the same paragraph offline. When they reconnect, both changes must be preserved intelligently — not "last write wins."

**What to build:**
- **Yjs handles this automatically** via CRDT. Your job is to wire it correctly.
- Make sure you use `y-websocket` with a server that applies updates via `Y.applyUpdate` and re-broadcasts
- Test: open two browser tabs, disconnect one (DevTools → Offline), edit both, reconnect — both edits should appear

**Key thing to explain in your README:** Yjs uses a CRDT algorithm (based on YATA) that assigns unique IDs to every character insertion. When merges happen, operations are ordered by these IDs deterministically — same input always produces same output, regardless of order received.

---

### 🟡 GOOD TO HAVE (Strong Differentiators)

---

#### 7. 🤖 AI Features
**What they want:** AI-powered add-ons that make the editor powerful. This is a major differentiator.

**What to build (pick 2–3):**
- **AI Writing Assistant**: Select text → "Improve this", "Make it shorter", "Fix grammar" — uses Vercel AI SDK streaming
- **AI Summarizer**: One-click document summary in the sidebar
- **Smart Autocomplete**: Inline suggestions as you type (like GitHub Copilot for text)
- **AI Conflict Explainer**: When a merge conflict is complex, AI explains what changed and why
- **Chat with Document**: Ask questions about the document content using RAG

**Implementation suggestion:**
```
- Vercel AI SDK (streamText from ai package)
- Model: Groq (fastest for free tier), or OpenAI GPT-4o
- Slash command "/" in editor to trigger AI actions
- TipTap has an AI extension or you can build a custom command palette
```

---

#### 8. 🧪 Testing (Bonus)
**What to build:**
- **Unit tests** for the sync engine logic (conflict merge, queue processing) — use **Vitest**
- **E2E tests** for offline sync flow — use **Playwright** (simulate offline, edit, reconnect, verify merge)
- **Integration tests** for API routes (auth, version history, sync endpoint)

---

### 🌟 ADDITIONAL FEATURES YOU SHOULD ADD (Your Ideas)

These aren't in the brief but will make your project stand out significantly:

#### 9. 📡 Real-Time Presence Indicators
- Show avatars/cursors of other users currently editing (TipTap + Yjs awareness protocol)
- Color-coded cursors per user
- "John is typing..." indicator

#### 10. 💬 Inline Comments & Annotations
- Select text, add a comment (like Google Docs)
- Resolve/unresolve comments
- Stored in PostgreSQL linked to a text position

#### 11. 📶 Connection Status Banner
- Clear UI indicator: "Offline — changes saved locally", "Syncing...", "All changes saved"
- Progress indicator during sync

#### 12. 📤 Export Options
- Export document as PDF, Markdown, or plain text
- Great UX feature, easy to implement with libraries

#### 13. 🔗 Shareable Links
- Generate a public read-only link (Viewer role auto-assigned)
- Share modal with role selector

---

## 📋 Build Order (Step-by-Step Roadmap)

Follow this exact sequence. Each phase builds on the previous.

---

### Phase 1: Foundation (Days 1–2)
**Goal: Get the project skeleton working**

1. `npx create-next-app@latest --typescript` — init project
2. Set up **Tailwind CSS** + install **shadcn/ui** (`npx shadcn@latest init`)
3. Set up **PostgreSQL** locally (or use Supabase/Neon for cloud Postgres)
4. Set up **Prisma**: `npm install prisma @prisma/client`, `npx prisma init`
5. Design your database schema (see below)
6. Set up **NextAuth.js** — email/password auth first
7. Build login, signup, dashboard pages (basic, style later)
8. Deploy skeleton to **Vercel** — get CI/CD pipeline running from day 1

**Database Schema (Prisma):**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  documents DocumentMember[]
  versions  VersionSnapshot[]
}

model Document {
  id        String   @id @default(cuid())
  title     String
  yState    Bytes?   // Yjs document state
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   DocumentMember[]
  versions  VersionSnapshot[]
}

model DocumentMember {
  id         String   @id @default(cuid())
  userId     String
  documentId String
  role       Role
  user       User     @relation(fields: [userId], references: [id])
  document   Document @relation(fields: [documentId], references: [id])
  @@unique([userId, documentId])
}

model VersionSnapshot {
  id         String   @id @default(cuid())
  documentId String
  createdBy  String
  label      String?
  yState     Bytes
  createdAt  DateTime @default(now())
  document   Document @relation(fields: [documentId], references: [id])
  user       User     @relation(fields: [createdBy], references: [id])
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}
```

---

### Phase 2: Core Editor (Days 3–4)
**Goal: Get a working rich text editor**

1. Install **TipTap**: `npm install @tiptap/react @tiptap/starter-kit`
2. Build the editor page (`/documents/[id]`)
3. Add basic formatting toolbar (bold, italic, headings, lists)
4. Save document to PostgreSQL on blur/debounce (simple save first)
5. Style with Tailwind — clean, minimal document editor look

---

### Phase 3: Local-First + Yjs (Days 5–7)
**Goal: Editor works offline**

1. Install Yjs: `npm install yjs @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor y-indexeddb`
2. Wrap TipTap with Yjs — replace TipTap's document model with a Yjs `Y.Doc`
3. Add `y-indexeddb` provider — now the editor auto-saves to IndexedDB
4. Test: open editor, type, close tab, reopen — content should persist from IndexedDB
5. Add online/offline detection (`navigator.onLine`)
6. Show connection status indicator in the UI

---

### Phase 4: Real-Time Sync + WebSocket (Days 8–10)
**Goal: Multiple users edit simultaneously**

1. Set up a **y-websocket server** (can run as a separate Node.js process or in Next.js API route via custom server)
   - Easiest: use **PartyKit** (serverless WebSocket hosting that has native Yjs support)
   - Or: `npm install y-websocket` and run `HOST=localhost PORT=1234 npx y-websocket`
2. Add `y-websocket` provider to your editor alongside `y-indexeddb`
3. Add **awareness** (cursor presence) with `@tiptap/extension-collaboration-cursor`
4. Test with two browser tabs — see live cursors and real-time sync

---

### Phase 5: Background Sync Engine (Days 11–12)
**Goal: Offline changes sync when reconnection happens**

1. Queue failed sync operations in IndexedDB when offline
2. Listen for `window.addEventListener('online', syncQueue)`
3. On reconnect: flush the queue, send Yjs state updates to `/api/sync`
4. Server applies Yjs update to stored `yState` in PostgreSQL and broadcasts

---

### Phase 6: Version History (Days 13–14)
**Goal: Time travel through document history**

1. Build "Save Version" button → `POST /api/documents/:id/versions`
2. Encode current Yjs state: `Y.encodeStateAsUpdate(ydoc)`
3. Store in `VersionSnapshot` table
4. Build version history sidebar — list of snapshots with timestamps
5. Preview: open snapshot in read-only TipTap instance
6. Restore: apply snapshot as Yjs update

---

### Phase 7: Security Hardening (Day 15)
**Goal: Production-ready security**

1. Add `zod` validation on all API routes
2. Add body size limits in `next.config.js`
3. Add rate limiting with `@upstash/ratelimit` (free tier available)
4. Add PostgreSQL RLS policies
5. Ensure all Prisma queries are scoped to `userId`
6. Add role checks in WebSocket handlers

---

### Phase 8: AI Features (Days 16–17)
**Goal: Add AI-powered writing tools**

1. Install `ai` (Vercel AI SDK): `npm install ai`
2. Build `/api/ai/improve` route using streaming response
3. Add slash command `/` in TipTap editor that opens AI command palette
4. Implement: Improve, Summarize, Fix Grammar actions
5. Connect to Groq (fastest & has generous free tier)

---

### Phase 9: Polish & Deploy (Days 18–20)
**Goal: Ship a polished, production-ready app**

1. Responsive design — make sure it works on mobile
2. Accessibility audit (keyboard navigation, ARIA labels)
3. Add proper error handling and loading states
4. Write README with architecture explanation, local setup guide, deployed URL
5. Add your name, GitHub, and LinkedIn in the footer (required!)
6. Final Vercel deployment
7. Set up GitHub Actions CI/CD (run tests on every PR)

---

## 🔗 Resources & Libraries

### Core Libraries
| Library | Link | Purpose |
|---|---|---|
| TipTap | https://tiptap.dev | Rich text editor |
| Yjs | https://docs.yjs.dev | CRDT for collaboration |
| y-indexeddb | https://github.com/yjs/y-indexeddb | Offline persistence |
| y-websocket | https://github.com/yjs/y-websocket | Real-time sync |
| Dexie.js | https://dexie.org | IndexedDB wrapper |
| PartyKit | https://partykit.io | Serverless WebSocket (Yjs-native) |
| Prisma | https://prisma.io | ORM for PostgreSQL |
| NextAuth | https://authjs.dev | Authentication |
| shadcn/ui | https://ui.shadcn.com | UI components |
| Zod | https://zod.dev | Schema validation |
| Vercel AI SDK | https://sdk.vercel.ai | AI integration |

### Tutorials & Guides
| Resource | Link |
|---|---|
| TipTap + Yjs collaboration guide | https://tiptap.dev/docs/editor/extensions/functionality/collaboration |
| Yjs crash course | https://docs.yjs.dev/getting-started/a-collaborative-editor |
| Local-first software (must read) | https://www.inkandswitch.com/local-first/ |
| PartyKit + Yjs quickstart | https://docs.partykit.io/guides/using-yjs-with-partykit/ |
| NextAuth.js docs | https://authjs.dev/getting-started |
| Prisma PostgreSQL setup | https://www.prisma.io/docs/getting-started |
| Upstash rate limiting | https://upstash.com/docs/redis/sdks/ratelimit/overview |
| Vercel deployment | https://vercel.com/docs/deployments/overview |
| GitHub Actions CI/CD | https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs |

### Cloud Services (Free Tiers)
| Service | Purpose | Link |
|---|---|---|
| Neon | Serverless PostgreSQL | https://neon.tech |
| Supabase | PostgreSQL + extras | https://supabase.com |
| Vercel | Deployment | https://vercel.com |
| PartyKit | WebSocket hosting | https://partykit.io |
| Groq | Fast AI inference (free) | https://console.groq.com |
| Upstash | Redis rate limiting | https://upstash.com |

---

## ❓ Key Architecture Questions to Address in Your README

The evaluators will look for evidence that you understand the *why*. Answer these in your README:

1. **How does your conflict resolution work?** → Explain Yjs CRDT and why it's deterministic
2. **How do you prevent OOM attacks?** → Body size limits + payload validation + rate limiting
3. **How does offline sync work without data loss?** → IndexedDB queue + Yjs state diffing
4. **How is tenant isolation ensured?** → Prisma query scoping + PostgreSQL RLS policies
5. **How does version restore work without breaking collaborators?** → Restore as a Yjs update, not a hard overwrite

---

## ✅ Submission Checklist

- [ ] GitHub repository (public) with clean commit history
- [ ] Live deployment URL (Vercel)
- [ ] CI/CD configured (GitHub Actions)
- [ ] Footer with your name, GitHub profile link, LinkedIn profile link
- [ ] README with: project overview, setup instructions, architecture explanation, deployed URL
- [ ] All three roles working: Owner, Editor, Viewer
- [ ] Offline mode tested and working
- [ ] Version history working
- [ ] At least one AI feature working
- [ ] Security measures in place (rate limiting, validation, RLS)
