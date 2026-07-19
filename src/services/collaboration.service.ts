import { eq, and } from "drizzle-orm";
import { db } from "../db/db";
import {
  note_collaborators,
  note_invitations,
  notes,
  users,
} from "../db/schema";
import { acceptInvitationType, inviteUserType } from "../types";
import { sendCollaborationEmail } from "../utils/mail";
import { env } from "bun";

export const CollaborationService = {
  async inviteUser(data: inviteUserType, senderId: string) {
    const [note] = await db
      .select({ title: notes.title, ownerId: notes.user_id })
      .from(notes)
      .where(eq(notes.id, data.noteId));

    const [sender] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, senderId));

    const [collaborator] = await db
      .select({ permission: note_collaborators.permission })
      .from(note_collaborators)
      .where(
        and(
          eq(note_collaborators.note_id, data.noteId),
          eq(note_collaborators.user_id, senderId),
        ),
      );

    const isOwner = note?.ownerId === senderId;
    const isEditor = collaborator?.permission === "editor";

    if (!isOwner && !isEditor) {
      throw new Error(
        "Unauthorized: You do not have permission to share this note.",
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [newInvitation] = await db
      .insert(note_invitations)
      .values({
        note_id: data.noteId,
        email: data.email.toLowerCase(),
        invited_by_user_id: senderId,
        permission: data.permission,
        status: "pending",
        expires_at: expiresAt,
      })
      .returning();

    const inviteLink = `${env.FRONTEND_URL}/accept-invite?id=${newInvitation.id}`;

    await sendCollaborationEmail(
      data.email,
      note.title,
      sender.email,
      inviteLink,
    );

    return newInvitation;
  },

  async acceptInvitation(data: acceptInvitationType, userId: string) {
    const [invitation] = await db
      .select()
      .from(note_invitations)
      .where(
        and(
          eq(note_invitations.id, data.invitationId),
          eq(note_invitations.status, "pending"),
        ),
      );

    if (!invitation)
      throw new Error("Invitation not found or already processed.");

    return await db.transaction(async (tx) => {
      await tx.insert(note_collaborators).values({
        note_id: invitation.note_id!,
        user_id: userId,
        permission: invitation.permission,
      });

      await tx
        .update(note_invitations)
        .set({ status: "accepted" })
        .where(eq(note_invitations.id, data.invitationId));
      return { success: true, noteId: invitation.note_id };
    });
  },
};
