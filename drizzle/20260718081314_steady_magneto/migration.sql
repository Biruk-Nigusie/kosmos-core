ALTER TABLE "verification_codes" RENAME COLUMN "token" TO "code";--> statement-breakpoint
ALTER TABLE "verification_codes" ALTER COLUMN "code" SET DATA TYPE varchar(6) USING "code"::varchar(6);