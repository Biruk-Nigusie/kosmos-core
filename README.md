## Getting Started

1. Install dependencies:
   bun install

2. Configure environment:
   Create a .env file using .env.example as a reference and set your values.

3. Database Setup:
   Ensure your PostgreSQL database has the ltree extension enabled:
   CREATE EXTENSION IF NOT EXISTS "ltree";

## Development

Run the server:
bun run src/index.ts
change PORT with what you set in .env

* API: http://localhost:<PORT>
* API Docs: http://localhost:<PORT>/openapi