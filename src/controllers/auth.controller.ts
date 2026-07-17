import { AuthService } from "../services/auth.service";
import { Context } from "elysia";
import { registrationType } from "../types";

export const authController = {
  register: async ({ body, set }: Context) => {
    const data = body as registrationType;
    const existingUser = await AuthService.findUserByEmail(data.email);

    if (existingUser) {
      set.status = 400;
      return { error: "User already exists" };
    }
    const newUser = await AuthService.createUser(data);

    set.status = 201;
    return {
      message: "User created",
      user: newUser,
    };
  },
};
