# Architecture Documentation

## System Overview

This service implements a **multi-tenant architecture** using MongoDB, where each organization gets its own dedicated collection for data isolation.

<a href="https://ibb.co/wNks3RMp"><img src="https://i.ibb.co/1fg6hL8R/architechture-white-bg.png" alt="architechture-design" border="0"></a>

## Design Choices

### Why Multi-Tenant with Dynamic Collections?

Each organization gets a dedicated MongoDB collection (`org_<name>`):

- **Data Isolation**: Complete separation between tenants prevents data leaks
- **Easy Cleanup**: Dropping a collection removes all tenant data instantly
- **Performance**: Smaller collections = faster queries
- **Future-proof**: Easy to migrate to database-per-tenant if needed

### Why Cluster Mode over Threads?

Node.js is single-threaded by default. For I/O-bound CRUD operations:

- **Cluster mode** forks one worker per CPU core, sharing port 3000
- **OS handles load balancing** across workers automatically
- **Fault tolerance**: Dead workers auto-restart without downtime
- We avoid `worker_threads` since our workload is I/O-bound (database), not CPU-bound

### Why Redis is Optional?

Redis provides caching and distributed rate limiting, but:

- Not all deployments need it (adds operational complexity)
- **Graceful degradation**: Service works without Redis; caching and rate limiting simply disable
- Makes local development simpler (no Redis dependency required)

### Why Zod for Validation?

- **Type-safe**: Validates and infers TypeScript types simultaneously
- **Composable**: Schemas can be combined and reused
- **Better errors**: Clear, human-readable validation messages

### Why JWT for Authentication?

- **Stateless**: No session storage needed on server
- **Scalable**: Works across cluster workers without shared state
- **Self-contained**: Token carries admin info, reducing database lookups

### Why Functional over Class-Based?

We use functional programming patterns instead of classes:

- **Simplicity**: Pure functions are easier to test and reason about
- **No `this` binding issues**: Avoids common JavaScript pitfalls with class context
- **Better tree-shaking**: Bundlers can eliminate unused functions more effectively
- **Composability**: Functions compose naturally with middleware patterns (Express)
- **Less boilerplate**: No constructor setup, inheritance chains, or decorators needed
- **Modern Node.js style**: Aligns with Express ecosystem conventions and async/await patterns

## Security Considerations

1. **Password Hashing**: bcrypt with configurable salt rounds
2. **JWT Tokens**: Signed tokens with expiration
3. **Authorization**: Admin can only access their own organization
4. **Input Validation**: Zod schema validation prevents injection
5. **Rate Limiting**: Redis-based protection against brute force (when available)
6. **Error Handling**: No stack traces or internal errors exposed to clients
