import { Elysia } from "elysia";
import { authController } from "../controllers/auth.controller";
import { registrationSchema } from "../types";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  authController.register,
  { body: registrationSchema },
);
