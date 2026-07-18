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
  .post("/verify", authController.verify, {
    body: verificationSchema,
  })
  .post("/resend-code", authController.resendCode, {
    body: resendSchema,
  })
  .post("/login", authController.login, { body: loginSchema })
  .post("/forgot-password", authController.forgotPassword, {
    body: forgotPasswordSchema,
  })
  .post("/reset-password", authController.resetPassword, {
    body: resetPasswordSchema,
  });
