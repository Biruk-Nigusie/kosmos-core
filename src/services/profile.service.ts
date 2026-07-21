import { db } from "../db/db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";

export const ProfileService = {
  async getProfile(userId: string) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId));
    return profile;
  },

  async updateProfile(
    userId: string,
    data: { display_name?: string; bio?: string; avatar_url?: string },
  ) {
    const [profile] = await db
      .insert(profiles)
      .values({
        user_id: userId,
        ...data,
      })
      .onConflictDoUpdate({
        target: profiles.user_id,
        set: {
          ...data,
          updated_at: new Date(),
        },
      })
      .returning();

    return profile;
  },
};
