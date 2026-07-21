import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env";
import { db } from "../db/db";
import { note_collaborators, notes, profiles } from "../db/schema";
import { and, eq } from "drizzle-orm";
//initialize and enable websocket
export const noteWs = new Elysia({ websocket: {} })
  .use(jwt({ name: "jwt", secret: env.JWT_SECRET }))
  .ws("/ws/:noteId", {
    params: t.Object({ noteId: t.String() }),
    async open(ws: any) {
      const token = ws.data.headers.authorization?.split(" ")[1];
      if (!token) return ws.close();
      const user = await ws.data.jwt.verify(token);
      if (!user) return ws.close();

      //  check if the user is the owner in the 'notes' table
      const [isOwner] = await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.id, ws.data.params.noteId),
            eq(notes.user_id, user.userId as string),
          ),
        );

      // check if the user is a collaborator
      const [isCollaborator] = await db
        .select()
        .from(note_collaborators)
        .where(
          and(
            eq(note_collaborators.note_id, ws.data.params.noteId),
            eq(note_collaborators.user_id, user.userId as string),
          ),
        );

      if (!isOwner && !isCollaborator) return ws.close();
      //user joined
      const [userProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.user_id, user.userId as string));

      // attach user identity to the websocket data context
      ws.data.user = {
        userId: user.userId,
        displayName: userProfile?.display_name || "Anonymous",
        avatarUrl: userProfile?.avatar_url || null,
      };

      // broadcast a new user has joined
      ws.publish(ws.data.params.noteId, {
        type: "USER_JOINED",
        user: ws.data.user,
      });
      ws.subscribe(ws.data.params.noteId);
    },
    message(ws, message) {
      try {
        const data = JSON.parse(
          typeof message === "string" ? message : JSON.stringify(message),
        );
        if (!data.type) {
          return;
        }
        const payload = {
          ...data,
          sender: (ws.data as any).user?.userId,
        };
        //attach user's Id as sender
        ws.publish(ws.data.params.noteId, payload);
      } catch (e) {
        console.log(e);
      }
    },
    //user left
    close(ws: any) {
      //check if the user is authenticated
      if (ws.data?.user) {
        ws.publish(ws.data.params.noteId, {
          type: "USER_LEFT",
          user: ws.data.user,
        });
      }
    },
  });
