# 🏗️ WhatsApp Clone — Microservices Architecture

## Overview
A **production-grade, microservices-based** WhatsApp clone where **each service scales independently**. Designed to handle billions of connections with proper service boundaries, async event-driven communication, and isolated databases.

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Runtime** | Node.js (v20+) | Event-driven, non-blocking I/O — perfect for real-time chat |
| **API Gateway** | Express.js (custom gateway) | Route requests to correct microservice, JWT validation, rate limiting |
| **Inter-Service (Sync)** | gRPC | Low-latency, type-safe, binary protocol for service-to-service calls |
| **Inter-Service (Async)** | Redis Pub/Sub + BullMQ | Event-driven communication, job queues for background tasks |
| **Real-time** | Socket.io + Redis Adapter | WebSocket with horizontal scaling across chat service replicas |
| **Auth DB** | PostgreSQL | ACID-compliant user credentials and sessions |
| **User DB** | PostgreSQL | Structured relational data (profiles, contacts, groups) |
| **Message DB** | MongoDB | Flexible schema, fast writes, time-series queries for chat history |
| **Notification DB** | MongoDB | Flexible notification payload storage |
| **Cache / Event Bus** | Redis Cluster | Presence, typing, session cache, pub/sub event bus, rate limiting |
| **File Storage** | Local (dev) / S3-ready | Media uploads with abstraction layer |
| **API Docs** | Swagger (OpenAPI 3.0) | Per-service API documentation |
| **Testing** | Jest + Supertest + Socket.io Client | Unit, integration, and WebSocket tests |
| **Frontend** | React (Vite) | Simple, fast, component-based UI |
| **Containerization** | Docker + Docker Compose | Each service gets its own container |
| **Service Discovery** | Docker DNS (dev) / Consul (prod) | Services find each other by name |

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
│  • Stateless JWT validation (Shared secret)                                  │
│  • Fast token revocation check via Redis Blacklist                           │
│  • Rate limiting (Redis sliding window)                                      │
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
│          ││          ││          ││  Store) ││         ││              │
└──────────┘└──────────┘└──────────┘└─────────┘└─────────┘└──────────────┘

                    ┌─────────────────────────────┐
                    │     🔴 REDIS CLUSTER         │
                    │                              │
                    │  • Event Bus (Pub/Sub)       │
                    │  • BullMQ Job Queues         │
                    │  • Socket.io Adapter         │
                    │  • Session Cache             │
                    │  • Rate Limit Counters       │
                    └─────────────────────────────┘
```

### Why This Decomposition?

| Service | Scaling Reason | Example |
|---|---|---|
| **Auth Service** | Low traffic after login. Scale to 2 replicas. | Users login once a day |
| **User Service** | Medium traffic. Scale to 3-5 replicas. | Profile views, contact searches |
| **Chat/Message Service** | **Highest traffic**. Scale to 20+ replicas. | Billions of messages/day |
| **Presence Service** | High traffic (heartbeats). Scale to 10+ replicas. | Every user sends heartbeat every 25s |
| **Media Service** | CPU-heavy (image processing). Scale with more CPU. | Thumbnail generation, compression |
| **Notification Service** | Async, bursty. Scale workers independently. | Group messages → 256 notifications |

---

## 🔄 Inter-Service Communication

### Synchronous (gRPC) — When response is needed immediately

```
┌────────────┐  gRPC: getUserProfile(userId) ┌────────────┐
│Chat Service │ ─────────────────────────▶   │User Service │
└────────────┘  ◀── { name, avatar } ──────  └────────────┘

┌────────────┐  gRPC: getGroupMembers(groupId) ┌────────────┐
│Chat Service │ ──────────────────────────▶     │User Service │
└────────────┘  ◀── { members[] } ────────     └────────────┘

