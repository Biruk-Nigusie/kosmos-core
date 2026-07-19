ALTER TABLE "folder" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "active_folders_idx" ON "folder" ("id") WHERE deleted_at IS NULL;