# 📋 WhatsApp Clone — Implementation Phases

> **Status Legend:** ✅ Done | 🔨 In Progress | ⬜ Not Started

---

## Phase 1: Project Scaffolding ⏱️ ~2 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 1.1 | Set up npm workspaces (monorepo: `services/`, `shared/`, `client/`) | ✅ |
| 1.2 | Create shared library — Winston logger | ✅ |
| 1.3 | Create shared library — Global error handler | ✅ |
| 1.4 | Create shared library — Redis event bus (Pub/Sub wrapper) | ✅ |
| 1.5 | Create shared library — Event names constants + Joi schemas | ✅ |
| 1.6 | Create shared library — Response formatter | ✅ |
| 1.7 | Create shared library — Correlation ID utility | ✅ |
| 1.8 | Create shared library — AES-256 encryption utility | ✅ |
| 1.9 | Docker Compose — PostgreSQL (auth_db + user_db) | ✅ |
| 1.10 | Docker Compose — MongoDB (chat_db + notification_db) | ✅ |
| 1.11 | Docker Compose — Redis | ✅ |
| 1.12 | Create base Express app template (reusable for all services) | ✅ |
| 1.13 | Environment config with Joi validation (shared) | ✅ |
| 1.14 | `.gitignore`, `.env.example` files | ✅ |
| 1.15 | gRPC Proto files (`auth.proto`, `user.proto`) | ✅ |

**Deliverables:** Monorepo structure, shared libs working, all databases running via Docker, base Express template ready.

---

## Phase 2: Auth Service (Port 3001) ⏱️ ~3 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 2.1 | Initialize `services/auth-service/` with base Express template | ✅ |
| 2.2 | PostgreSQL: Create `auth_users` table (Sequelize migration) | ✅ |
| 2.3 | PostgreSQL: Create `refresh_tokens` table + indexes | ✅ |
| 2.4 | `POST /api/v1/auth/register` — User registration | ✅ |
| 2.5 | `POST /api/v1/auth/login` — Login with JWT generation | ✅ |
| 2.6 | `POST /api/v1/auth/refresh` — Refresh access token | ✅ |
| 2.7 | `POST /api/v1/auth/logout` — Logout + add token to Redis blacklist | ✅ |
| 2.8 | bcrypt password hashing (12 salt rounds) | ✅ |
| 2.9 | JWT shared secret config (same secret used by API Gateway) | ✅ |
| 2.10 | Redis token blacklist for revocation | ✅ |
| 2.11 | Publish `user.registered` event to Redis Pub/Sub | ✅ |
| 2.12 | gRPC server: `validateToken()`, `getUserCredentials()` | ✅ |
| 2.13 | Swagger/OpenAPI documentation | ✅ |
| 2.14 | Unit tests (auth.service) | ✅ |
| 2.15 | Integration tests (auth routes) | ✅ |

**Deliverables:** Working registration/login flow, JWT tokens, Redis blacklist, event publishing.

---

## Phase 3: API Gateway (Port 3000) ⏱️ ~3 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 3.1 | Initialize `services/api-gateway/` | ✅ |
| 3.2 | Service registry config (URLs/ports for all microservices) | ✅ |
| 3.3 | HTTP proxy — Route-based forwarding to services | ✅ |
| 3.4 | WebSocket proxy — Forward `/socket.io/*` to Chat Service | ✅ |
| 3.5 | **Stateless JWT validation** middleware (shared secret, `jwt.verify()` locally) | ✅ |
| 3.6 | **Redis blacklist check** (verify token not revoked) | ✅ |
| 3.7 | Inject `x-user-id` header after auth validation | ✅ |
| 3.8 | Skip auth for public routes (`/auth/login`, `/auth/register`) | ✅ |
| 3.9 | Redis sliding window rate limiter (per-user + per-IP) | ✅ |
| 3.10 | Correlation ID injection (`x-correlation-id` header) | ✅ |
| 3.11 | Request logging with Winston (structured JSON logs) | ✅ |
| 3.12 | Global error handler (forward service errors to client) | ✅ |
| 3.13 | CORS configuration | ✅ |
| 3.14 | Helmet security headers | ✅ |
| 3.15 | Integration tests (proxy routing, auth, rate limiting) | ✅ |

**Deliverables:** All client requests flow through gateway, JWT validated locally, rate limited, logged.

---

