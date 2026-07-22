import { db } from "../db/db";
import { user_settings } from "../db/schema";
import { eq } from "drizzle-orm";
import { UserPreferences } from "../types";

export const SettingsService = {
  // 1. Fetch settings for a user
  async getSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.user_id, userId));

    if (!settings) {
      return {
        notification_enabled: false,
        preferences: {
          theme: "dark",
          fontSize: "medium",
          highContrastMode: false,
          keyboardShortcuts: true,
          notifications: {
            mentions: true,
            sharedNotes: true,
            digestEmails: false,
          },
          sidebarCollapsed: false,
          defaultEditorView: "markdown",
        } as UserPreferences,
      };
    }

    return settings;
  },

  // 2. Upsert settings and preferences
  async updateSettings(
    userId: string,
    notification_enabled?: boolean,
    preferences?: Partial<UserPreferences>,
  ) {
    const current = await this.getSettings(userId);

    const mergedPreferences: UserPreferences = {
      ...(current.preferences as UserPreferences),
      ...preferences,
      notifications: {
        ...current.preferences?.notifications,
        ...preferences?.notifications,
      },
    };

    const [updated] = await db
      .insert(user_settings)
      .values({
        user_id: userId,
        notification_enabled:
          notification_enabled ?? current.notification_enabled,
        preferences: mergedPreferences,
      })
      .onConflictDoUpdate({
        target: user_settings.user_id,
        set: {
          ...(notification_enabled !== undefined && { notification_enabled }),
          preferences: mergedPreferences,
          updated_at: new Date(),
        },
      })
      .returning();

    return updated;
  },
};
