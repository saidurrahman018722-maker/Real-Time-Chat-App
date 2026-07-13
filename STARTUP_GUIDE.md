# ChatApp - Microservices Startup Guide

Welcome to the new microservice-based architecture of your ChatApp! Since we broke down the large monolithic backend into smaller, independent services, you will now need to run multiple servers and background processes for the application to function correctly. 

This guide will walk you through exactly what needs to be running.

---

## 1. Prerequisites (Docker & Infrastructure)
Before starting any Node.js servers, you must start your core infrastructure. The API Gateway relies on **Redis** for rate-limiting, and the Auth/Message services rely on **Kafka** for event-driven communication.

1. Open a new PowerShell terminal.
2. Navigate to the backend directory:
   ```powershell
   cd d:\Backend\ChatApp\backend
   ```
3. Start the Docker containers in the background:
   ```powershell
   docker-compose up -d
   ```
*(This starts up 3 Kafka Brokers, a Redis cluster node, and isolated PostgreSQL containers if you are using them locally instead of Neon).*

---

## 2. Start the API Gateway
The API Gateway is the central entry point for your frontend. It runs on **Port 3000** and routes requests to the appropriate microservices.

1. Open a new PowerShell tab.
2. Navigate to the gateway directory:
   ```powershell
   cd d:\Backend\ChatApp\backend\api-gateway
   ```
3. Start the server:
   ```powershell
   npx nodemon index.js
   ```

---

## 3. Start the Microservices
Each service handles a specific piece of business logic. You must start all of them in their own separate terminal tabs.

### Auth Service (Handles login, register, sessions)
1. Open a new PowerShell tab.
2. Run the following:
   ```powershell
   cd d:\Backend\ChatApp\backend\auth-service
   npx nodemon index.js
   ```

### Contact Service (Handles contacts & friend requests)
1. Open a new PowerShell tab.
2. Run the following:
   ```powershell
   cd d:\Backend\ChatApp\backend\contact-service
   npx nodemon index.js
   ```

### Conversation Service (Handles chat rooms & groups)
1. Open a new PowerShell tab.
2. Run the following:
   ```powershell
   cd d:\Backend\ChatApp\backend\conversation-service
   npx nodemon index.js
   ```

### Message Service (Handles sending messages & WebSockets)
1. Open a new PowerShell tab.
2. Run the following:
   ```powershell
   cd d:\Backend\ChatApp\backend\message-service
   npx nodemon index.js
   ```

---

## 4. Start the Frontend
Finally, start your React application.

1. Open a new PowerShell tab.
2. Run the following:
   ```powershell
   cd d:\Backend\ChatApp\frontend
   npm run dev
   ```

---

### Pro-Tip for the Future 💡
Opening 6-7 terminal tabs every time you want to code can get tedious. In the future, we can create a simple `start.js` script or use a package like `concurrently` to boot up everything with a single command! Let me know if you want to set that up later.