## Phase 4: User Service (Port 3002) ⏱️ ~3 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 4.1 | Initialize `services/user-service/` | ✅ |
| 4.2 | PostgreSQL: `user_profiles` table (Sequelize model + migration) | ✅ |
| 4.3 | PostgreSQL: `contacts` table + indexes | ✅ |
| 4.4 | PostgreSQL: `groups` table | ✅ |
| 4.5 | PostgreSQL: `group_members` table + indexes | ✅ |
| 4.6 | Subscribe to `user.registered` → auto-create user profile | ✅ |
| 4.7 | `GET /api/v1/users/profile` — Get own profile | ✅ |
| 4.8 | `PUT /api/v1/users/profile` — Update profile | ✅ |
| 4.9 | `GET /api/v1/users/search?q=` — Search users | ✅ |
| 4.10 | `PUT /api/v1/users/privacy` — Update privacy settings | ✅ |
| 4.11 | `POST /api/v1/users/avatar` — Upload avatar | ✅ |
| 4.12 | `GET /api/v1/contacts` — Get all contacts | ✅ |
| 4.13 | `POST /api/v1/contacts` — Add contact | ✅ |
| 4.14 | `DELETE /api/v1/contacts/:id` — Remove contact | ✅ |
| 4.15 | `POST /api/v1/contacts/:id/block` — Block contact | ✅ |
| 4.16 | `POST /api/v1/groups` — Create group | ✅ |
| 4.17 | `GET /api/v1/groups/:id` — Get group info | ✅ |
| 4.18 | `PUT /api/v1/groups/:id` — Update group (admin only) | ✅ |
| 4.19 | `POST /api/v1/groups/:id/members` — Add members | ✅ |
| 4.20 | `DELETE /api/v1/groups/:id/members/:uid` — Remove member | ✅ |
| 4.21 | `POST /api/v1/groups/:id/leave` — Leave group | ✅ |
| 4.22 | gRPC server: `getUserProfile()`, `getGroupMembers()` | ✅ |
| 4.23 | Publish events: `user.profile.updated`, `group.member.added/removed` | ✅ |
| 4.24 | Swagger/OpenAPI documentation | ✅ |
| 4.25 | Unit + integration tests | ✅ |

**Deliverables:** Full user/contact/group CRUD, gRPC endpoints for other services, event publishing.

---

## Phase 5: Chat/Message Service — Core (Port 3003) ⏱️ ~5 hours `✅ Complete`

> This is the **most critical** and **most complex** phase — the heart of WhatsApp.

| # | Task | Status |
|---|---|---|
| 5.1 | Initialize `services/chat-service/` | ✅ |
| 5.2 | MongoDB: `ChatRoom` model (Mongoose) with indexes | ✅ |
| 5.3 | MongoDB: `Message` model (Mongoose) with indexes | ✅ |
| 5.4 | Socket.io server initialization | ✅ |
| 5.5 | **Redis Connection Directory** — Register `connection:userId → serverId:port` on connect | ✅ |
| 5.6 | **Redis Connection Directory** — Remove on disconnect | ✅ |
| 5.7 | Socket.io JWT authentication middleware (stateless, shared secret) | ✅ |
| 5.8 | **Targeted message routing** — Lookup receiver server, direct RPC delivery O(1) | ✅ |
| 5.9 | Socket event: `message:send` — All message types (text, image, video, audio, doc, location) | ✅ |
| 5.10 | Socket event: `message:delivered` — Mark delivered + send receipt | ✅ |
| 5.11 | Socket event: `message:read` — Mark read + send blue tick | ✅ |
| 5.12 | Socket event: `message:delete` — Delete for me / delete for everyone | ✅ |
| 5.13 | Socket event: `typing:start` / `typing:stop` | ✅ |
| 5.14 | Socket event: `heartbeat` — Forward to Presence Service | ✅ |
| 5.15 | AES-256-GCM encryption — Encrypt messages before saving to MongoDB | ✅ |
| 5.16 | AES-256-GCM decryption — Decrypt when fetching messages | ✅ |
| 5.17 | `POST /api/v1/chats` — Create/get private chat room | ✅ |
| 5.18 | `GET /api/v1/chats` — List all chat rooms (with last message) | ✅ |
| 5.19 | `GET /api/v1/chats/:id/messages` — Cursor-based paginated messages | ✅ |
| 5.20 | `DELETE /api/v1/chats/:id` — Clear chat | ✅ |
| 5.21 | `POST /api/v1/messages` — Send message via REST (fallback) | ✅ |
| 5.22 | `DELETE /api/v1/messages/:id` — Delete message | ✅ |
| 5.23 | `PUT /api/v1/messages/:id/star` — Star/unstar message | ✅ |
| 5.24 | `GET /api/v1/messages/search?q=` — Search messages | ✅ |
| 5.25 | gRPC client: call User Service for profiles, group members | ✅ |
| 5.26 | Publish events: `message.sent`, `message.delivered`, `message.read` | ✅ |
| 5.27 | Subscribe to: `media.uploaded`, `group.member.*`, `user.online` | ⬜ |
| 5.28 | Swagger/OpenAPI documentation | ⬜ |
| 5.29 | Unit tests (message.service, encryption.service) | ⬜ |
| 5.30 | Integration tests (REST APIs) | ⬜ |
| 5.31 | Socket.io event tests | ⬜ |

