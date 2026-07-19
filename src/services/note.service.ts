import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../db/db";
import { notes } from "../db/schema";
import { createNoteType, updateNoteType } from "../types";
export const NoteService = {
  async createNote(userId: string, data: createNoteType) {
    //generate slung
    const slung = data.title
      .toLowerCase()
      .replace(/\s+/g, "-") //replace space with -
      .replace(/[^a-z0-9-]/g, ""); //remove special characters
    const [newNote] = await db
      .insert(notes)
      .values({
        user_id: userId,
        folder_id: data.folderId,
        title: data.title,
        slug: slung,
        type: data.type || "document",
        content: data.content || {},
      })
      .returning();
    return newNote;
  },
  async getNotesByFolder(userId: string, folderId?: string) {
    return await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.user_id, userId),
          isNull(notes.deleted_at),
          folderId ? eq(notes.folder_id, folderId) : undefined,
        ),
      );
  },
  async getNoteById(userId: string, noteId: string) {
    const result = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.user_id, userId), //not belongs to this user
        ),
      );

    return result[0]; //single note or undefined
  },
  async updateNote(userId: string, noteId: string, data: updateNoteType) {
    const [updatedNote] = await db
      .update(notes)
      .set(data) //updated automatically
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .returning();

    return updatedNote;
  },
  async softDeleteNote(userId: string, noteId: string) {
    const [deletedNote] = await db
      .update(notes)
      .set({
        deleted_at: new Date(), // sets current time as deleted at
      })
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .returning();

    return deletedNote;
  },
  async permanentDeleteNote(userId: string, noteId: string) {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .returning();

    return result.length > 0;
  },
  async getDeletedNotes(userId: string) {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.user_id, userId), isNotNull(notes.deleted_at)));
  },
  async restoreNote(userId: string, noteId: string) {
    const [restoredNote] = await db
      .update(notes)
      .set({
        //restore notes
        deleted_at: null,
      })
      .where(and(eq(notes.user_id, userId), eq(notes.id, noteId)))
      .returning();

    return restoredNote;
  },
};
