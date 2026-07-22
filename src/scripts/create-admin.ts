import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import bcrypt from "bcrypt";
async function createSuperAdmin() {
  const adminEmail = String(env.ADMIN_EMAIL);
  const rawPassword = String(env.ADMIN_PASSWORD);

  if (!rawPassword || rawPassword === "undefined") {
    process.exit(1);
  }

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  const existingUser = existingUsers[0];

  if (existingUser) {
    await db
      .update(users)
      .set({ role: "admin", is_verified: true })
      .where(eq(users.email, adminEmail));

    console.log(
      `✅ Existing user (${adminEmail}) successfully updated to admin role.`,
    );
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  await db.insert(users).values({
    email: adminEmail,
    password_hash: passwordHash,
    role: "admin",
    is_verified: true,
  });

  console.log(`Admin account created successfully for: ${adminEmail}`);
  process.exit(0);
}

createSuperAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
