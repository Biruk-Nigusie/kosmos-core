import { SettingsService } from "../services/settings.service";

export const SettingsController = {
  getSettings: async ({ user, set }: any) => {
    const settings = await SettingsService.getSettings(user.id);
    if (!settings) {
      set.status = 404;
      return { success: false, message: "Settings not found" };
    }
    return { success: true, settings };
  },

  updateSettings: async ({ user, body, set }: any) => {
    const { notification_enabled, preferences } = body;
    const updated = await SettingsService.updateSettings(
      user.id,
      notification_enabled,
      preferences,
    );
    set.status = 201;
    return {
      success: true,
      message: "Settings updated successfully",
      settings: updated,
    };
  },
};