*Note: API Gateway validates JWT statelessly using a shared secret and 
checks for revocation in Redis, removing the network hop to Auth!*
```

### Asynchronous (Redis Pub/Sub + BullMQ) — Fire-and-forget events

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

### Event Catalog

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
| `notification.created` | Notification Service | — (pushes to client via WebSocket) | `{ userId, notification }` |

---

## 📁 Microservices Project Structure

```
Whatsapp_clone/
├── services/                           # All microservices
│   ├── api-gateway/                    # 🔀 API Gateway (Port 3000)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.js
│   │   │   │   ├── redis.js
│   │   │   │   └── services.js         # Service registry (URLs/ports)
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js   # Stateless JWT verify + Redis blacklist
│   │   │   │   ├── rateLimiter.js      # Redis sliding window
│   │   │   │   ├── correlationId.js    # Request tracing
│   │   │   │   ├── requestLogger.js    # Winston structured logging
│   │   │   │   └── errorHandler.js
│   │   │   ├── proxy/
│   │   │   │   ├── httpProxy.js        # Proxy REST to services
│   │   │   │   └── wsProxy.js          # Proxy WebSocket to Chat Service
│   │   │   ├── routes/
│   │   │   │   └── index.js            # Route mapping → service
│   │   │   └── app.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── auth-service/                   # 🔐 Auth Service (Port 3001)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js         # PostgreSQL connection
│   │   │   │   ├── redis.js            # Session store
│   │   │   │   └── env.js
│   │   │   ├── models/
│   │   │   │   └── User.js             # Auth-specific user model (credentials only)
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.js
│   │   │   ├── services/
│   │   │   │   ├── auth.service.js
│   │   │   │   └── token.service.js    # JWT create/verify/refresh
│   │   │   ├── grpc/
│   │   │   │   ├── server.js           # gRPC server (validateToken, etc.)
│   │   │   │   └── auth.proto          # Protocol buffer definitions
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.js
│   │   │   ├── middleware/
│   │   │   │   └── validator.js
│   │   │   ├── events/
│   │   │   │   └── publisher.js        # Publishes: user.registered
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── user-service/                   # 👤 User Service (Port 3002)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js         # PostgreSQL connection
│   │   │   │   ├── redis.js
│   │   │   │   └── env.js
│   │   │   ├── models/
│   │   │   │   ├── UserProfile.js      # Full profile data
│   │   │   │   ├── Contact.js
│   │   │   │   ├── Group.js
│   │   │   │   └── GroupMember.js
│   │   │   ├── controllers/
│   │   │   │   ├── user.controller.js
│   │   │   │   ├── contact.controller.js
│   │   │   │   └── group.controller.js
│   │   │   ├── services/
│   │   │   │   ├── user.service.js
│   │   │   │   ├── contact.service.js
│   │   │   │   └── group.service.js
│   │   │   ├── grpc/
│   │   │   │   ├── server.js           # gRPC: getUserProfile, getGroupMembers
│   │   │   │   └── user.proto
│   │   │   ├── routes/
│   │   │   │   ├── user.routes.js
│   │   │   │   ├── contact.routes.js
│   │   │   │   └── group.routes.js
│   │   │   ├── events/
│   │   │   │   ├── publisher.js        # Publishes: user.profile.updated, group.member.*
│   │   │   │   └── subscriber.js       # Listens: user.registered
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── chat-service/                   # 💬 Chat/Message Service (Port 3003)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js         # MongoDB connection
│   │   │   │   ├── redis.js            # Socket.io adapter + cache
│   │   │   │   └── env.js
│   │   │   ├── models/
│   │   │   │   ├── ChatRoom.js         # Mongoose model
│   │   │   │   └── Message.js          # Mongoose model
│   │   │   ├── controllers/
│   │   │   │   ├── chat.controller.js
│   │   │   │   └── message.controller.js
│   │   │   ├── services/
│   │   │   │   ├── chat.service.js
│   │   │   │   ├── message.service.js
│   │   │   │   └── encryption.service.js  # AES-256 message encryption at rest
│   │   │   ├── socket/
│   │   │   │   ├── index.js            # Socket.io init + Redis adapter
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── message.handler.js
│   │   │   │   │   ├── typing.handler.js
│   │   │   │   │   └── chatRoom.handler.js
│   │   │   │   └── middleware/
│   │   │   │       └── socketAuth.js   # Validates JWT via Auth Service gRPC
│   │   │   ├── grpc/
│   │   │   │   ├── client.js           # gRPC clients (Auth, User, Presence)
│   │   │   │   └── chat.proto
│   │   │   ├── routes/
│   │   │   │   ├── chat.routes.js
│   │   │   │   └── message.routes.js
│   │   │   ├── events/
│   │   │   │   ├── publisher.js        # Publishes: message.sent, message.delivered, message.read
│   │   │   │   └── subscriber.js       # Listens: media.uploaded, user.online, group.member.*
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── presence-service/               # 🟢 Presence Service (Port 3004)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── redis.js            # Primary data store (Redis only!)
│   │   │   │   └── env.js
│   │   │   ├── controllers/
│   │   │   │   └── presence.controller.js
│   │   │   ├── services/
│   │   │   │   ├── presence.service.js   # Online/offline, last seen
│   │   │   │   └── typing.service.js     # Typing indicators
│   │   │   ├── routes/
│   │   │   │   └── presence.routes.js
│   │   │   ├── events/
│   │   │   │   ├── publisher.js        # Publishes: user.online, user.offline
│   │   │   │   └── subscriber.js       # Listens: message.sent (update last activity)
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── media-service/                  # 📁 Media Service (Port 3005)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── storage.js          # Local/S3 abstraction
│   │   │   │   ├── redis.js
│   │   │   │   └── env.js
│   │   │   ├── controllers/
│   │   │   │   └── media.controller.js
│   │   │   ├── services/
│   │   │   │   ├── upload.service.js
│   │   │   │   ├── download.service.js
│   │   │   │   └── processor.service.js  # Sharp: thumbnails, compression
│   │   │   ├── workers/
│   │   │   │   └── media.worker.js     # BullMQ worker for async processing
│   │   │   ├── routes/
│   │   │   │   └── media.routes.js
│   │   │   ├── middleware/
│   │   │   │   └── upload.js           # Multer config
│   │   │   ├── events/
│   │   │   │   └── publisher.js        # Publishes: media.uploaded, media.processing.done
│   │   │   └── app.js
│   │   ├── uploads/                    # Local file storage (dev)
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── notification-service/           # 🔔 Notification Service (Port 3006)
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.js         # MongoDB connection
│       │   │   ├── redis.js
│       │   │   └── env.js
│       │   ├── models/
│       │   │   └── Notification.js     # Mongoose model
│       │   ├── controllers/
│       │   │   └── notification.controller.js
│       │   ├── services/
│       │   │   ├── notification.service.js
│       │   │   └── push.service.js     # Web push notifications
│       │   ├── workers/
│       │   │   └── notification.worker.js  # BullMQ worker
│       │   ├── routes/
│       │   │   └── notification.routes.js
│       │   ├── events/
│       │   │   └── subscriber.js       # Listens: message.sent, group.member.*, user.registered
│       │   └── app.js
│       ├── tests/
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
│
├── shared/                             # 📦 Shared Libraries (npm workspace)
│   ├── proto/                          # gRPC Protocol Buffers
│   │   ├── auth.proto
│   │   ├── user.proto
│   │   └── chat.proto
│   ├── utils/
│   │   ├── logger.js                   # Shared Winston logger config
│   │   ├── encryption.js              # AES-256 encrypt/decrypt
│   │   ├── responseFormatter.js
│   │   └── correlationId.js
│   ├── events/
│   │   ├── eventBus.js                # Redis Pub/Sub wrapper
│   │   ├── eventNames.js             # Central event name constants
│   │   └── eventSchemas.js           # Joi schemas for event payloads
│   ├── middleware/
│   │   ├── errorHandler.js            # Shared error handling
│   │   └── validator.js               # Shared Joi validation
│   └── package.json
│
├── client/                             # React Frontend (Simple)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatList.jsx
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   └── TypingIndicator.jsx
│   │   │   ├── Group/
│   │   │   │   ├── CreateGroup.jsx
│   │   │   │   └── GroupInfo.jsx
│   │   │   ├── Profile/
│   │   │   │   └── UserProfile.jsx
│   │   │   └── Common/
│   │   │       ├── Avatar.jsx
│   │   │       ├── StatusBadge.jsx
│   │   │       └── NotificationBadge.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ChatPage.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   ├── useAuth.js
│   │   │   └── useChat.js
│   │   ├── services/
│   │   │   ├── api.js                  # Axios instance → API Gateway
│   │   │   └── socket.js              # Socket.io client
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml                  # ALL services + databases
├── docker-compose.dev.yml              # Dev overrides (volumes, hot reload)
├── nginx/
│   └── nginx.conf                      # Load balancer config
├── docs/                               # Architecture documentation
│   ├── ARCHITECTURE.md                # System overview
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── SOCKET_EVENTS.md
│   ├── INTER_SERVICE_COMMUNICATION.md
│   └── SCALING_STRATEGY.md
├── package.json                        # Root: npm workspaces
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗃️ Database Ownership (Each Service Owns Its Data)

