CREATE TYPE "user_actions" AS ENUM('create', 'update', 'delete', 'share');--> statement-breakpoint
CREATE TYPE "action_on" AS ENUM('note', 'folder', 'user_profile', 'setting');--> statement-breakpoint
CREATE TYPE "note_type" AS ENUM('document', 'whiteboard');--> statement-breakpoint
CREATE TYPE "permission_level" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TYPE "system_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "token_type" AS ENUM('email_verification', 'password_reset');--> statement-breakpoint
CREATE TABLE "folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"parent_folder_id" uuid,
	"path" ltree,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"note_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"permission" "permission_level" NOT NULL,
	CONSTRAINT "unique_note_user_idx" UNIQUE("note_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "note_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"note_id" uuid,
	"email" varchar(255),
	"invited_by_user_id" uuid NOT NULL,
	"permission" "permission_level" NOT NULL,
	"status" "invitation_status" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_note_email_idx" UNIQUE("note_id","email")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"folder_id" uuid,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" "note_type" DEFAULT 'document'::"note_type" NOT NULL,
	"status" "status" DEFAULT 'draft'::"status" NOT NULL,
	"content" jsonb,
	"canvas_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "user_slug_idx" UNIQUE("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"display_name" varchar(100),
	"avatar_url" text,
	"bio" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"action" "user_actions" NOT NULL,
	"entity_type" "action_on" NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"device_info" jsonb,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY,
	"notification_enabled" boolean DEFAULT false,
	"preferences" jsonb,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"role" "system_role" DEFAULT 'user'::"system_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"type" "token_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "path_gist_idx" ON "folder" USING gist ("path");--> statement-breakpoint
CREATE INDEX "note_user_idx" ON "note_collaborators" ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "active_notes_idx" ON "notes" ("id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "refresh_token_idx" ON "user_sessions" ("refresh_token");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_folder_id_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "folder"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_collaborators" ADD CONSTRAINT "note_collaborators_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_collaborators" ADD CONSTRAINT "note_collaborators_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_invitations" ADD CONSTRAINT "note_invitations_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id");--> statement-breakpoint
ALTER TABLE "note_invitations" ADD CONSTRAINT "note_invitations_invited_by_user_id_users_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;