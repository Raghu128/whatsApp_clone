# 🏗️ WhatsApp Clone — System Architecture

> A production-grade, microservices-based WhatsApp clone designed for **billions of connections** with independent horizontal scaling per service.

---

## Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Microservices Architecture](#-microservices-architecture)
3. [Inter-Service Communication](#-inter-service-communication)
4. [API Gateway — Stateless JWT](#-api-gateway--stateless-jwt-design)
5. [Chat Service — Targeted Routing](#-chat-service--targeted-routing-via-connection-directory)
6. [Database Architecture](#-database-architecture)
7. [Database Sharding & Scaling](#-database-sharding--scaling)
8. [Redis Cluster & Hash Slots](#-redis-cluster--hash-slots)
9. [REST API Endpoints](#-rest-api-endpoints)
10. [Socket.io Events](#-socketio-events)
11. [Security](#-security)
12. [Scaling Strategy](#-scaling-strategy)

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Runtime** | Node.js (v20+) | Event-driven, non-blocking I/O — perfect for real-time chat |
| **API Gateway** | Express.js (custom) | Route proxying, stateless JWT, rate limiting |
| **Inter-Service (Sync)** | gRPC | Low-latency, type-safe binary protocol for service-to-service |
| **Inter-Service (Async)** | Redis Pub/Sub + BullMQ | Event-driven communication, background job queues |
| **Real-time** | Socket.io + Redis Connection Directory | WebSocket with targeted O(1) message routing |
| **Auth DB** | PostgreSQL | ACID-compliant user credentials |
| **User DB** | PostgreSQL | Structured data (profiles, contacts, groups) |
| **Message DB** | MongoDB (Sharded) | Flexible schema, fast writes, chunk-based sharding |
| **Notification DB** | MongoDB | Flexible notification payloads with TTL auto-cleanup |
| **Cache / Event Bus** | Redis Cluster | Presence, typing, connection directory, pub/sub, rate limiting |
| **File Storage** | Local (dev) / S3 (prod) | Media uploads with abstraction layer |
| **API Docs** | Swagger (OpenAPI 3.0) | Per-service interactive API documentation |
| **Testing** | Jest + Supertest + Socket.io Client | Unit, integration, and WebSocket tests |
| **Frontend** | React (Vite) | Simple, fast, component-based UI |
| **Containerization** | Docker + Docker Compose | Each service in its own container |

---

## 📐 Microservices Architecture

### Service Decomposition

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│                    (React Web App / Mobile / API)                             │
└─────────────────────────────┬────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     🔀 API GATEWAY (Port 3000)                               │
│                                                                              │
│  • Route-based HTTP & WebSocket proxying                                     │
│  • Stateless JWT validation (shared secret — NO network call to Auth!)       │
│  • Fast token revocation check via Redis blacklist                           │
│  • Rate limiting (Redis sliding window, per-user + per-IP)                   │
│  • Request logging & correlation IDs                                         │
│  • Load balancing across service replicas                                    │
└────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌──────────┐┌─────────┐┌─────────┐┌──────────────┐
│  🔐     ││  👤     ││  💬      ││  🟢     ││  📁     ││  🔔           │
│  AUTH   ││  USER   ││  CHAT/   ││ PRESENCE││  MEDIA  ││ NOTIFICATION  │
│ SERVICE ││ SERVICE ││ MESSAGE  ││ SERVICE ││ SERVICE ││   SERVICE     │
│         ││         ││ SERVICE  ││         ││         ││              │
│ Port    ││ Port    ││ Port     ││ Port    ││ Port    ││ Port         │
│ 3001    ││ 3002    ││ 3003     ││ 3004    ││ 3005    ││ 3006         │
└────┬────┘└────┬────┘└────┬─────┘└────┬────┘└────┬────┘└──────┬───────┘
     │          │          │           │          │             │
     ▼          ▼          ▼           ▼          ▼             ▼
┌─────────┐┌─────────┐┌──────────┐┌─────────┐┌─────────┐┌──────────────┐
│PostgreSQL││PostgreSQL││ MongoDB  ││  Redis  ││  Local/ ││   MongoDB    │
│(Auth DB) ││(User DB) ││(Msg DB)  ││(Presence││   S3    ││(Notif DB)    │
│          ││          ││ SHARDED  ││  Store) ││         ││              │
└──────────┘└──────────┘└──────────┘└─────────┘└─────────┘└──────────────┘

                    ┌─────────────────────────────┐
                    │     🔴 REDIS CLUSTER         │
                    │                              │
                    │  • Event Bus (Pub/Sub)       │
                    │  • BullMQ Job Queues         │
                    │  • Connection Directory      │
                    │  • Session/Token Blacklist   │
                    │  • Rate Limit Counters       │
                    │  • Presence & Typing         │
                    └─────────────────────────────┘
```

### Why This Decomposition?

| Service | Scaling Reason | Traffic Pattern |
|---|---|---|
| **Auth Service** | Low traffic after login → 2-3 replicas | Users login once/day |
| **User Service** | Medium traffic → 3-5 replicas | Profile views, contact searches |
| **Chat/Message Service** | **Highest traffic** → 20-50+ replicas | Billions of messages/day |
| **Presence Service** | High traffic → 10-20 replicas | Heartbeat every 25s per user |
| **Media Service** | CPU-heavy → 5-10 replicas | Thumbnail generation, compression |
| **Notification Service** | Bursty → 5-10 replicas | Group message → 256 notifications |

---

## 🔄 Inter-Service Communication

### Synchronous (gRPC) — When response is needed immediately

Used only where one service **needs data from another** to complete a request:

```
┌────────────┐  gRPC: getUserProfile(userId) ┌────────────┐
│Chat Service │ ─────────────────────────▶   │User Service │
└────────────┘  ◀── { name, avatar } ──────  └────────────┘

┌────────────┐  gRPC: getGroupMembers(groupId) ┌────────────┐
│Chat Service │ ──────────────────────────▶     │User Service │
└────────────┘  ◀── { members[] } ────────     └────────────┘

Note: API Gateway does NOT call Auth Service for token validation.
It validates JWT statelessly using a shared secret (see next section).
```

### Asynchronous (Redis Pub/Sub + BullMQ) — Fire-and-forget events

Used for notifications, status updates, and background processing:

```
┌─────────────┐                        ┌──────────────────┐
│ Chat Service │── event: MESSAGE_SENT ─▶│   Redis Pub/Sub  │
└─────────────┘                        └────┬────┬────┬───┘
                                            │    │    │
                    ┌───────────────────────┘    │    └──────────────────┐
                    ▼                            ▼                      ▼
            ┌──────────────┐          ┌──────────────┐        ┌──────────────┐
            │  Notification │          │   Presence   │        │    Media     │
            │   Service    │          │   Service    │        │   Service    │
            │              │          │              │        │              │
            │ "Send push   │          │ "Update last │        │ "Process     │
            │  notification│          │  activity"   │        │  attachment" │
            │  to receiver"│          │              │        │              │
            └──────────────┘          └──────────────┘        └──────────────┘
```

### Complete Event Catalog

| Event Name | Publisher | Subscribers | Payload |
|---|---|---|---|
| `user.registered` | Auth Service | User Service, Notification Service | `{ userId, phone, username }` |
| `user.profile.updated` | User Service | Chat Service (cache invalidation) | `{ userId, changes }` |
| `message.sent` | Chat Service | Notification Service, Presence Service | `{ messageId, chatRoomId, sender, receivers[] }` |
| `message.delivered` | Chat Service | Notification Service | `{ messageId, userId }` |
| `message.read` | Chat Service | Notification Service | `{ messageId, userId }` |
| `group.member.added` | User Service | Chat Service, Notification Service | `{ groupId, userId, addedBy }` |
| `group.member.removed` | User Service | Chat Service, Notification Service | `{ groupId, userId }` |
| `media.uploaded` | Media Service | Chat Service | `{ mediaId, url, thumbnailUrl, type }` |
| `media.processing.done` | Media Service | Chat Service | `{ mediaId, processedUrl }` |
| `user.online` | Presence Service | Chat Service | `{ userId, isOnline, lastSeen }` |
| `notification.created` | Notification Service | — (pushes via WebSocket) | `{ userId, notification }` |

---

## 🔑 API Gateway — Stateless JWT Design

### The Problem With RPC-based Token Validation

If the API Gateway makes a network call to Auth Service for every request:
- At 1M requests/sec, that's 1M extra RPCs/sec
- Auth Service becomes a bottleneck
- Single point of failure

### Our Solution: Stateless Validation + Redis Blacklist

```
┌──────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY — Auth Flow                            │
│                                                                      │
│  1. Client sends: GET /api/v1/users/profile                         │
│     Header: Authorization: Bearer <jwt-token>                        │
│                                                                      │
│  2. Gateway extracts JWT from header                                 │
│                                                                      │
│  3. jwt.verify(token, SHARED_SECRET)  ← LOCAL, no network call!     │
│     • Checks signature (is it tampered?)                             │
│     • Checks expiry (is it expired?)                                 │
│     • Extracts: { userId, username, iat, exp }                       │
│     • Time: ~0.1ms                                                   │
│                                                                      │
│  4. Redis: GET blacklist:{tokenHash}  ← O(1) Redis lookup           │
│     • If exists → token was revoked (user logged out) → 401          │
│     • If not exists → token is valid → proceed                       │
│     • Time: ~0.5ms                                                   │
│                                                                      │
│  5. Forward request to target service with:                          │
│     Header: x-user-id: <userId>                                     │
│     Header: x-correlation-id: <uuid>                                │
│                                                                      │
│  Total auth overhead: ~0.6ms (vs ~5-10ms with RPC to Auth Service)  │
└──────────────────────────────────────────────────────────────────────┘
```

### How Logout/Revocation Works

```
User clicks "Logout":
1. Client calls: POST /api/v1/auth/logout
2. Auth Service receives the request
3. Auth Service adds token hash to Redis blacklist:
   SET blacklist:{sha256(token)} "revoked" EX {remaining_token_ttl}
4. Token TTL is 15 minutes → blacklist entry auto-expires after 15 min
5. After 15 min, the token itself is expired anyway → no blacklist needed

Result: Zero stale tokens, minimal Redis storage
```

### Why This Works

| Concern | Solution |
|---|---|
| **Tampering** | JWT signature verification (HMAC-SHA256) |
| **Expiry** | JWT `exp` claim checked locally |
| **Revocation** | Redis blacklist with auto-expiring TTL |
| **Horizontal scaling** | All Gateway replicas share the same secret + Redis |
| **Auth Service down?** | Gateway still works! Auth is only needed for login/register |

---

## 💬 Chat Service — Targeted Routing via Connection Directory

### The Problem With Broadcasting (Socket.io Redis Adapter)

The default Socket.io Redis Adapter broadcasts every message to ALL server instances:

```
Message from User A → broadcast to ALL 50 chat servers → only 1 server has User B

Result: 49 servers receive and discard the message = O(N) waste
At 100B messages/day with 50 servers = 4.9 TRILLION wasted broadcasts/day
```

### Our Solution: Redis Connection Directory (O(1) Routing)

This is how WhatsApp actually works (using Erlang process registry). We implement the same pattern with Redis:

```
Step 1: User connects → Register in Redis
─────────────────────────────────────────

User B connects to Chat Server 3:
  Redis: SET connection:userB "chat-server-3:3003" EX 60
  Redis: SADD user:sockets:userB "socketId_xyz"

User B's heartbeat refreshes TTL every 25s:
  Redis: EXPIRE connection:userB 60


Step 2: User A sends message to User B
─────────────────────────────────────────

┌──────────────┐                    ┌──────────────┐
│ Chat Server 1│                    │ Chat Server 3│
│ (User A)     │                    │ (User B)     │
└──────┬───────┘                    └──────▲───────┘
       │                                   │
       │ 1. User A sends message           │
       │    via WebSocket                  │
       │                                   │
       │ 2. Save to MongoDB               │
       │                                   │
       │ 3. Query Redis:                   │
       │    GET connection:userB           │
       │    → "chat-server-3:3003"         │
       │                                   │
       │ 4. Direct internal RPC            │
       │    to Chat Server 3:              │
       │    "Deliver to User B"  ──────────┤
       │                                   │
       │                           5. Chat Server 3
       │                              pushes via WebSocket
       │                              to User B
       │                                   │
       ▼                                   ▼
   ┌───────┐                          ┌───────┐
   │User A │                          │User B │
   │  ✓✓   │ ← delivery receipt ──── │ 📩    │
   └───────┘                          └───────┘


Step 3: User B is OFFLINE
─────────────────────────

GET connection:userB → null (key expired or doesn't exist)
→ Save message to MongoDB with status: { sent: Date }
→ When User B comes online later, fetch undelivered messages
→ Mark as delivered, send delivery receipt to User A
```

### Multi-Device Support

```
User B has 2 devices (phone + web):

Redis:
  connection:userB:device1 → "chat-server-3:3003"
  connection:userB:device2 → "chat-server-7:3003"
  SADD user:devices:userB "device1" "device2"

Message delivery:
  1. SMEMBERS user:devices:userB → ["device1", "device2"]
  2. GET connection:userB:device1 → "chat-server-3:3003"
  3. GET connection:userB:device2 → "chat-server-7:3003"
  4. Direct RPC to Chat Server 3 + Chat Server 7
  5. Both devices receive the message simultaneously
```

### Group Message Routing

```
Group "College Friends" has 200 members:

1. User A sends message to group
2. Chat Service fetches group members: gRPC → User Service → 200 member IDs
3. Pipeline Redis lookups:
   MGET connection:user1 connection:user2 ... connection:user200
4. Group by server:
   chat-server-1: [user3, user15, user88, ...]   → 1 batch RPC
   chat-server-2: [user7, user42, ...]            → 1 batch RPC
   chat-server-3: [user1, user99, ...]            → 1 batch RPC
   offline: [user5, user33, ...]                   → save for later
5. Each server delivers to its local WebSocket connections

Result: Instead of 200 individual RPCs, we make ~N RPCs where N = number of servers
(typically 5-10 RPCs for 200 members, not 200)
```

---

## 🗃️ Database Architecture

### Database Ownership Rule

> **No service directly accesses another service's database.** All cross-service data access goes through gRPC or events.

### Auth Service → PostgreSQL (auth_db)

```sql
CREATE TABLE auth_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(15) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     VARCHAR(500),
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

### User Service → PostgreSQL (user_db)

```sql
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY,   -- Same UUID from Auth Service
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    about           VARCHAR(500) DEFAULT 'Hey there! I am using WhatsApp',
    privacy_settings JSONB DEFAULT '{"last_seen":"everyone","avatar":"everyone","about":"everyone"}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    contact_id      UUID NOT NULL,
    nickname        VARCHAR(100),
    is_blocked      BOOLEAN DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_id)
);

CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    avatar_url      VARCHAR(500),
    created_by      UUID NOT NULL,
    max_members     INT DEFAULT 256,
    invite_link     VARCHAR(100) UNIQUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_contacts_contact ON contacts(contact_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

### Chat/Message Service → MongoDB (chat_db) — SHARDED

```javascript
// ChatRoom Collection
{
    _id: ObjectId,
    type: 'private' | 'group',
    participants: [UUID],
    groupId: UUID | null,
    lastMessage: {
        content: String,
        sender: UUID,
        timestamp: Date,
        type: String
    },
    createdAt: Date,
    updatedAt: Date
}
// Indexes: { participants: 1 }, { updatedAt: -1 }
// Shard Key: _id (hashed)

// Message Collection — PRIMARY DATA, SHARDED
{
    _id: ObjectId,
    chatRoomId: ObjectId,
    sender: UUID,
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact',
    content: {
        text: String,                // Encrypted (AES-256-GCM)
        mediaUrl: String,
        thumbnailUrl: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        duration: Number,            // For audio/video
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    },
    status: {
        sent: Date,
        delivered: [{ userId: UUID, timestamp: Date }],
        read: [{ userId: UUID, timestamp: Date }]
    },
    replyTo: ObjectId | null,
    forwarded: Boolean,
    starred: [UUID],
    deletedFor: [UUID],
    deletedForEveryone: Boolean,
    createdAt: Date,
    updatedAt: Date
}
// Indexes: { chatRoomId: 1, createdAt: -1 }, { sender: 1 }
// Shard Key: chatRoomId (hashed) — messages in same chat stay on same shard
```

### Notification Service → MongoDB (notification_db)

```javascript
{
    _id: ObjectId,
    userId: UUID,
    type: 'message' | 'group_invite' | 'group_update' | 'mention' | 'media',
    title: String,
    body: String,
    data: {
        chatRoomId: String,
        messageId: String,
        groupId: String,
        senderId: String,
        senderName: String
    },
    isRead: Boolean,
    isPushed: Boolean,
    createdAt: Date,
    expiresAt: Date               // TTL index — auto-delete after 30 days
}
// Indexes: { userId: 1, createdAt: -1 }, { expiresAt: 1 } (TTL)
```

### Presence Service → Redis (No Persistent DB!)

```
# Online Status (TTL 30s, refreshed by heartbeat every 25s)
presence:online:{userId}              → "1"

# Last Seen (no TTL — persists until next online)
presence:lastseen:{userId}            → "2026-04-08T15:30:00Z"

# Typing Indicators (TTL 3s — auto-expires)
presence:typing:{chatRoomId}:{userId} → "1"

# Connection Directory (TTL 60s, refreshed by heartbeat)
connection:{userId}                   → "chat-server-3:3003"
user:devices:{userId}                 → SET { "device1", "device2" }
connection:{userId}:{deviceId}        → "chat-server-7:3003"

# Unread Count Cache
presence:unread:{userId}:{chatRoomId} → count

# Token Blacklist (TTL = remaining token lifetime)
blacklist:{sha256(token)}             → "revoked"
```

---

## 📊 Database Sharding & Scaling

### MongoDB Sharding (Chunk-Based — Messages)

MongoDB uses **chunk-based sharding**, NOT simple modular hashing. This means adding new shards does NOT require rehashing all data.

#### How It Works

```
Step 1: Entire hash range is divided into CHUNKS (default 128MB each)
────────────────────────────────────────────────────────────────────

Hash range: [MinKey ─────────────────────────────── MaxKey]

Chunk 1        Chunk 2        Chunk 3        Chunk 4        Chunk 5
[min, -500)    [-500, -200)   [-200, 100)    [100, 400)     [400, max]


Step 2: Chunks are distributed across shards
────────────────────────────────────────────

Shard 0: [Chunk 1, Chunk 4]    → 2 chunks
Shard 1: [Chunk 2, Chunk 5]    → 2 chunks
Shard 2: [Chunk 3]             → 1 chunk


Step 3: Adding a new shard → Balancer migrates chunks
──────────────────────────────────────────────────────

Add Shard 3 (empty):
  Balancer sees uneven distribution
  Moves Chunk 4 from Shard 0 → Shard 3

Result:
  Shard 0: [Chunk 1]              ← 1 chunk
  Shard 1: [Chunk 2, Chunk 5]     ← 2 chunks
  Shard 2: [Chunk 3]              ← 1 chunk
  Shard 3: [Chunk 4]              ← 1 chunk ✅ Balanced!

Only Chunk 4's data was moved. NOT everything!
Zero downtime. Background migration.
```

#### Why NOT Simple Modular Hashing?

```
Simple hash: shard = hash(chatRoomId) % N

With 3 shards (N=3):
  hash("roomA") = 14  → 14 % 3 = 2 → Shard 2
  hash("roomB") = 7   → 7 % 3 = 1  → Shard 1

Add shard (N=4):
  hash("roomA") = 14  → 14 % 4 = 2 → Shard 2 ✅ Same
  hash("roomB") = 7   → 7 % 4 = 3  → Shard 3 ❌ WAS Shard 1!

Result: ~75% of ALL data needs to move. CATASTROPHIC at scale!
```

#### Consistent Hashing (Ring-Based) — Used by Redis, Cassandra, DynamoDB

An alternative to chunk-based: place servers and keys on a virtual ring.

```
                        0°
                   ┌────┴────┐
                  /           \
    key:D(300°) /  key:A(45°)  \
              /                  \
         270°│    Shard 0 (30°)  │ 90°
             │                   │
        Shard 3      RING       Shard 1
        (250°)                  (120°)
              \                /
                \ key:B(130°)/
                  \        /
                   └──┬───┘
                      │
                 Shard 2 (200°)
                     180°

key:A (45°)  → walk clockwise → Shard 1 (120°)
key:B (130°) → walk clockwise → Shard 2 (200°)
key:D (300°) → walk clockwise → Shard 0 (30°)  ← wraps around ring!

Adding a new shard at 160°:
  Only keys between 120° and 160° move to the new shard
  Everything else stays put!
  Result: Only ~1/N of data moves (with N shards)
```

#### Virtual Nodes (VNodes) — Solving Uneven Distribution

```
Problem: 4 physical servers on ring → uneven arc lengths

Solution: Each server gets 150+ virtual positions on the ring

  S0-v1, S0-v2, S0-v3, ... S0-v150  (150 vnodes for Shard 0)
  S1-v1, S1-v2, S1-v3, ... S1-v150  (150 vnodes for Shard 1)
  
  600 total points on ring → nearly perfect distribution
  Each server owns many tiny arcs instead of one big arc
```

#### Comparison

| Approach | Data Moved on Add | Downtime | Used By |
|---|---|---|---|
| Simple hash `% N` | ~75% | Hours/Days | Nobody serious |
| Consistent hashing (ring) | ~1/N (~25% with 4 nodes) | Minutes | Redis, Cassandra, DynamoDB |
| Consistent hashing + vnodes | ~1/N, evenly spread | Minutes | Cassandra, DynamoDB |
| **Chunk-based (MongoDB)** | **Only necessary chunks** | **Zero downtime** | **MongoDB** ✅ |

#### Our MongoDB Sharding Setup

```bash
# Enable sharding on database
sh.enableSharding("chat_db")

# Shard the messages collection by chatRoomId (hashed)
sh.shardCollection("chat_db.messages", { chatRoomId: "hashed" })

# Adding a new shard when load increases — ONE COMMAND
sh.addShard("shard4-rs/shard4-host:27018")
# MongoDB balancer automatically migrates chunks in the background
# Zero downtime. Zero code changes.
```

#### Each Shard is a Replica Set (Read/Write Split)

```
                    Shard 1 (Replica Set)
                    ┌──────────────────────┐
                    │                      │
    ALL Writes ────▶│  PRIMARY             │
                    │                      │
                    └──────┬───────┬───────┘
                           │       │
                    ┌──────▼──┐ ┌──▼──────┐
    ALL Reads ─────▶│SECONDARY│ │SECONDARY│◀──── ALL Reads
                    │(Replica)│ │(Replica) │
                    └─────────┘ └──────────┘

Read Preference: "secondaryPreferred"
→ Reads go to replicas → frees up primary for writes
```

### PostgreSQL Scaling (Auth DB & User DB)

PostgreSQL doesn't shard natively like MongoDB. We use a layered strategy:

#### Layer 1: Primary + Read Replicas

```
                    ┌─────────────────────┐
    ALL Writes ────▶│  PRIMARY (Master)   │
                    └──────┬─────┬────────┘
                           │     │  (Streaming Replication)
                    ┌──────▼─┐ ┌─▼───────┐
    ALL Reads ─────▶│Replica │ │ Replica │◀───── ALL Reads
                    │   1    │ │   2     │
                    └────────┘ └─────────┘

Why this works:
  Auth: Write ratio ~1:100 (register once, validate token 100x)
  Users: Write ratio ~1:50 (update profile rarely, read constantly)
```

#### Layer 2: Connection Pooling (PgBouncer)

```
20 service replicas × 10 connections = 200 connections
PostgreSQL max: ~500 before degradation

Solution:
  Service replicas ──200──▶ PgBouncer ──20──▶ PostgreSQL
  PgBouncer multiplexes 200 incoming → 20 actual connections
```

#### Layer 3: Table Partitioning (Contacts Table)

When contacts table reaches billions of rows:

```sql
CREATE TABLE contacts (
    id UUID, user_id UUID NOT NULL, contact_id UUID NOT NULL,
    nickname VARCHAR(100), is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY HASH (user_id);

-- 16 partitions → queries scan 1/16th of data
CREATE TABLE contacts_p0  PARTITION OF contacts FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE contacts_p1  PARTITION OF contacts FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... up to contacts_p15
```

#### Application-Level Read/Write Splitting (Actual Code)

```javascript
// Sequelize configuration with read replicas
const sequelize = new Sequelize({
  dialect: 'postgres',
  replication: {
    write: {
      host: 'pg-primary.internal',
      username: 'app',
      password: process.env.DB_PASSWORD
    },
    read: [
      { host: 'pg-replica-1.internal', username: 'app', password: process.env.DB_PASSWORD },
      { host: 'pg-replica-2.internal', username: 'app', password: process.env.DB_PASSWORD }
    ]
  },
  pool: { max: 20, min: 5, idle: 10000 }
});

// Mongoose (MongoDB) read preference
mongoose.connect(MONGO_URI, {
  readPreference: 'secondaryPreferred'  // Reads go to replicas
});
```

---

## 🔴 Redis Cluster & Hash Slots

Redis Cluster automatically distributes data across nodes using **16384 hash slots**:

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Redis Node 1 │  │  Redis Node 2 │  │  Redis Node 3 │
│ Slots 0-5460  │  │ Slots 5461-   │  │ Slots 10923-  │
│               │  │     10922     │  │     16383     │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│  Replica 1    │  │  Replica 2    │  │  Replica 3    │
│  (failover)   │  │  (failover)   │  │  (failover)   │
└───────────────┘  └───────────────┘  └───────────────┘

Key routing:
  CRC16("connection:userA") % 16384 = 2341 → Slot 2341 → Node 1
  CRC16("connection:userD") % 16384 = 12044 → Slot 12044 → Node 3

Adding Node 4:
  Redis re-distributes some slots to Node 4 automatically
  Uses consistent hashing internally
```

---

## 🔌 REST API Endpoints

### API Gateway Route Mapping

```javascript
const ROUTE_MAP = {
    '/api/v1/auth/**':          'http://auth-service:3001',
    '/api/v1/users/**':         'http://user-service:3002',
    '/api/v1/contacts/**':      'http://user-service:3002',
    '/api/v1/groups/**':        'http://user-service:3002',
    '/api/v1/chats/**':         'http://chat-service:3003',
    '/api/v1/messages/**':      'http://chat-service:3003',
    '/api/v1/presence/**':      'http://presence-service:3004',
    '/api/v1/media/**':         'http://media-service:3005',
    '/api/v1/notifications/**': 'http://notification-service:3006',
    '/socket.io/**':            'ws://chat-service:3003',
};
```

### Auth Service (Port 3001)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout + blacklist token |

### User Service (Port 3002)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users/profile` | Get own profile |
| PUT | `/api/v1/users/profile` | Update profile |
| GET | `/api/v1/users/search?q=` | Search users |
| PUT | `/api/v1/users/privacy` | Update privacy settings |
| POST | `/api/v1/users/avatar` | Upload avatar |
| GET | `/api/v1/contacts` | Get all contacts |
| POST | `/api/v1/contacts` | Add contact |
| DELETE | `/api/v1/contacts/:id` | Remove contact |
| POST | `/api/v1/contacts/:id/block` | Block contact |
| POST | `/api/v1/groups` | Create group |
| GET | `/api/v1/groups/:id` | Get group info |
| PUT | `/api/v1/groups/:id` | Update group (admin) |
| POST | `/api/v1/groups/:id/members` | Add members |
| DELETE | `/api/v1/groups/:id/members/:uid` | Remove member |
| POST | `/api/v1/groups/:id/leave` | Leave group |

### Chat/Message Service (Port 3003)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/chats` | Get all chat rooms |
| POST | `/api/v1/chats` | Create/get private chat |
| GET | `/api/v1/chats/:id/messages` | Get messages (cursor-paginated) |
| DELETE | `/api/v1/chats/:id` | Clear chat |
| POST | `/api/v1/messages` | Send message (REST fallback) |
| DELETE | `/api/v1/messages/:id` | Delete message |
| PUT | `/api/v1/messages/:id/star` | Star/unstar |
| GET | `/api/v1/messages/search?q=` | Search messages |

### Presence Service (Port 3004)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/presence/:userId` | Get user online status |
| GET | `/api/v1/presence/bulk` | Get multiple users' status |
| POST | `/api/v1/presence/heartbeat` | Refresh online status |

### Media Service (Port 3005)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/media/upload` | Upload media file |
| GET | `/api/v1/media/:id` | Download/stream media |
| GET | `/api/v1/media/:id/thumbnail` | Get thumbnail |

### Notification Service (Port 3006)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/notifications` | Get notifications (paginated) |
| PUT | `/api/v1/notifications/:id/read` | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Mark all as read |
| GET | `/api/v1/notifications/unread-count` | Get unread count |

---

## 🔌 Socket.io Events (Chat Service)

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `message:send` | `{ chatRoomId, type, content }` | Send a message |
| `message:delivered` | `{ messageId }` | Confirm delivery |
| `message:read` | `{ chatRoomId, messageIds[] }` | Confirm read |
| `message:delete` | `{ messageId, deleteType }` | Delete message |
| `typing:start` | `{ chatRoomId }` | Started typing |
| `typing:stop` | `{ chatRoomId }` | Stopped typing |
| `heartbeat` | `{}` | Keep-alive for presence + connection directory |
| `chat:join` | `{ chatRoomId }` | Join chat room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `message:receive` | `{ message }` | New incoming message |
| `message:status` | `{ messageId, status, userId }` | Delivery/read receipt |
| `message:deleted` | `{ messageId, deleteType }` | Message deleted |
| `typing:update` | `{ chatRoomId, userId, isTyping }` | Typing indicator |
| `user:status` | `{ userId, isOnline, lastSeen }` | Online/offline |
| `notification:new` | `{ notification }` | New notification |
| `group:updated` | `{ groupId, changes }` | Group info changed |

---

## 🔐 Security

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt (12 salt rounds) |
| Auth Tokens | JWT (access 15min + refresh 7days) |
| Token Validation | Stateless at API Gateway (shared secret) |
| Token Revocation | Redis blacklist with auto-expiring TTL |
| Message Encryption | AES-256-GCM at rest in MongoDB |
| Inter-Service Auth | Internal network (Docker) + shared secrets |
| Rate Limiting | Redis sliding window (per-user + per-IP) |
| Input Validation | Joi schema validation per service |
| File Upload | Multer with type/size restrictions |
| CORS | Whitelist-based origin validation |
| Helmet | HTTP security headers on all services |
| XSS Protection | DOMPurify for message content |
| Request Tracing | Correlation IDs across all services |

### Rate Limiting Strategy

```
# Per-User Limits (enforced at API Gateway)
message:send     → 100 messages/minute
media:upload     → 10 uploads/minute
auth:login       → 5 attempts/15 minutes
user:search      → 30 searches/minute
general:api      → 1000 requests/minute

# Per-IP Limits (DDoS protection)
global           → 5000 requests/minute per IP
```

---

## ⚡ Scaling Strategy

### Per-Service Scaling

| Service | Replicas | Why |
|---|---|---|
| API Gateway | 3-5 | Stateless → scale horizontally behind LB |
| Auth Service | 2-3 | Low after initial login spike |
| User Service | 3-5 | Medium: profile reads, contact lookups |
| Chat Service | **20-50+** | **HIGHEST**: message throughput + WebSocket |
| Presence Service | 10-20 | High: heartbeats every 25s per user |
| Media Service | 5-10 | CPU-bound: image/video processing |
| Notification Service | 5-10 | Bursty: group msg → N notifications |

### Complete Production Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FULL SYSTEM AT SCALE                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SERVICES (Kubernetes / Docker Swarm)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ API Gateway  │ │Auth Service │ │User Service │                   │
│  │ ×5 replicas  │ │ ×3 replicas │ │ ×5 replicas │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐                  │
│  │Chat Service │ │Presence Svc │ │Media Service │                   │
│  │ ×50 replicas│ │ ×20 replicas│ │ ×10 replicas │                   │
│  └─────────────┘ └─────────────┘ └──────────────┘                   │
│  ┌──────────────┐                                                    │
│  │Notification  │                                                    │
│  │ ×10 replicas │                                                    │
│  └──────────────┘                                                    │
│                                                                      │
│  DATABASES                                                           │
│  ┌────────────────┐  ┌────────────────┐                             │
│  │PostgreSQL(Auth)│  │PostgreSQL(User)│                              │
│  │1 Primary+2 Rep │  │1 Primary+2 Rep │  + PgBouncer pools          │
│  └────────────────┘  └────────────────┘                             │
│                                                                      │
│  ┌─────────────────────────────────────────────┐                    │
│  │ MongoDB Sharded Cluster (Messages)           │                    │
│  │ 3 mongos + 3 config + 6 shards × 3 = 24     │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                      │
│  ┌────────────────┐                                                  │
│  │MongoDB (Notif) │                                                  │
│  │ 1P + 2S        │                                                  │
│  └────────────────┘                                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────┐                    │
│  │ Redis Cluster (6 nodes: 3 primary + 3 rep)  │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                      │
│  GRAND TOTAL: ~130+ containers at full scale                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Resume Impact — Interview Talking Points

### Architecture
> "I decomposed the system into 7 microservices based on independent scaling requirements. The Chat Service handles the highest throughput at 50+ replicas, while Auth Service only needs 2-3."

### Stateless JWT
> "I eliminated the Auth Service bottleneck by using stateless JWT validation at the API Gateway. Token revocation is handled via a Redis blacklist with auto-expiring TTLs matching the token lifetime."

### Targeted Routing
> "Instead of broadcasting messages to all servers via Socket.io Redis Adapter (O(N)), I implemented a Redis Connection Directory for O(1) targeted routing — similar to WhatsApp's Erlang process registry."

### Database Design
> "Each service owns its database. MongoDB is sharded by chatRoomId using chunk-based sharding for zero-downtime scaling. PostgreSQL uses read replicas for the 1:100 write-to-read ratio."

### Event-Driven
> "Services communicate asynchronously via Redis Pub/Sub. When a message is sent, the Notification Service and Presence Service react independently without blocking the message delivery path."
