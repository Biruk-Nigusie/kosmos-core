import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  PORT: z.coerce.number().default(9000),
  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL" ),
  ADMIN_EMAIL: z.string().min(1, "ADMIN_EMAIL is required"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  DEVELOPMENT: z.string().min(1, "DEVELOPMENT required"),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.log("Invalid env vars");
  console.error(parsedEnv.error.format);
  process.exit(1);
}
export const env = parsedEnv.data;
