import { Elysia, ValidationError } from "elysia";

export const errorHandler = (app: Elysia) =>
  app.onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      const firstError = (error as ValidationError).all[0];

      if (firstError.path === "/password") {
        return {
          success: false,
          error:
            "Password must be a mix of uppercase, lowercase, numbers, and symbols.",
        };
      }

      if (firstError.path === "/email") {
        return {
          success: false,
          error: "Please provide a valid email address.",
        };
      }

      return { success: false, error: firstError.message };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    if (
      code === "NOT_FOUND" ||
      errorMessage === "Unauthorized" ||
      errorMessage === "Invalid session"
    ) {
      set.status = 401;
      return {
        success: false,
        error: errorMessage,
      };
    }

    set.status =
      typeof set.status === "number" && set.status >= 400 ? set.status : 500;

    return {
      success: false,
      error: errorMessage,
    };
  });
