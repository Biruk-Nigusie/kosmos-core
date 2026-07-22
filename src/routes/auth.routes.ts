import { Elysia } from "elysia";
import { authController } from "../controllers/auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  registrationSchema,
  resendSchema,
  resetPasswordSchema,
  verificationSchema,
} from "../types";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", authController.register, { body: registrationSchema })
  .post("/refresh", authController.refresh)
  .post("/verify", authController.verify, {
    body: verificationSchema,
  })
  .post("/resend-code", authController.resendCode, {
    body: resendSchema,
  })
  .post("/login", authController.login, { body: loginSchema })
  .post("/logout", authController.logout)
  .post("/logout-all", authController.logoutAll)
  .post("/forgot-password", authController.forgotPassword, {
    body: forgotPasswordSchema,
  })
  .post("/reset-password", authController.resetPassword, {
    body: resetPasswordSchema,
  });
