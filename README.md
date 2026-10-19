<img width="626" height="319" alt="image" src="https://github.com/user-attachments/assets/becd6239-6e05-4d9a-9f01-298e2fcf79ca" /># Delivery Agent Management System

A robust, full-stack web application for managing delivery agents. This system features a secure backend API, a responsive modern frontend, strict data validation, and a highly optimized Redis caching layer.

**Live Demo:** https://delivery-agent-system.vercel.app/
**Live API:** https://delivery-agent-system-rxct.onrender.com/

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js, TypeScript
* **Database:** PostgreSQL (hosted on Neon DB)
* **ORM:** Prisma
* **Caching:** Redis (hosted on Upstash)
* **Authentication:** JWT (JSON Web Tokens)
* **Validation:** Zod
* **Frontend:** React, Next.js (App Router), Tailwind CSS

## 🏛️ Architectural Decisions & Evaluation Points

### Why PostgreSQL?

We chose **PostgreSQL** over a NoSQL database (like MongoDB) because the domain of "Delivery Agents" is inherently relational. As the system scales, agents will need to be strictly linked to other entities (e.g., Deliveries, Vehicles, Operational Zones). PostgreSQL guarantees ACID compliance, strict schema enforcement (preventing orphaned records), and robust relational integrity. Combined with Prisma ORM, it provides a highly maintainable and type-safe database layer.

### Redis Caching & Cache Consistency

To optimize read operations and reduce database load, Redis is implemented for the `GET` routes.

* **What is Cached:**
  1. Paginated lists of agents (Cache Key: `agents:list:page_<X>_limit_<Y>_search_<Z>_status_<W>`).
  2. Individual agent profiles (Cache Key: `agent:<ID>`).

* **Invalidation Strategy:** We implemented strict cache invalidation to prevent stale data. Upon any `POST` (Create), `PUT` (Update), or `DELETE` operation, the backend executes an `invalidateAgentCaches()` function. This uses Redis pattern matching (`KEYS agents:list:*`) to instantly clear all list caches and the specific `agent:<ID>` cache.

* **Resilience:** The Redis client includes error event listeners. If the Redis server goes down, the application gracefully falls back to querying PostgreSQL directly, ensuring zero downtime.

### API Design, Error Handling & Validation

* **Zod Middleware:** All incoming data on `POST` and `PUT` routes passes through a custom Zod validation middleware. This blocks malformed emails or incorrect phone numbers before they reach the controller logic.
* **Unified Errors:** The backend catches all errors (including Prisma `P2002` unique constraint violations for duplicate emails/phones) and standardizes them into a consistent `{ error: "Message" }` JSON format for the frontend to easily parse.

### Frontend Usability & Security

* **Custom UI:** The interface uses Tailwind CSS and a custom Montserrat font for a clean, modern dashboard.
* **Modal-Driven UX:** Creation, editing, and deletion happen within accessible, backdrop-blurred modals rather than navigating to separate pages, keeping the user in context.
* **Secure Routing:** The frontend features a dedicated login gateway. `localStorage` is used for token management, and unauthorized API calls trigger an immediate frontend interception, wiping the expired token and redirecting the user to the login screen.


## 💻 Local Setup Instructions

### . Database & Cache (Docker)
> **Optional Docker Setup:** If you have Docker installed, run `docker-compose up -d` in the root folder to instantly spin up the required PostgreSQL database and Redis containers.

*(If you do not use Docker, please ensure you have your own local PostgreSQL and Redis servers running).*

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn

### 1. Environment Variables

You will need `.env` files in both the `backend` and `frontend` directories. **Do not commit your actual `.env` files to version control.**

**Backend (`backend/.env`)**
```env
PORT=5000

# PostgreSQL Connection String (Neon DB or local)
DATABASE_URL="postgresql://postgres:password123@localhost:5432/delivery_db"

# Redis Connection String (Upstash or local)
REDIS_URL="redis://localhost:6379"

# JWT Secret for Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
```

**Frontend (`frontend/.env`)**
```env
# Points to your backend API
NEXT_PUBLIC_API_URL="http://localhost:5000/api" 
```

### 2. Backend Setup & Database Migration

Navigate to the backend directory, install dependencies, and push the Prisma schema to your PostgreSQL database.

```bash
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Push the schema to PostgreSQL (creates the tables)
npx prisma db push

# Start the development server
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and start the app.

```bash
cd frontend
npm install

# Start the frontend server
npm run dev
```
*The frontend will start on `http://localhost:3000`.*

## 🧪 Testing the Main CRUD Flows

*(Note: You can also test these flows directly on the live demo links provided at the top!)*

1. **Authentication (Login)**
   * Navigate to `http://localhost:3000` (or the live URL). You will be redirected to `/login`.
   * Enter the admin credentials. 
   **( Test Credentials : username - admin, password - password123 )**
   * Verify you are redirected to the Dashboard and a JWT is stored.

2. **Create (POST)**
   * Click "+ Add Agent".
   * Test Zod validation by entering an invalid email or short phone number. Observe the red error banner.
   * Enter valid details and click "Save". Verify the table updates immediately.

3. **Read & Cache Verification (GET)**
   * Observe the table listing agents (fetches from Redis if cached).
   * Click "View" on an agent to open the read-only modal (fetches individual details).
   * Use the search bar or status dropdown to test filtering and pagination.

4. **Update (PUT)**
   * Click "Edit" on an agent.
   * Change their status to "Inactive" or update their Service Area.
   * Click "Save". Verify the table reflects the change (proving cache invalidation works).
   * *Error Handling Test:* Try to update an agent's email to one that already belongs to another agent. You should see the duplicate error handled gracefully.

5. **Delete (DELETE)**
   * Click "Delete" on an agent.
   * Confirm the deletion in the modal. Verify the agent disappears from the list immediately.

6. **Security Testing**
   * Click "Logout" to clear your token. Attempt to manually navigate back to the dashboard route. You should be bounced back to the login screen.
