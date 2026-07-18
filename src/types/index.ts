import { t } from "elysia";

export interface DeviceMetadata {
  browser: string;
  os: string;
  ip_address: string;
  is_mobile: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";

  // Accessibility
  highContrastMode: boolean;
  keyboardShortcuts: boolean;

  // Notifications
  notifications: {
    mentions: boolean;
    sharedNotes: boolean;
    digestEmails: boolean;
  };

  // UI State
  sidebarCollapsed: boolean;
  defaultEditorView: "markdown" | "rich-text";
}

export const registrationSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({
    minLength: 8,
    pattern: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$",
  }),
});

export const verificationSchema = t.Object({
  userId: t.String({ format: "uuid" }),
  code: t.String({
    minLength: 6,
    maxLength: 6,
    pattern: "^[0-9]{6}$", //exactly 6 digits
  }),
});

export const resendSchema = t.Object({
  email: t.String({ format: "email" }),
});

export const loginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const forgotPasswordSchema = t.Object({
  email: t.String({ format: "email" }),
});

export const resetPasswordSchema = t.Object({
  email: t.String({ format: "email" }),
  code: t.String({ minLength: 6, maxLength: 6 }),
  newPassword: t.String({ minLength: 8 }),
});
export type resendType = typeof resendSchema.static;
export type verificationType = typeof verificationSchema.static;
export type registrationType = typeof registrationSchema.static;
export type loginType = typeof loginSchema.static;
export type forgotPasswordType = typeof forgotPasswordSchema.static;
export type resetPasswordType = typeof resetPasswordSchema.static;