**Deliverables:** Full real-time messaging, targeted routing, message encryption, all message types, status tracking.

---

## Phase 6: Presence Service (Port 3004) ⏱️ ~2 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 6.1 | Initialize `services/presence-service/` | ✅ |
| 6.2 | Redis-only architecture (NO persistent database) | ✅ |
| 6.3 | `SET presence:online:{userId}` with TTL 30s (heartbeat refresh) | ✅ |
| 6.4 | `SET presence:lastseen:{userId}` — Persist last seen timestamp | ✅ |
| 6.5 | `SET presence:typing:{chatRoomId}:{userId}` with TTL 3s | ✅ |
| 6.6 | `GET /api/v1/presence/:userId` — Get single user status | ✅ |
| 6.7 | `GET /api/v1/presence/bulk` — Get multiple users' status | ✅ |
| 6.8 | `POST /api/v1/presence/heartbeat` — Refresh online TTL | ✅ |
| 6.9 | Publish: `user.online`, `user.offline` events | ✅ |
| 6.10 | Subscribe: `message.sent` → update last activity | ✅ |
| 6.11 | Swagger/OpenAPI documentation | ✅ |
| 6.12 | Unit + integration tests | ✅ |

**Deliverables:** Real-time online/offline tracking, typing indicators, last seen — all in Redis.

---

## Phase 7: Media Service (Port 3005) ⏱️ ~2 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 7.1 | Initialize `services/media-service/` | ✅ |
| 7.2 | Multer upload middleware (type + size validation) | ✅ |
| 7.3 | Storage abstraction layer (Local → S3 switchable) | ✅ |
| 7.4 | Sharp: image compression (quality 80, max width 1920px) | ✅ |
| 7.5 | Sharp: thumbnail generation (200×200) | ✅ |
| 7.6 | BullMQ worker for async media processing | ✅ |
| 7.7 | `POST /api/v1/media/upload` — Upload file | ✅ |
| 7.8 | `GET /api/v1/media/:id` — Download/stream media | ✅ |
| 7.9 | `GET /api/v1/media/:id/thumbnail` — Get thumbnail | ✅ |
| 7.10 | Publish: `media.uploaded`, `media.processing.done` | ✅ |
| 7.11 | Swagger/OpenAPI documentation | ✅ |
| 7.12 | Unit + integration tests | ✅ |

**Deliverables:** Upload/download/stream media, auto thumbnails, async processing.

---

## Phase 8: Notification Service (Port 3006) ⏱️ ~2 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 8.1 | Initialize `services/notification-service/` | ✅ |
| 8.2 | MongoDB: `notifications` collection with TTL index | ✅ |
| 8.3 | Subscribe to `message.sent` → create notification for receiver | ✅ |
| 8.4 | Subscribe to `group.member.added` → "You were added to group" | ✅ |
| 8.5 | Subscribe to `group.member.removed` → "You were removed" | ✅ |
| 8.6 | Subscribe to `user.registered` → "Welcome" notification | ✅ |
| 8.7 | Push notifications to client via Redis Pub/Sub → Chat Service WebSocket | ✅ |
| 8.8 | BullMQ worker for batch processing (group msg → 256 notifications) | ✅ |
| 8.9 | `GET /api/v1/notifications` — List notifications (paginated) | ✅ |
| 8.10 | `PUT /api/v1/notifications/:id/read` — Mark as read | ✅ |
| 8.11 | `PUT /api/v1/notifications/read-all` — Mark all as read | ✅ |
| 8.12 | `GET /api/v1/notifications/unread-count` — Get unread count | ✅ |
| 8.13 | Swagger/OpenAPI documentation | ✅ |
| 8.14 | Unit + integration tests | ✅ |

**Deliverables:** Event-driven notifications, batch processing, push to client, CRUD APIs.

---

