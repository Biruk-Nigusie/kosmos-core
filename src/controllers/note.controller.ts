import { NoteService } from "../services/note.service";
import { createNoteType, updateNoteType } from "../types";

export const noteController = {
  create: async ({ body, set, user }: any) => {
    const data = body as createNoteType;
    const note = await NoteService.createNote(user.id, data);

    set.status = 201;
    return { success: true, note };
  },

  list: async ({ query, user }: any) => {
    const notes = await NoteService.getNotesByFolder(user.id, query.folderId);
    return { success: true, notes };
  },

  getOne: async ({ params, set, user }: any) => {
    const note = await NoteService.getNoteById(user.id, params.id);
    if (!note) {
      set.status = 404;
      return { success: false, message: "Note not found" };
    }
    return { success: true, note };
  },

  update: async ({ params, body, set, user }: any) => {
    const data = body as updateNoteType;
    const updatedNote = await NoteService.updateNote(user.id, params.id, data);

    if (!updatedNote) {
      set.status = 404;
      return { success: false, message: "Note not found or access denied" };
    }
    return { success: true, note: updatedNote };
  },

  delete: async ({ params, set, user }: any) => {
    const deletedNote = await NoteService.softDeleteNote(user.id, params.id);

    if (!deletedNote) {
      set.status = 404;
      return { success: false, message: "Note not found" };
    }
    return { success: true, message: "Note moved to trash" };
  },
  permanentDelete: async ({ params, set, user }: any) => {
    const success = await NoteService.permanentDeleteNote(user.id, params.id);

    if (!success) {
      set.status = 404;
      return { success: false, message: "Note not found or already deleted" };
    }

    return { success: true, message: "Note permanently deleted" };
  },
  listDeleted: async ({ user }: any) => {
    const notes = await NoteService.getDeletedNotes(user.id);
    return { success: true, notes };
  },

  restore: async ({ params, set, user }: any) => {
    const restoredNote = await NoteService.restoreNote(user.id, params.id);

    if (!restoredNote) {
      set.status = 404;
      return {
        success: false,
        message: "Note not found or could not be restored",
      };
    }
    return { success: true, note: restoredNote };
  },
};
