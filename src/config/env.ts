import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(9000),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.log("Invalid env vars");
  console.error(parsedEnv.error.format);
  process.exit(1);
}
export const env = parsedEnv.data;
