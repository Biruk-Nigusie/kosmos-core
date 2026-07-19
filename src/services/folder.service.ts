import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../db/db";
import { folders, notes } from "../db/schema";
import { createFolderType } from "../types";

export const FolderService = {
  async createFolder(userId: string, body: createFolderType) {
    const { name, parentId } = body;
    // 1. we need folder id to construct the path
    const newFolders = (await db
      .insert(folders)
      .values({
        user_id: userId,
        name: name,
        parent_folder_id: parentId || null,
        path: "root", // temp place holder b/c path is required
      })
      .returning()) as any[]; //trust me it returns []
    //2. build path
    const newFolder = newFolders[0];
    //ltree doesn't allow - so replace it with _
    const cleanId = newFolder.id.toString().replace(/-/g, "_");

    // build path(no parent)
    let newPath = `root.${cleanId}`;
    //has parent
    if (parentId) {
      const [parent] = await db
        .select({ path: folders.path })
        .from(folders)
        .where(eq(folders.id, parentId));

      // construct path root.w_id.p_id(assume work->project)
      newPath = `${parent.path}.${cleanId}`;
    }

    //update folder path with real path
    await db
      .update(folders)
      .set({ path: newPath })
      .where(eq(folders.id, newFolder.id));

    return { ...newFolder, path: newPath };
  },
  async updateFolder(userId: string, folderId: string, name: string) {
    const [updatedFolder] = await db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, folderId), eq(folders.user_id, userId)))
      .returning();

    return updatedFolder;
  },
  //soft delete folder
  async deleteFolder(userId: string, folderId: string) {
    return await db.transaction(async (tx) => {
      // get the folder
      const [folder] = await tx
        .select()
        .from(folders)
        .where(and(eq(folders.id, folderId), eq(folders.user_id, userId)));

      if (!folder) throw new Error("Folder not found");

      const now = new Date();

      // 1. soft delete the folder
      await tx
        .update(folders)
        .set({ deleted_at: now })
        .where(eq(folders.id, folderId));

      // 2. soft  delete sub-folders (using ltree <@ operator)
      //'<@' which means "is a child of"(find every folder whose path starts with the path of this folder)
      await tx
        .update(folders)
        .set({ deleted_at: now })
        .where(
          and(
            //folders.path is a child of folder path
            //and child folder is not the folder it self (we already soft deleted the parent)
            sql`${folders.path} <@ ${folder.path}`,
            sql`${folders.id} != ${folder.id}`,
          ),
        );

      // 3.soft delete notes in those folders
      // find all folder IDs that are descendants or the folder itself
      const subFolderIds = await tx
        .select({ id: folders.id })
        .from(folders)
        .where(sql`${folders.path} <@ ${folder.path}`);

      const ids = subFolderIds.map((f) => f.id);
      //soft delete notes
      await tx
        .update(notes)
        .set({ deleted_at: now })
        .where(inArray(notes.folder_id, ids));

      return { success: true };
    });
  },
  //get folders query that orders them by path
  async getFolders(userId: string) {
    try {
      return await db
        .select()
        .from(folders)
        .where(and(eq(folders.user_id, userId), isNull(folders.deleted_at)))
        .orderBy(asc(folders.path));
    } catch (error) {
      throw error;
    }
  },
  async restoreFolder(userId: string, folderId: string) {
    return await db.transaction(async (tx) => {
      //get the folder
      const [folder] = await tx
        .select()
        .from(folders)
        .where(and(eq(folders.id, folderId), eq(folders.user_id, userId)));

      if (!folder) throw new Error("Folder not found");

      // restore folder itself
      await tx
        .update(folders)
        .set({ deleted_at: null })
        .where(eq(folders.id, folderId));

      // restore all sub-folders
      await tx
        .update(folders)
        .set({ deleted_at: null })
        .where(
          sql`${folders.path} <@ ${folder.path} AND ${folders.id} != ${folder.id}`,
        );

      //restore all notes inside this folder and its sub-folders
      const subFolderIds = await tx
        .select({ id: folders.id })
        .from(folders)
        .where(sql`${folders.path} <@ ${folder.path}`);

      const ids = subFolderIds.map((f) => f.id);

      await tx
        .update(notes)
        .set({ deleted_at: null })
        .where(inArray(notes.folder_id, ids));

      return { success: true };
    });
  },
  async getTrash(userId: string) {
    // get all folders that are marked as deleted
    const trashedFolders = await db
      .select()
      .from(folders)
      .where(and(eq(folders.user_id, userId), isNotNull(folders.deleted_at)))
      .orderBy(asc(folders.deleted_at)); // show most recently deleted first

    const trashedNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.user_id, userId), isNotNull(notes.deleted_at)));

    return { folders: trashedFolders, notes: trashedNotes };
  },
  async permanentDeleteFolder(userId: string, folderId: string) {
    await db
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.user_id, userId)));
    //postgres handles deleting all sub-folders and notes automatically.
    return { success: true, message: "Folder permanently deleted" };
  },
};