> **Rule:** No service directly accesses another service's database. All cross-service data access goes through gRPC or events.

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

-- Index for fast token lookup
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

### User Service → PostgreSQL (user_db)

```sql
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY,  -- Same UUID from Auth Service
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    about           VARCHAR(500) DEFAULT 'Hey there! I am using WhatsApp',
    privacy_settings JSONB DEFAULT '{"last_seen": "everyone", "avatar": "everyone", "about": "everyone"}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,  -- References user_profiles.id
    contact_id      UUID NOT NULL,  -- References user_profiles.id
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

-- Indexes for fast lookups
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

### Chat/Message Service → MongoDB (chat_db)

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
// Shard Key: _id (hashed) for horizontal distribution

// Message Collection
{
    _id: ObjectId,
    chatRoomId: ObjectId,
    sender: UUID,
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact',
    content: {
        text: String,              // Encrypted (AES-256-GCM)
        mediaUrl: String,
        thumbnailUrl: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        duration: Number,
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
    expiresAt: Date              // TTL index for auto-cleanup
}
// Indexes: { userId: 1, createdAt: -1 }, { expiresAt: 1 } (TTL)
```

### Presence Service → Redis (No persistent DB!)

```
# Online Status (TTL 30s, refreshed by heartbeat)
presence:online:{userId}              → "1"

# Last Seen (persistent — no TTL)
presence:lastseen:{userId}            → "2026-04-06T17:30:00Z"

# Typing Indicators (TTL 3s)
presence:typing:{chatRoomId}:{userId} → "1"

# User Socket Mapping (for multi-device)
presence:sockets:{userId}            → SET { socketId1, socketId2 }

# Unread Count Cache
presence:unread:{userId}:{chatRoomId} → count
```

