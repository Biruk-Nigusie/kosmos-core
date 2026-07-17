import { Elysia } from "elysia";
import { env } from "./config/env";
import { openapi } from "@elysia/openapi";

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .listen(env.PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `✅ API Docs: http://${app.server?.hostname}:${app.server?.port}/openapi`,
);
