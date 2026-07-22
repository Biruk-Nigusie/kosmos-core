import { Elysia } from "elysia";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const adminMiddleware = (app: Elysia) =>
  app.derive(
    { as: "scoped" },
    async ({ user, set }: { user?: { id: string }; set: any }) => {
      if (!user || !user.id) {
        set.status = 401;
        throw new Error("Unauthorized");
      }

      const dbUsers = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const dbUser = dbUsers[0];

      if (!dbUser || dbUser.role !== "admin") {
        set.status = 403;
        throw new Error("Forbidden: Admin access required");
      }

      return { isAdmin: true };
    },
  );
