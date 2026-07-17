import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { users } from "../db/schema";
import { registrationType } from "../types";
import bcrypt from "bcrypt";

export const AuthService = {
  async findUserByEmail(email: string) {
    //access the first element
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return existingUser || null;
  },

  async createUser(data: registrationType) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        password_hash: hashedPassword,
        is_verified: false,
      })
      .returning();

    return {
      id: newUser.id,
      email: newUser.email,
    };
  },
};