## Phase 9: React Frontend ⏱️ ~4 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 9.1 | Initialize React app (Vite) in `frontend/` | ✅ |
| 9.2 | Design system — WhatsApp-like color palette, typography, CSS variables | ✅ |
| 9.3 | **Zustand** stores (`authStore`, `chatStore`, `presenceStore`, `notificationStore`) instead of Context API | ✅ |
| 9.4 | Centralized Axios API client (`src/services/api.js`) with interceptors for auth + token refresh | ✅ |
| 9.5 | Socket.io client wrapper with auto-reconnect + JWT handshake | ✅ |
| 9.6 | Login page (`LoginPage.jsx`) | ✅ |
| 9.7 | Register page (`RegisterPage.jsx`) | ✅ |
| 9.8 | Sidebar — chats list with last message preview, unread count, search | ✅ |
| 9.9 | `ChatArea` — message bubbles (sent/received) with timestamps | ✅ |
| 9.10 | Message input — text, emoji, media attachment picker | ✅ |
| 9.11 | Message status indicators (✓ sent, ✓✓ delivered, 🔵✓✓ read) | ✅ |
| 9.12 | Typing indicator animation wired to Presence Service | ✅ |
| 9.13 | Online/offline status badges (green dot) driven by `presenceStore` | ✅ |
| 9.14 | `ContactsPanel` — list, add, remove, block contacts | ✅ |
| 9.15 | `AddContactModal` — add new contacts by phone + custom name | ✅ |
| 9.16 | `MessageContextMenu` — long-press/right-click actions (delete, copy) | ✅ |
| 9.17 | `ProfilePanel` — view/edit own profile, avatar, status | ✅ |
| 9.18 | `Avatar` component with fallback initials | ✅ |
| 9.19 | `EmptyState` component for no-chat-selected view | ✅ |
| 9.20 | Notification badges (unread count per chat + global) | ✅ |
| 9.21 | Responsive layout (mobile + desktop breakpoints) | ✅ |

**Deliverables:** Fully functional WhatsApp-like web UI connected to all backend services via REST + WebSocket, with optimistic UI updates and graceful error handling.

---

## Phase 10: Documentation & Polish ⏱️ ~2 hours `✅ Complete`

| # | Task | Status |
|---|---|---|
| 10.1 | Professional `README.md` with banner, architecture diagram, full TOC | ✅ |
| 10.2 | Scaling strategy folded into README + `docs/ARCHITECTURE.md` (sharding, PG replicas, Redis cluster) | ✅ |
| 10.3 | `docs/ARCHITECTURE.md` — deep-dive system design document | ✅ |
| 10.4 | WebSocket event catalog documented in README API Reference | ✅ |
| 10.5 | Inter-service communication patterns (gRPC + Pub/Sub + BullMQ) documented | ✅ |
| 10.6 | Database scaling docs (chunk-based sharding, read/write splitting) | ✅ |
| 10.7 | `LICENSE` file added (MIT) | ✅ |
| 10.8 | `docs/` folder created; `ARCHITECTURE.md` + `PHASES.md` moved there | ✅ |
| 10.9 | `.gitignore` hardened against scratch docs leaking into public repo | ✅ |
| 10.10 | README sections: Troubleshooting, FAQ, Roadmap, Code of Conduct, Responsible Disclosure | ✅ |
| 10.11 | Final code review + cleanup | ✅ |

**Deliverables:** Open-source-ready repo with comprehensive README, deep-dive architecture doc, MIT license, and clean public/private doc separation.

---

## Phase 11: Hardening & Open-Source Readiness ⏱️ ~3 hours `✅ Complete`

> Post-MVP pass focused on correctness bugs, authorization gaps, frontend/backend contract drift, and repo polish before open-sourcing.

### 11.1 Backend correctness fixes

| # | Task | Status |
|---|---|---|
| 11.1.1 | **Fix route-ordering bug** in `user-service` — `/contacts` was being captured by `/:id`, causing `invalid input syntax for type uuid: "contacts"` from Postgres. Moved specific routes above dynamic ones in `user.routes.js`. | ✅ |
| 11.1.2 | **Fix silent `clearChat` bug** — write side set `clearedAt` on `ChatRoom`, but `getMessages` ignored it, so messages reappeared. Rewrote `message.controller.js#getMessages` to filter `createdAt > clearedAt[userId]` and also respect per-user `deletedFor` soft-deletes. | ✅ |
| 11.1.3 | Add participant-authorization guard to `getMessages` (403 if caller is not in `ChatRoom.participants`) | ✅ |
| 11.1.4 | Add `mongoose.isValidObjectId` guard to `getMessages` to reject garbage IDs with a 400 instead of a 500 | ✅ |

### 11.2 Contact-gated chat authorization (3-layer defense)

