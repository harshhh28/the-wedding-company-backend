# Organization Management Service

A multi-tenant backend service built with **Node.js + Express + MongoDB** that manages organizations with dynamic collection creation.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis (optional - for caching and rate limiting)
- npm or yarn

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/harshhh28/the-wedding-company-backend
   cd the-wedding-company-backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   # Copy the example environment file
   copy env.example .env

   # Edit .env with your configuration
   ```

## Environment Variables

| Variable             | Description                          | Default                                            |
| -------------------- | ------------------------------------ | -------------------------------------------------- |
| `PORT`               | Server port                          | `3000`                                             |
| `NODE_ENV`           | Environment (development/production) | `development`                                      |
| `MONGODB_URI`        | MongoDB connection string            | `mongodb://localhost:27017/organization_master_db` |
| `REDIS_URL`          | Redis connection string (optional)   | `redis://localhost:6379`                           |
| `JWT_SECRET`         | Secret key for JWT signing           | -                                                  |
| `JWT_EXPIRES_IN`     | JWT token expiration                 | `24h`                                              |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds                   | `10`                                               |

> **Note**: Redis is optional. If unavailable, the service runs without caching and rate limiting.

## Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode (single process)
npm start

# Production mode with Cluster (multi-core, recommended)
npm run start:cluster

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Cluster Mode

For production, use cluster mode to utilize all CPU cores:

```bash
npm run start:cluster
```

This forks one worker process per CPU core, with automatic restart on failure. See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Project Structure

```
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── redis.js             # Redis cache service
│   ├── controllers/
│   │   ├── adminController.js   # Admin authentication handlers
│   │   ├── healthController.js  # Health monitoring handlers
│   │   └── orgController.js     # Organization CRUD handlers
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT authentication middleware
│   │   ├── rateLimiter.js       # Rate limiting middleware
│   │   └── requestLogger.js     # Request logging middleware
│   ├── models/
│   │   └── Organization.js      # Organization schema
│   ├── routes/
│   │   ├── adminRoutes.js       # Admin routes
│   │   ├── healthRoutes.js      # Health check routes
│   │   └── orgRoutes.js         # Organization routes
│   ├── services/
│   │   ├── collectionService.js # Dynamic collection management
│   │   └── orgService.js        # Business logic (with caching)
│   ├── utils/
│   │   ├── errorCodes.js        # Standard error codes
│   │   └── response.js          # Response utility functions
│   ├── validators/
│   │   └── orgValidator.js      # Zod validation schemas
│   ├── app.js                   # Express app configuration
│   ├── cluster.js               # Cluster mode entry point
│   └── server.js                # Server entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── ARCHITECTURE.md              # Architecture documentation
├── package.json
└── README.md
```

---

For architecture details and design choices, see [ARCHITECTURE.md](./ARCHITECTURE.md).
