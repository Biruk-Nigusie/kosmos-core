import { rateLimit } from "elysia-rate-limit";

export const registerRateLimit = rateLimit({
  duration: 900000, // 15 min
  max: 5,
  errorResponse: "Too many registration attempts try again later.",
  generator: (req) => req.headers.get("x-forwarded-for") ?? "127.0.0.1",
});
