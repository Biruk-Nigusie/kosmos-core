import { Elysia } from "elysia";
import { SettingsController } from "../controllers/settings.controller";
import { updateSettingsBodySchema } from "../types";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .get("/", SettingsController.getSettings)
  .put("/", SettingsController.updateSettings, {
    body: updateSettingsBodySchema,
  });
