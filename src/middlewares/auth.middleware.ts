import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env";
export const authMiddleware = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: env.JWT_SECRET }))
    .derive(async ({ cookie, jwt, set }) => {
      const accessToken = cookie.access_token.value;

      if (!accessToken || typeof accessToken !== "string") {
        set.status = 401;
        throw new Error("Unauthorized");
      }
      const decoded = await jwt.verify(accessToken);

      if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
        set.status = 401;
        throw new Error("Invalid session");
      }

      const user = { id: (decoded as { userId: string }).userId };
      return { user };
    });
