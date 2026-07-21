import { ProfileService } from "../services/profile.service";
import { updateProfileType } from "../types";

export const profileController = {
  get: async ({ user, set }: any) => {
    const profile = await ProfileService.getProfile(user.id);
    if (!profile) {
      set.status = 404;
      return { success: false, message: "Profile not found" };
    }
    return { success: true, profile };
  },

  update: async ({
    user,
    body,
    set,
  }: {
    user: any;
    body: updateProfileType;
    set: any;
  }) => {
    const updatedProfile = await ProfileService.updateProfile(user.id, body);
    if (!updatedProfile) {
      set.status = 400;
      return { success: false, message: "Could not update profile" };
    }
    return { success: true, profile: updatedProfile };
  },
};