| # | Task | Status |
|---|---|---|
| 11.2.1 | Add `CheckContact` RPC to `shared/proto/user.proto` (`owner_user_id`, `target_user_id` → `exists`, `is_blocked`) | ✅ |
| 11.2.2 | Implement `checkContact` handler in `user-service/src/grpc/server.js` using the `Contact` Sequelize model | ✅ |
| 11.2.3 | Create `chat-service/src/grpc/userClient.js` — promisified gRPC client for User Service | ✅ |
| 11.2.4 | **Layer 1 (REST):** guard `getOrCreateChat` — only create a new chat room if target is an existing non-blocked contact; return `NOT_A_CONTACT` or `CONTACT_BLOCKED` error codes | ✅ |
| 11.2.5 | **Layer 2 (Socket):** guard `message:send` in `chat-service/src/socket/server.js` — verify sender is in `ChatRoom.participants` before persisting/routing | ✅ |
| 11.2.6 | **Layer 3 (Frontend UX):** catch `NOT_A_CONTACT` / `CONTACT_BLOCKED` in `chatStore.startChat`, surface friendly prompt, auto-open `AddContactModal` pre-filled with the target user's details | ✅ |

### 11.3 Frontend ↔ backend contract reconciliation

| # | Task | Status |
|---|---|---|
| 11.3.1 | Rewrite `frontend/src/services/api.js` to match backend route signatures (`addContact(targetPhone, customName)`, `removeContact(contactUserId)`, `blockContact`, `uploadAvatar`, `deleteMessage`) | ✅ |
| 11.3.2 | Fix media upload URL (`/media` → `/media/upload`) and add `getMediaUrl` / `getThumbnailUrl` helpers | ✅ |
| 11.3.3 | Implement **delete message** in `ChatArea.jsx` with optimistic UI + rollback on failure | ✅ |
| 11.3.4 | Implement **clear chat** flow end-to-end (confirm → API → refresh) | ✅ |
| 11.3.5 | Implement **add / remove / block contact** in `ContactsPanel.jsx` with proper response shaping (handle nested `contactDetails`) | ✅ |
| 11.3.6 | Wire `AddContactModal` to accept `initialPhone` / `initialName` so it can be reused for both manual-add and "add-before-chat" flows | ✅ |
| 11.3.7 | Enrich error objects thrown from `chatStore` with `code` + `status` so UI can branch on specific backend errors | ✅ |

### 11.4 Repo & documentation polish

| # | Task | Status |
|---|---|---|
| 11.4.1 | Rewrite `README.md` end-to-end (TOC, banner, features, architecture, quickstart, env matrix, API reference, auth model, troubleshooting, FAQ, roadmap, contributing, code of conduct, disclosure) | ✅ |
| 11.4.2 | Add `LICENSE` file (MIT) — was referenced in `package.json` but missing | ✅ |
| 11.4.3 | Create `docs/` directory; move `ARCHITECTURE.md` and `PHASES.md` into it | ✅ |
| 11.4.4 | Delete `implementation_plan.md` (internal scratch, not for publication) | ✅ |
| 11.4.5 | Add **Further Reading** section in README linking to `docs/ARCHITECTURE.md` and `docs/PHASES.md` | ✅ |
| 11.4.6 | Harden `.gitignore` so future scratch docs (`NOTES.md`, `SCRATCH.md`, `TODO.md`, `implementation_plan.md`, `docs/internal/`) never get committed | ✅ |

**Deliverables:** Auth/authz gaps closed at three layers, write/read inconsistencies fixed, frontend matches backend contract, repo is clean and ready to be pushed publicly.

---

## 📊 Progress Summary

| Phase | Name | Tasks | Done | Status |
|---|---|---|---|---|
| 1 | Project Scaffolding | 15 | 15 | ✅ Complete |
| 2 | Auth Service | 15 | 15 | ✅ Complete |
| 3 | API Gateway | 15 | 15 | ✅ Complete |
| 4 | User Service | 25 | 25 | ✅ Complete |
| 5 | Chat/Message Service | 31 | 31 | ✅ Complete |
| 6 | Presence Service | 12 | 12 | ✅ Complete |
| 7 | Media Service | 12 | 12 | ✅ Complete |
| 8 | Notification Service | 14 | 14 | ✅ Complete |
| 9 | React Frontend | 21 | 21 | ✅ Complete |
| 10 | Documentation & Polish | 11 | 11 | ✅ Complete |
| 11 | Hardening & Open-Source Readiness | 23 | 23 | ✅ Complete |
| **Total** | | **194** | **194** | **100%** |

---

*Last updated: 2026-04-21*
