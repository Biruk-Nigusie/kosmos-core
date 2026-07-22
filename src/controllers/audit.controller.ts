import { db } from "../db/db";
import { user_activity_logs } from "../db/schema";
import { desc } from "drizzle-orm";

export const auditController = {
  getLogs: async () => {
    const logs = await db
      .select()
      .from(user_activity_logs)
      .orderBy(desc(user_activity_logs.created_at))
      .limit(100);
    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  },
};
