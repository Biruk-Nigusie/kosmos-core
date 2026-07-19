import { Elysia } from "elysia";
import { folderController } from "../controllers/folder.controller";
import { createFolderSchema, updateFolderSchema } from "../types";
import { authMiddleware } from "../middlewares/auth.middleware";

export const folderRoutes = new Elysia({ prefix: "/folders" })
  .use(authMiddleware)
  .post("/", folderController.create, { body: createFolderSchema })
  .get("/", folderController.list)
  .get("/trash", folderController.listTrash)
  .patch("/:id", folderController.update, { body: updateFolderSchema })
  .patch("/:id/restore", folderController.restore)
  .delete("/:id", folderController.delete)
  .delete("/:id/purge", folderController.permanentDelete);
