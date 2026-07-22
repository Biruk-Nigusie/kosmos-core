## Getting Started

1. Install dependencies:
   bun install

2. Configure environment:
   Create a .env file using .env.example as a reference and set your values.

3. Database Setup:
   Ensure your PostgreSQL database has the ltree extension enabled:
   CREATE EXTENSION IF NOT EXISTS "ltree";

## Development

create admin user
bun run src/scripts/create-admin.ts

Run the server:
bun run src/index.ts

* API: http://localhost:9000
* API Docs: http://localhost:9000/openapi
