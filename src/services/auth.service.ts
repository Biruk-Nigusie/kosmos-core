import { eq, and, gt, sql, desc } from "drizzle-orm";
import { db } from "../db/db";
import {
  password_resets,
  user_sessions,
  users,
  verification_codes,
} from "../db/schema";
import { registrationType } from "../types";
import bcrypt from "bcrypt";
import { generateSecureCode } from "../utils/auth";
import { sendVerificationEmail } from "../utils/mail";
import { logActivity } from "./audit.service";

export const AuthService = {
  async findUserByEmail(email: string) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return existingUser || null;
  },
  async verifyUser(userId: string, code: string) {
    const result = await db.transaction(async (tx) => {
      // 1. Find the code
      const [existingCode] = await tx
        .select()
        .from(verification_codes)
        .where(
          and(
            eq(verification_codes.user_id, userId),
            eq(verification_codes.code, code),
            gt(verification_codes.expires_at, new Date()), // Checks if expiry is in the future
          ),
        );

      if (!existingCode) {
        throw new Error("Invalid or expired verification code");
      }

      // 2. Mark user as verified
      await tx
        .update(users)
        .set({ is_verified: true })
        .where(eq(users.id, userId));

      // 3. Delete the used code
      await tx
        .delete(verification_codes)
        .where(eq(verification_codes.id, existingCode.id));

      return { success: true };
    });
    //verify email audit log
    await logActivity(userId, "update", "user_profile", userId, {
      event: "email_verified",
    });
    return result;
  },
  async createUser(data: registrationType) {
    //check if disposable email TODO:
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verification_code = generateSecureCode();
    //database transaction if both(commit if both finish successfully), rollback if any thing goes wrong
    const newUser = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          password_hash: hashedPassword,
          is_verified: false,
        })
        .returning();

      await tx.insert(verification_codes).values({
        user_id: user.id,
        code: verification_code,
        type: "email_verification",
        expires_at: new Date(Date.now() + 15 * 60 * 1000), //15 min
      });
      return user;
    });
    //send email
    await sendVerificationEmail(newUser.email, verification_code, "verify");
    //Registration audit log
    await logActivity(newUser.id, "create", "user_profile", newUser.id, {
      event: "user_registered",
      email: newUser.email,
    });
    return {
      id: newUser.id,
      email: newUser.email,
    };
  },

  async refreshAccessToken(refreshToken: string, jwt: any) {
    // query the database session using the opaque token
    const [session] = await db
      .select()
      .from(user_sessions)
      .where(
        and(
          eq(user_sessions.refresh_token, refreshToken),
          gt(user_sessions.expires_at, new Date()),
        ),
      );

    if (!session) {
      throw new Error("Invalid or expired refresh token");
    }
    const accessToken = await jwt.sign({
      userId: session.user_id,
    });

    return accessToken;
  },
  resendVerificationCode: async (email: string) => {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!user) throw new Error("User not found");
      if (user.is_verified) throw new Error("User is already verified");

      //if a code was created in the last 2 minutes
      const [cooldownCheck] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(verification_codes)
        .where(
          and(
            eq(verification_codes.user_id, user.id),
            gt(
              verification_codes.created_at,
              sql`now() - interval '2 minutes'`,
            ),
          ),
        );

      // if count > 0, the database says "Yes, one exists from < 30s ago"
      if (cooldownCheck && Number(cooldownCheck.count) > 0) {
        throw new Error("Wait 2 minutes before requesting a new code.");
      }

      // 3. Otherwise, delete the old ones and send a new one
      await tx
        .delete(verification_codes)
        .where(eq(verification_codes.user_id, user.id));

      const newCode = generateSecureCode();
      await tx.insert(verification_codes).values({
        user_id: user.id,
        code: newCode,
        type: "email_verification",
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });

      await sendVerificationEmail(email, newCode, "verify");
      return { success: true };
    });
  },
  async login(email: string, password: string, deviceMetadata: any, jwt: any) {
    const user = await this.findUserByEmail(email);
    if (!user || !user.is_verified) throw new Error("Invalid credentials");
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials");
    const refreshToken = crypto.randomUUID();
    await db.insert(user_sessions).values({
      user_id: user.id,
      refresh_token: refreshToken,
      device_info: deviceMetadata,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    const accessToken = await jwt.sign({
      userId: user.id,
      role: user.role,
    });
    //Login audit log
    await logActivity(user.id, "create", "user_profile", user.id, {
      event: "user_login",
      device: deviceMetadata,
    });
    return { accessToken, refreshToken };
  },
  async logout(refreshToken: string) {
    // 1. Find the session explicitly first
    const existingSessions = await db
      .select()
      .from(user_sessions)
      .where(eq(user_sessions.refresh_token, refreshToken))
      .limit(1);

    const session = existingSessions[0];

    // 2. If found, log the audit event and delete the session
    if (session) {
      await logActivity(
        session.user_id,
        "delete",
        "user_profile",
        session.user_id,
        {
          event: "user_logout",
          device: session.device_info,
        },
      );

      await db
        .delete(user_sessions)
        .where(eq(user_sessions.refresh_token, refreshToken));
    }
  },

  async logoutAll(userId: string) {
    await db.delete(user_sessions).where(eq(user_sessions.user_id, userId));
    await logActivity(userId, "delete", "user_profile", userId, {
      event: "user_logout_all_devices",
    });
  },
  async requestPasswordReset(email: string) {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) throw new Error("User not found");

      // Now we check created_at directly
      const [cooldownCheck] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(password_resets)
        .where(
          and(
            eq(password_resets.userId, user.id),
            gt(password_resets.createdAt, sql`now() - interval '2 minutes'`),
          ),
        );

      if (cooldownCheck && Number(cooldownCheck.count) > 0) {
        throw new Error("Please wait 2 minutes before requesting a new code.");
      }

      await tx
        .delete(password_resets)
        .where(eq(password_resets.userId, user.id));

      const code = generateSecureCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await tx.insert(password_resets).values({
        userId: user.id,
        code: code,
        expiresAt: expiresAt,
        // createdAt defaults to now() automatically
      });

      await sendVerificationEmail(email, code, "password_reset");
      //password reset audit log
      await logActivity(user.id, "create", "user_profile", user.id, {
        event: "password_reset_requested",
      });
      return { success: true };
    });
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) throw new Error("User not found");

    //find the latest valid code
    const [resetEntry] = await db
      .select()
      .from(password_resets)
      .where(eq(password_resets.userId, user.id))
      .orderBy(desc(password_resets.expiresAt))
      .limit(1);

    // validate code and expiration
    if (
      !resetEntry ||
      resetEntry.code !== code ||
      new Date() > resetEntry.expiresAt
    ) {
      throw new Error("Invalid or expired code");
    }

    // hash password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password_hash: hashedPassword })
      .where(eq(users.id, user.id));

    // delete the used code
    await db.delete(password_resets).where(eq(password_resets.userId, user.id));
    //reset password audit log
    await logActivity(user.id, "update", "user_profile", user.id, {
      event: "password_reset_completed",
    });
  },
};
