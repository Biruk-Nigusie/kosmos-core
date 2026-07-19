import { Elysia, ValidationError } from "elysia";
import { env } from "./config/env";
import { openapi } from "@elysia/openapi";
import { authRoutes } from "./routes/auth.routes";
import { rateLimit } from "elysia-rate-limit";
import { jwt } from "@elysiajs/jwt";
import { folderRoutes } from "./routes/folder.routes";
import { noteRoutes } from "./routes/note.routes";

const app = new Elysia()
  .use(openapi())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
    }),
  )
  .use(
    rateLimit({
      duration: 60000, //1 min
      max: 5, //5 request per min
    }),
  )
  .use(authRoutes)
  .use(folderRoutes)
  .use(noteRoutes)
  .get("/", () => "Hello Elysia")
  .onError(({ code, error }) => {
    if (code === "VALIDATION") {
      const firstError = (error as ValidationError).all[0];

      if (firstError.path === "/password") {
        return {
          error:
            "Password must be a mix of uppercase, lowercase, numbers, and symbols.",
        };
      }

      if (firstError.path === "/email") {
        return { error: "Please provide a valid email address." };
      }

      return { error: firstError.message };
    }
  })
  .listen(env.PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `🐇 API Docs: http://${app.server?.hostname}:${app.server?.port}/openapi`,
);
