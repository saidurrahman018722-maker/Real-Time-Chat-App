# ChatWave 🌊 (WhatsApp Clone - Phase 1)

ChatWave is a full-stack, real-time messaging application designed to emulate the core functionality and infrastructure scaling principles of WhatsApp.

## 🏛️ Architecture Overview

ChatWave employs a **Client-Server Architecture** using a **Microservices** backend pattern to ensure horizontal scalability and maintainability.

- **Frontend**: React (Vite) + TailwindCSS + Zustand
  - Uses REST for initial data fetching and Socket.IO for real-time bi-directional events.
- **API Gateway**: Node.js + Express
  - Central entry point that proxies requests to microservices and handles rate limiting (via Redis).
- **Backend Microservices**: Node.js + Express
  - **Auth Service**: Manages email registration, OTP verification via Node Mailer, and JWT session handling.
  - **Contact Service**: Manages searching users by email and adding contacts.
  - **Conversation Service**: Manages creation and retrieval of 1-to-1 (and eventually group) chat rooms.
  - **Message Service**: Handles REST endpoints for message persistence and runs the **Socket.IO Layer** for real-time delivery states, typing indicators, and presence.
- **Real-time Layer**: Socket.IO
  - Directly handles the live transmission of messages. 
- **Message Broker**: Kafka
  - Used for asynchronous replication between services (e.g., when a user is created in Auth, it replicates to other services via Kafka events).
- **Databases**: 
  - **PostgreSQL** (via Prisma) for structured, relational data.
  - **Redis** for rate limiting, session storage, and caching active user presence (`online`).

### Tradeoffs
- **Microservices vs Monolith**: While a monolith would be easier to deploy, breaking out the `Message Service` allows us to scale the WebSocket layer independently of the heavy `Auth Service` endpoints.
- **REST + WebSocket vs Pure WebSocket**: We use REST for paginated historical data and WebSockets for live events. This avoids overloading the WebSocket connection with heavy payload requests.
- **In-Memory vs Redis Presence**: For this MVP, we map Socket IDs in memory but publish `lastSeen` state to Postgres and `online` state to Redis to allow other instances to eventually know presence state. For real production scale, we would use `socket.io-redis-adapter` to distribute socket events across multiple instances.

## 💾 Data Model

The data model uses PostgreSQL. Key entities:
- **User**: Stores `email` (unique), `password`, `name`, `profilePic`, and `lastSeen`.
- **Otp**: Temporarily stores hashed OTPs with expiry limits for email verification and password resets.
- **Contact**: Manages unidirectional contact lists (`ownerId` -> `userId`).
- **Conversation**: Manages chat rooms. Contains an `isGroup` boolean for Phase 2 preparation.
- **Message**: Stores `senderId`, `receiverId`, `text`, `image` and crucially, the **`status`** enum (`SENT`, `DELIVERED`, `READ`).

*(Media files will be stored in an S3-compatible object store in Phase 2, with only the URL stored in the `image` column).*

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- A running PostgreSQL database (e.g., Neon DB)

### 1. Infrastructure (Kafka & Redis)
Navigate to the backend directory and start the Docker containers:
```bash
cd backend
docker-compose up -d
```

### 2. Database Migration
Ensure your `.env` contains a valid Neon DB `DATABASE_URL`. Run the Prisma migration to sync the new schema:
```bash
cd backend
npx prisma db push --accept-data-loss
```

### 3. Start Backend Services
You can run all microservices concurrently:
```bash
cd backend
npm run start:microservices
```
Alternatively, start the API Gateway (`backend/api-gateway`) and individual services manually using `nodemon index.js` in each folder.

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Logging In
1. Open `http://localhost:5173`.
2. Enter your email and password to log in.
3. If registering, an OTP will be sent to your email (via Node Mailer) for verification.

## 🚧 Known Limitations & Real-Scale Fixes
- **Email Delivery Delay**: OTPs are currently sent via SMTP. At real scale, we would use a dedicated provider like SendGrid or AWS SES for high deliverability.
- **Socket Distribution**: If we run 5 `message-service` instances, we need a Redis Pub/Sub adapter for Socket.IO so users connected to Server A can chat with users on Server B.
- **Media Storage**: Currently, the system accepts base64 images and uploads to Cloudinary. At scale, we should generate pre-signed S3 URLs on the backend, upload directly from the client to S3, and only pass the resulting URL to the backend.

## ⏭️ What's Next (Phases 2 & 3)
- **Phase 2 (Media & Groups)**: 
  - Implement group chats by extending the `Conversation` participants list and updating the Socket.IO rooms logic.
  - Enforce a strict 16MB limit on media attachments.
  - Implement "Delete for everyone" with a 1-hour time window check.
- **Phase 3 (E2E & Calls)**:
  - Implement WebRTC signaling through the existing Socket.IO layer for voice/video calls.
  - Integrate the `libsignal` protocol for true End-to-End Encryption before messages are sent to the server.
