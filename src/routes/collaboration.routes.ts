import { Elysia } from "elysia";
import { CollaborationController } from "../controllers/collaboration.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { inviteUserSchema, acceptInvitationSchema } from "../types";

export const collaborationRoutes = new Elysia({ prefix: "/collaboration" })
  .use(authMiddleware)
  .post(
    "/invite",
    async ({ body, user }) => {
      return await CollaborationController.invite(body, user.id);
    },
    { body: inviteUserSchema },
  )

  .post(
    "/accept",
    async ({ body, user }) => {
      return await CollaborationController.accept(body, user.id);
    },
    { body: acceptInvitationSchema },
  );
