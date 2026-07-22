import { Elysia, ValidationError } from "elysia";
import { env } from "./config/env";
import { openapi } from "@elysia/openapi";
import { authRoutes } from "./routes/auth.routes";
import { rateLimit } from "elysia-rate-limit";
import { jwt } from "@elysiajs/jwt";
import { folderRoutes } from "./routes/folder.routes";
import { noteRoutes } from "./routes/note.routes";
import { collaborationRoutes } from "./routes/collaboration.routes";
import { noteWs } from "./ws/note.ws";
import { profileRoutes } from "./routes/profile.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { auditRoutes } from "./routes/audit.routes";
import { startTrashCleanupCron } from "./services/cleanup.service";

const app = new Elysia()
  .use(openapi())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
    }),
  )
  // .use(
  //   rateLimit({
  //     duration: 60000, //1 min
  //     max: 10, //5 request per min
  //   }),
  // )

  .use(authRoutes)
  .use(authMiddleware)
  .use(settingsRoutes)
  .use(folderRoutes)
  .use(noteRoutes)
  .use(collaborationRoutes)
  .use(profileRoutes)
  .use(noteWs)
  .use(auditRoutes)
  .get("/health", () => "Hello Kosmos")
  .use(errorHandler)
  .listen({ port: env.PORT, hostname: "0.0.0.0" });

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `🐇 API Docs: http://${app.server?.hostname}:${app.server?.port}/openapi`,
);
startTrashCleanupCron();
