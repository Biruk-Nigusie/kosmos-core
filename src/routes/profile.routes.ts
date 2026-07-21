import Elysia, { t } from "elysia";
import { authMiddleware } from "../middlewares/auth.middleware";
import { profileController } from "../controllers/profile.controller";
import { updateProfileSchema } from "../types";

export const profileRoutes = new Elysia({ prefix: "/profile" })
  .use(authMiddleware)
  .get("/", profileController.get)
  .patch("/", profileController.update, {
    body: updateProfileSchema,
  });