---

## 🔌 API Routes (Through API Gateway)

### API Gateway Route Mapping

```javascript
// API Gateway routes → Service forwarding
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
    '/socket.io/**':            'ws://chat-service:3003',  // WebSocket proxy
};
```

### Auth Service APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout + invalidate token |

### User Service APIs
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

### Chat/Message Service APIs
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

### Presence Service APIs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/presence/:userId` | Get user online status |
| GET | `/api/v1/presence/bulk` | Get multiple users' status |
| POST | `/api/v1/presence/heartbeat` | Refresh online status |

### Media Service APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/media/upload` | Upload media file |
| GET | `/api/v1/media/:id` | Download/stream media |
| GET | `/api/v1/media/:id/thumbnail` | Get thumbnail |

### Notification Service APIs
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
| `heartbeat` | `{}` | Keep-alive (forwarded to Presence Service) |
| `chat:join` | `{ chatRoomId }` | Join chat room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `message:receive` | `{ message }` | New incoming message |
| `message:status` | `{ messageId, status, userId }` | Delivery/read receipt |
| `message:deleted` | `{ messageId, deleteType }` | Message deleted |
| `typing:update` | `{ chatRoomId, userId, isTyping }` | Typing indicator |
| `user:status` | `{ userId, isOnline, lastSeen }` | Online/offline update |
| `notification:new` | `{ notification }` | New notification |
| `group:updated` | `{ groupId, changes }` | Group info changed |

---

## ⚡ Scaling Strategy (Designed for Billions)

### Per-Service Scaling

```
┌───────────────┬──────────┬─────────────────────────────────────────────┐
│ Service       │ Replicas │ Scaling Strategy                            │
├───────────────┼──────────┼─────────────────────────────────────────────┤
│ API Gateway   │ 3-5      │ Stateless → scale horizontally behind LB   │
│ Auth Service  │ 2-3      │ Low after initial login spike               │
│ User Service  │ 3-5      │ Medium: profile reads, contact lookups      │
│ Chat Service  │ 20-50+   │ HIGHEST: message throughput, Socket.io      │
│ Presence Svc  │ 10-20    │ High: heartbeats every 25s per user         │
│ Media Service │ 5-10     │ CPU-bound: image/video processing           │
│ Notification  │ 5-10     │ Bursty: group msg → N notifications        │
└───────────────┴──────────┴─────────────────────────────────────────────┘
```

### Chat Service Horizontal Scaling (Targeted Routing via Erlang/WhatsApp Model)

Rather than broadcasting every message to all servers (which melts down Redis at scale), we use a **Session Directory in Redis**:

```
                    ┌──────────────────────┐
                    │    API Gateway        │
                    │  (WebSocket Proxy)    │
                    └────┬────┬────┬────┬───┘
                         │    │    │    │
              ┌──────────▼┐  ▼┐  ┌▼┐  ┌▼──────────┐
              │Chat Svc 1 │  ││  │ │  │Chat Svc 3 │
              │ Socket.io │  ││  │ │  │ Socket.io │
              └─────┬─────┘──┘┘──┘ └──┘─────┬──────┘
                    │                       │
                    └───────┬───────────────┘
                    ┌───────▼───────┐
                    │   Redis       │
                    │  Connection   │
                    │  Directory    │
                    └───────────────┘

User A (on Chat Svc 1) sends message to User B (on Chat Svc 3):
1. Chat Svc 1 receives message (WebSocket) and saves to MongoDB.
2. Chat Svc 1 queries Redis: `GET connection:userB`
3. Redis replies: `"chat-service-3:3003"`
4. Chat Svc 1 makes a direct internal RPC call to Chat Svc 3: "Deliver this to User B".
5. Chat Svc 3 delivers the message via its local WebSocket connection.
This provides O(1) routing instead of O(N) broadcasting!
```

### Database Scaling

| Database | Strategy |
|---|---|
| **MongoDB (Messages)** | Shard by `chatRoomId` (hashed) — keeps chat messages co-located |
| **PostgreSQL (Auth)** | Read replicas for token validation (hot path) |
| **PostgreSQL (Users)** | Read replicas for profile lookups, partition contacts by user_id |
| **Redis** | Redis Cluster (6+ nodes) — automatic sharding |

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

## 🔐 Security

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt (12 salt rounds) |
| Auth Tokens | JWT (access 15min + refresh 7days) |
| Message Encryption | AES-256-GCM at rest in MongoDB |
| Inter-Service Auth | Internal shared secret / mTLS (production) |
| Rate Limiting | Redis sliding window (per-user + per-IP) |
| Input Validation | Joi schema validation per service |
| File Upload | Multer with type/size restrictions |
| CORS | Whitelist-based origin validation |
| Helmet | HTTP security headers on all services |
| XSS Protection | DOMPurify for message content |
| Request Tracing | Correlation IDs across all services |

---

## 🐳 Docker Compose

```yaml
# docker-compose.yml overview
services:
  # Infrastructure
  postgres-auth:      # Auth Service DB
  postgres-user:      # User Service DB
  mongodb:            # Chat + Notification DB
  redis:              # Event bus, cache, presence, Socket.io adapter

  # Application Services
  api-gateway:        # Port 3000
  auth-service:       # Port 3001
  user-service:       # Port 3002
  chat-service:       # Port 3003
  presence-service:   # Port 3004
  media-service:      # Port 3005
  notification-service: # Port 3006

  # Frontend
  client:             # Port 5173

  # Load Balancer (optional, for multi-replica demo)
  nginx:              # Port 80
```

---

## 🚀 Implementation Phases

### Phase 1: Project Scaffolding ⏱️ ~2 hours
- [ ] Set up npm workspaces (monorepo)
- [ ] Create shared library (logger, error handler, event bus, response formatter)
- [ ] Set up Docker Compose (PostgreSQL × 2, MongoDB, Redis)
- [ ] Create base Express app template for services
- [ ] Environment config with validation (dotenv + Joi)
- [ ] .gitignore, .env.example files

### Phase 2: Auth Service ⏱️ ~3 hours
- [ ] PostgreSQL: auth_users, refresh_tokens tables
- [ ] Register, Login, Refresh, Logout APIs
- [ ] JWT access/refresh token flow
- [ ] bcrypt password hashing
- [ ] gRPC server: validateToken, getUserId
- [ ] Redis session cache
- [ ] Publish `user.registered` event
- [ ] Swagger docs
- [ ] Unit + integration tests

### Phase 3: API Gateway ⏱️ ~3 hours
- [ ] Route-based HTTP proxy to services
- [ ] WebSocket proxy to Chat Service
- [ ] JWT validation via Auth Service gRPC
- [ ] Redis rate limiting middleware
- [ ] Correlation ID injection
- [ ] Request logging (Winston)
- [ ] Global error handling

