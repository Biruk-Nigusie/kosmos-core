import { Context } from "elysia";
import { FolderService } from "../services/folder.service";
import { createFolderType, updateFolderType } from "../types";

export const folderController = {
  create: async ({ body, set, user }: any) => {
    const data = body as createFolderType;
    const folder = await FolderService.createFolder(user.id, data);

    set.status = 201;
    return { success: true, folder };
  },

  list: async ({ user }: any) => {
    const folders = await FolderService.getFolders(user.id);
    return { success: true, folders };
  },

  update: async ({ params, body, set, user }: any) => {
    const data = body as updateFolderType;
    if (!data.name) {
      set.status = 400;
      return { success: false, message: "Name is required" };
    }

    const updatedFolder = await FolderService.updateFolder(
      user.id,
      params.id,
      data.name,
    );

    if (!updatedFolder) {
      set.status = 404;
      return { success: false, message: "Folder not found" };
    }
    return { success: true, folder: updatedFolder };
  },

  delete: async ({
    params,
    user,
  }: {
    params: { id: string };
    user: { id: string };
  }) => {
    return await FolderService.deleteFolder(user.id, params.id);
  },

  // Restore
  restore: async ({
    params,
    user,
  }: {
    params: { id: string };
    user: { id: string };
  }) => {
    return await FolderService.restoreFolder(user.id, params.id);
  },

  // List Trash
  listTrash: async ({ user }: { user: { id: string } }) => {
    return await FolderService.getTrash(user.id);
  },

  // Permanent Delete
  permanentDelete: async ({
    params,
    user,
  }: {
    params: { id: string };
    user: { id: string };
  }) => {
    return await FolderService.permanentDeleteFolder(user.id, params.id);
  },
};
