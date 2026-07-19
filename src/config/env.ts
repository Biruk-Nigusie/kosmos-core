import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  PORT: z.coerce.number().default(9000),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.log("Invalid env vars");
  console.error(parsedEnv.error.format);
  process.exit(1);
}
export const env = parsedEnv.data;
