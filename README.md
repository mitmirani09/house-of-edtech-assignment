# EdtechDocs — Local-First Collaborative Document Editor

EdtechDocs is a local-first, real-time collaborative document editor (Google Docs clone) built using Next.js 16, Prisma 7, PostgreSQL, and Yjs CRDTs. It supports offline editing, automatic cloud synchronization on reconnection, document access control sharing, snapshot version history, and AI-powered writing assistance.

* **Production URL:** [https://house-of-edtech-assignment-gray.vercel.app](https://house-of-edtech-assignment-gray.vercel.app)
* **WebSocket Server:** Run via custom Node server (`npm run websocket`).

---

## 🏛️ System Architecture Overview

```
               +--------------------------------------+
               |         Next.js Client (React 19)    |
               +--------------------------------------+
                 /         |                  \
      (Sync Updates)  (Server Actions)    (Collab Sync / Cursors)
               /           v                    \
              v    +-----------------+           v
      +-----------+|  Prisma ORM &   |   +--------------------+
      | IndexedDB ||  Node Pool Pg   |   | Collaboration WS   |
      | (Browser) |+-----------------+   | Server (tsx/ws)    |
      +-----------+        |             +--------------------+
                           v                       |
                  +------------------+             /
                  |  PostgreSQL DB   |<------------+
                  +------------------+
```

---

## ❓ Key Architecture Questions Answered

### 1. How does your conflict resolution work?
We use **Yjs**, a high-performance Conflict-free Replicated Data Type (CRDT) library. Under the hood, Yjs models document content as a deterministic linked list of items. 
* Every insertion or deletion is assigned a unique client ID and a sequential logical clock counter.
* When concurrent edits merge (e.g., two users modifying the same paragraph offline), the conflicts are resolved deterministically using a YATA algorithm.
* This means that regardless of the order updates are received or the network latency, all clients converge on the exact same document state without requiring a centralized coordinator.

### 2. How do you prevent Out-Of-Memory (OOM) attacks?
We employ three strict layers of defense to protect the server and database from memory exhaustion:
1. **Schema Validation:** We enforce strict Zod schemas on all API routes and Server Actions, rejecting malformed structures immediately.
2. **Payload Size Restrictions:** The content sync and version snapshot schemas validate that text payloads do not exceed **2MB** (approx. 2 million characters). Large payloads are rejected before entering database transactions.
3. **Rate Limiting:** We implement a sliding-window rate limiter in Server Actions. Authenticated users are capped at 120 updates/minute, and unauthenticated actions (login/register) are capped by client IP to block brute-force or DDoS storms.

### 3. How does offline sync work without data loss?
Our synchronization engine uses a **local-first** approach:
* **IndexedDB Persistence:** Keystrokes are written instantly to `y-indexeddb` in the browser, completely decoupling typing from network quality.
* **State Diffing:** When the network transitions back to `online`, we do not re-upload the entire document. Instead, we use Yjs state vectors to compute a binary *diff* (delta update) containing only the changes made offline.
* **Background Cloud Sync:** The client sends the diff to the WebSocket server which merges it using `Y.applyUpdate`. Additionally, the client fires a debounced update server action to update the PostgreSQL database's rich text `content` representation.

### 4. How is tenant isolation ensured?
Tenant isolation and security are enforced both logically and at the database layer:
* **Prisma Query Scoping:** We never run raw lookups (like `prisma.document.findUnique({ where: { id } })`) without validating permissions. Every action first checks membership inside `DocumentMember` for the caller's `session.user.id`.
* **PostgreSQL Row-Level Security (RLS):** We provide a custom SQL database schema (`prisma/rls_policies.sql`) enabling RLS. Policies verify that a user can only read, write, or query a document if they have an active association in the `DocumentMember` junction table, matching the current session context variable (`app.current_user_id`).

### 5. How does version restore work without breaking collaborators?
Restoring a snapshot must not trigger a hard overwrite (which breaks active WebSocket rooms and disconnects users):
* When a user restores a snapshot, the client deletes all XML elements from the current shared Yjs fragment (`fragment.delete(0, fragment.length)`) and replaces it with the snapshot's HTML using TipTap's `editor.commands.setContent()`.
* Because this operation occurs inside the active Yjs document, it generates a standard Yjs update (delete + insert delta).
* This diff is broadcast to all active collaborators via WebSockets. Their local editors smoothly render the updated text in real-time as a regular edit transaction, maintaining collaborative cursors, awareness states, and session integrity.

---

## 🛠️ Local Setup Guide

Follow these steps to run the complete environment locally:

### 1. Prerequisites
* Node.js (v18 or higher)
* PostgreSQL database running locally or via Docker

### 2. Environment Variables (`.env`)
Create a `.env` file at the root of the project:
```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/edtechdocs?sslmode=require"

# Auth.js Secret (Generate via: npx auth secret)
AUTH_SECRET="your_secure_auth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API (Get from Google AI Studio)
GEMINI_API_KEY="your_google_gemini_api_key"

# WebSocket server port configuration
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
WS_PORT="1234"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database Schema & Migrations
Ensure PostgreSQL is running, then run:
```bash
npx prisma db push
```

### 5. Run the Application
Start the Next.js client development server:
```bash
npm run dev
```

In a separate terminal, start the dedicated collaboration WebSocket server:
```bash
npm run websocket
```

Access the app at `http://localhost:3000`.

---

## 🧪 Testing Guide

We have set up automated unit testing using **Vitest**. The tests reside inside the `tests/` folder.

To execute the unit test suite:
```bash
npm test
```

### What is tested:
1. **HTML Sanitizer (`tests/sanitize.test.ts`):** Validates XSS injection prevention by stripping `<script>` tags, iframe embeds, inline event handlers (`onclick`, `onerror`), and `javascript:` links.
2. **Rate Limiting (`tests/rateLimit.test.ts`):** Tests the in-memory sliding window rate limiter, verifying block rules, remaining attempts, and time-based window resets.
3. **AI Schema Validation (`tests/ai.test.ts`):** Verifies the Zod validations on inputs to the AI endpoint.
