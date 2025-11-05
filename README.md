# Vercel Functions Database Latency - Neon

This demo helps observe the latency characteristics of querying Neon database from [Vercel Functions](https://vercel.com/docs/functions) using different transport protocols and ORMs.

https://db-latency.vercel.app

## Providers

Here is an overview of all Neon connection methods and the compute locations available in this app:

| Provider                              | Transport | Edge (Global) | Edge (Regional / US East) | Node |
| :------------------------------------ | :-------- | :------------ | :------------------------ | ---- |
| Neon w/ pg package                    | TCP       | ❌            | ❌                        | ✅   |
| Neon w/ @neondatabase/serverless      | HTTP      | ✅            | ✅                        | ✅   |
| Neon w/ @neondatabase/serverless Pool | WebSocket | ✅            | ✅                        | ✅   |
| Neon w/ Drizzle ORM                   | HTTP      | ✅            | ✅                        | ✅   |

## Transport Methods

This app demonstrates three different transport protocols for connecting to Neon:

### TCP (via `pg` package)

Traditional PostgreSQL wire protocol connection using the `pg` package. **Node.js runtime only** - requires Node.js built-in modules not available in Edge runtime.

### HTTP (via `@neondatabase/serverless`)

HTTP-based queries using Neon's serverless driver. Works in Edge runtime and provides the lowest cold start times.

### WebSocket (via `@neondatabase/serverless` Pool)

WebSocket-based connection pooling using Neon's serverless driver. Maintains persistent connections for better performance on repeated queries.

## Testing Methodology

1. Smallest atomic unit, e.g. 1 item / row.
2. Data schema:

```ts
interface EmployeeTable {
  emp_no: number;
  first_name: string;
  last_name: string;
}
```

## Database Schema

The database schema is managed using Drizzle ORM. See `db/schema.ts` for the schema definition and `drizzle.config.ts` for configuration.

### Available Commands

- `pnpm db:generate` - Generate migrations from schema
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes directly to the database
- `pnpm db:studio` - Open Drizzle Studio to explore the database
