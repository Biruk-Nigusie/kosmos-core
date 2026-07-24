import { AuthService } from "../services/auth.service";
import { Context } from "elysia";
import { UAParser } from "ua-parser-js";
import {
  forgotPasswordType,
  loginType,
  registrationType,
  resendType,
  resetPasswordType,
  verificationType,
} from "../types";
import { env } from "../config/env";
export const authController = {
  register: async ({ body, set }: Context & { body: registrationType }) => {
    const data = body as registrationType;
    const existingUser = await AuthService.findUserByEmail(data.email);

    if (data.password !== data.confirmPassword) {
      set.status = 400;
      return { error: "Passwords do not match" };
    }
    if (existingUser) {
      set.status = 400;
      return { error: "User already exists" };
    }

    const newUser = await AuthService.createUser(data);

    set.status = 201;
    return {
      message:
        "User created, use code sent to your email to verify your account",
      user: newUser,
    };
  },
  refresh: async (Context: any) => {
    const { cookie, jwt, set } = Context;
    const refreshToken = cookie.refresh_token?.value;
    if (!refreshToken) {
      set.status = 401;
      return { error: "No refresh token provided" };
    }

    try {
      const accessToken = await AuthService.refreshAccessToken(
        refreshToken,
        jwt,
      );

      // set the new access token
      cookie.access_token.set({
        value: accessToken,
        httpOnly: true,
        secure: env.DEVELOPMENT === "PRODUCTION",
        sameSite: "strict",
        maxAge: 15 * 60,
        path: "/",
      });

      return {
        success: true,
        message: "Token refreshed successfully",
      };
    } catch (error) {
      set.status = 403;
      return { error: "Invalid or expired refresh token" };
    }
  },
  login: async (Context: any) => {
    const { body, set, jwt, request, cookie, server } = Context;

    const { email, password } = body as loginType;

    const userAgent = request.headers.get("user-agent") || "";
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      (server ? server.requestIP(request)?.address : null) ||
      "127.0.0.1";
    const deviceMetadata = {
      browser: result.browser.name || "Unknown",
      os: result.os.name || "Unknown",
      ip_address: clientIp,
      is_mobile: result.device.type === "mobile",
    };
    try {
      const { accessToken, refreshToken } = await AuthService.login(
        email,
        password,
        deviceMetadata,
        jwt,
      );
      cookie.access_token.set({
        value: accessToken,
        httpOnly: true,
        secure: env.DEVELOPMENT === "PRODUCTION",
        sameSite: "strict",
        maxAge: 15 * 60, // 15 minutes
        path: "/",
      });

      //httpOnly cookie
      cookie.refresh_token.set({
        value: refreshToken,
        httpOnly: true,
        secure: env.DEVELOPMENT === "PRODUCTION",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
      return {
        success: true,
        message: "Logged in successfully",
      };
    } catch (error) {
      set.status = 401;
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
      };
    }
  },
  logout: async ({ cookie, set }: any) => {
    const refreshToken = cookie.refresh_token.value;

    if (!refreshToken) {
      set.status = 400;
      return { success: false, message: "Already logged out" };
    }

    await AuthService.logout(refreshToken);

    cookie.access_token.set({ value: "", maxAge: 0 });
    cookie.refresh_token.set({ value: "", maxAge: 0 });

    return { success: true, message: "Logged out successfully" };
  },
  logoutAll: async ({ cookie, jwt, set }: any) => {
    const token = cookie.access_token.value;

    if (!token) {
      set.status = 401;
      return { success: false, message: "Not authenticated" };
    }

    const user = await jwt.verify(token);

    if (!user) {
      set.status = 401;
      return { success: false, message: "Invalid session" };
    }

    await AuthService.logoutAll(user.userId);

    cookie.access_token.set({ value: "", maxAge: 0 });
    cookie.refresh_token.set({ value: "", maxAge: 0 });

    return { success: true, message: "Logged out from all devices" };
  },
  forgotPassword: async ({
    body,
    set,
  }: {
    body: forgotPasswordType;
    set: any;
  }) => {
    const { email } = body;
    try {
      await AuthService.requestPasswordReset(email);
      return { success: true, message: "Code sent to your email." };
    } catch (error) {
      const isCooldownError =
        error instanceof Error && error.message.includes("wait 30 seconds");
      set.status = isCooldownError ? 429 : 400;
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to process request",
      };
    }
  },

  resetPassword: async ({
    body,
    set,
  }: {
    body: resetPasswordType;
    set: any;
  }) => {
    const { email, code, newPassword } = body;

    try {
      await AuthService.resetPassword(email, code, newPassword);
      return { success: true, message: "Password updated successfully" };
    } catch (error: any) {
      set.status = 400;
      return { success: false, message: error.message };
    }
  },
  verify: async ({ body, set }: Context) => {
    const { userId, code } = body as verificationType;

    try {
      await AuthService.verifyUser(userId, code);
      return {
        success: true,
        message: "Account verified successfully",
      };
    } catch (error) {
      set.status = 400;
      return {
        success: false,
        message: error instanceof Error ? error.message : "Verification failed",
      };
    }
  },
  resendCode: async ({ body, set }: Context) => {
    const { email } = body as resendType;
    try {
      await AuthService.resendVerificationCode(email);
      return {
        success: true,
        message: "A new code has been sent to your email.",
      };
    } catch (error) {
      const isCooldownError =
        error instanceof Error && error.message.includes("wait 30 seconds");

      // Set status to 429 for cooldown, otherwise default to 400
      set.status = isCooldownError ? 429 : 400;
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to resend code",
      };
    }
  },
};
