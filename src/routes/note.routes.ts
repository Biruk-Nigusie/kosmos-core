import Elysia from "elysia";
import { authMiddleware } from "../middlewares/auth.middleware";
import { noteController } from "../controllers/note.controller";
import { updateNoteSchema } from "../types";

export const noteRoutes = new Elysia({ prefix: "/notes" })
  .use(authMiddleware)
  .get("/", noteController.list)
  .post("/", noteController.create)
  .get("/trash", noteController.listDeleted)

  .get("/:id", noteController.getOne)
  .patch("/:id", noteController.update, { body: updateNoteSchema })
  .delete("/:id", noteController.delete)
  .patch("/:id/restore", noteController.restore)
  .delete("/:id/purge", noteController.permanentDelete);
