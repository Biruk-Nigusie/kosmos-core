import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env";
import { db } from "../db/db";
import { user_sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const authMiddleware = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: env.JWT_SECRET }))
    .derive(async ({ cookie, jwt, set }) => {
      const accessToken = cookie.access_token.value;
      if (!accessToken || typeof accessToken !== "string") {
        set.status = 401;
        throw new Error("Unauthorized");
      }
      //validate token
      const decoded = await jwt.verify(accessToken);
      if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
        set.status = 401;
        throw new Error("Invalid session");
      }
      const userId = (decoded as { userId: string }).userId;
//check if there are at least one session
      const activeSessions = await db
        .select()
        .from(user_sessions)
        .where(eq(user_sessions.user_id, userId))
        .limit(1);

      if (activeSessions.length === 0) {
        set.status = 401;
        throw new Error("Unauthorized");
      }

      const user = { id: userId, role: (decoded as any).role };
      return { user };
    });
