import { Elysia } from "elysia";
import { auditController } from "../controllers/audit.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

export const auditRoutes = new Elysia({ prefix: "/admin/audit-logs" })
  .use(adminMiddleware)
  .get("/", auditController.getLogs);
