import { db } from "../db/db";
import { user_activity_logs } from "../db/schema";
//allowed action types
type ActionType = "create" | "update" | "delete" | "share";
//action taken on
type EntityType = "note" | "folder" | "user_profile" | "setting";

export const logActivity = async (
  userId: string,
  action: ActionType,
  entityType: EntityType,
  entityId: string,
  metadata?: Record<string, unknown>,
) => {
  try {
    await db.insert(user_activity_logs).values({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ? metadata : undefined,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