### Phase 4: User Service ⏱️ ~3 hours
- [ ] PostgreSQL: user_profiles, contacts, groups, group_members
- [ ] Subscribe to `user.registered` → create profile
- [ ] Profile CRUD, avatar upload
- [ ] Contact management (add, remove, block)
- [ ] Group CRUD + member management
- [ ] gRPC server: getUserProfile, getGroupMembers
- [ ] Swagger docs
- [ ] Tests

### Phase 5: Chat/Message Service (Core) ⏱️ ~5 hours
- [ ] MongoDB: ChatRoom, Message collections with indexes
- [ ] Socket.io setup with Redis Adapter
- [ ] WebSocket auth via Auth Service gRPC
- [ ] Send/receive all message types
- [ ] Message status tracking (sent → delivered → read)
- [ ] Chat room management (create, list, paginated messages)
- [ ] AES-256-GCM message encryption at rest
- [ ] Publish events: message.sent, message.delivered, message.read
- [ ] Subscribe to: media.uploaded, group.member.*, user.online
- [ ] Swagger docs
- [ ] Tests (REST + Socket.io)

### Phase 6: Presence Service ⏱️ ~2 hours
- [ ] Redis-only data store (no persistent DB)
- [ ] Online/offline tracking with heartbeat TTL
- [ ] Last seen timestamps
- [ ] Typing indicators with auto-expire
- [ ] Bulk presence lookup API
- [ ] Publish: user.online, user.offline
- [ ] Subscribe: message.sent (update last activity)
- [ ] Tests

### Phase 7: Media Service ⏱️ ~2 hours
- [ ] Multer upload with file type/size validation
- [ ] Sharp: image compression + thumbnail generation
- [ ] Local storage with S3-compatible abstraction
- [ ] BullMQ worker for async media processing
- [ ] Media streaming/download endpoint
- [ ] Publish: media.uploaded, media.processing.done
- [ ] Tests

### Phase 8: Notification Service ⏱️ ~2 hours
- [ ] MongoDB: notifications collection with TTL index
- [ ] Subscribe to: message.sent, group.member.*, user.registered
- [ ] Create notifications from events
- [ ] Push notifications via Chat Service WebSocket
- [ ] Notification APIs (list, read, read-all, unread count)
- [ ] BullMQ worker for batch notification processing
- [ ] Tests

### Phase 9: React Frontend ⏱️ ~4 hours
- [ ] Login/Register pages
- [ ] Chat list sidebar with last message + unread count
- [ ] Chat window with all message types
- [ ] Message input with media attachment picker
- [ ] Message status indicators (✓ ✓✓ blue ✓✓)
- [ ] Typing indicator
- [ ] Online/offline status badges
- [ ] Group chat UI (create, info, members)
- [ ] Profile page
- [ ] Notification badges
- [ ] Responsive design

### Phase 10: Documentation & Polish ⏱️ ~2 hours
- [ ] Professional README with architecture diagrams
- [ ] ARCHITECTURE.md — system design doc
- [ ] SCALING_STRATEGY.md — detailed scaling decisions
- [ ] Swagger docs for all services
- [ ] API_ENDPOINTS.md — consolidated API reference
- [ ] SOCKET_EVENTS.md — WebSocket event catalog
- [ ] INTER_SERVICE_COMMUNICATION.md — event flows

---

## 📊 Resume Impact — Interview Talking Points

### Architecture Decisions
> "I decomposed the system into 7 microservices based on scaling requirements. The Chat Service handles the highest throughput and can scale to 50+ replicas independently, while the Auth Service only needs 2-3 replicas since users authenticate once per session."

### Inter-Service Communication
> "I used gRPC for synchronous calls like token validation (latency-critical) and Redis Pub/Sub for async events like notifications (fire-and-forget). This gives us the best of both worlds — fast validation and decoupled processing."

### Database Per Service
> "Each service owns its database — no shared databases. The Auth Service uses PostgreSQL for ACID-compliant credential storage, the Chat Service uses MongoDB for flexible message schemas with chatRoomId-based sharding, and the Presence Service uses Redis as its primary store since presence data is ephemeral."

### Horizontal Scaling
> "The Chat Service uses Socket.io with a Redis Adapter. When User A on Node 1 sends a message to User B on Node 3, Redis Pub/Sub broadcasts the event to all nodes, and Node 3 delivers it to User B's socket. This allows unlimited horizontal scaling."

### Event-Driven Design
> "When a message is sent, the Chat Service publishes a `message.sent` event. The Notification Service picks it up and generates push notifications, the Presence Service updates last activity — all asynchronously without blocking the message send path."
