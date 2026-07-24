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
import { authMiddleware } from "../middlewares/auth.middleware";
import { registerRateLimit } from "../plugins/rate-limit";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .group("", (app) =>
    app.use(registerRateLimit).post("/register", authController.register, {
      body: registrationSchema,
    }),
  )
  .post("/refresh", authController.refresh)
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
  })
  .use(authMiddleware)
  .post("/logout", authController.logout)
  .post("/logout-all", authController.logoutAll);
