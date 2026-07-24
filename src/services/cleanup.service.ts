import { db } from "../db/db";
import { folders, notes } from "../db/schema";
import { and, isNotNull, lt } from "drizzle-orm";

export async function purgeTrash() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    console.log("--- Running folder/note cleanup---");

    // permanently delete notes older than 30 days
    const deletedNotes = await db
      .delete(notes)
      .where(
        and(isNotNull(notes.deleted_at), lt(notes.deleted_at, thirtyDaysAgo)),
      )
      .returning();

    // permanently delete folders older than 30 days
    const deletedFolders = (await db
      .delete(folders)
      .where(
        and(
          isNotNull(folders.deleted_at),
          lt(folders.deleted_at, thirtyDaysAgo),
        ),
      )
      .returning()) as any;

    if (deletedNotes.length > 0 || deletedFolders.length > 0) {
      console.log(
        `--- Purged ${deletedNotes.length} notes and ${deletedFolders.length} folders from trash.`,
      );
    } else {
      console.log("--- Trash is clean ---");
    }
  } catch (error) {
    console.error("--- Error running --- cleanup:", error);
  }
}

// start the background worker interval
export function startTrashCleanupCron() {
  // Run once immediately on server startup
  purgeTrash();

  // run every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(purgeTrash, TWENTY_FOUR_HOURS);
}
