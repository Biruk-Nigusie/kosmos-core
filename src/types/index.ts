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

export const createFolderSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  parentId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null(), t.Literal("")]),
  ),
});
export const updateFolderSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
});

export const createNoteSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  folderId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
  type: t.Optional(t.Union([t.Literal("document"), t.Literal("whiteboard")])),
  content: t.Optional(t.Any()),
});

export const listNotesSchema = t.Object({
  folderId: t.Optional(t.String({ format: "uuid" })),
});

export const getNoteSchema = t.Object({
  id: t.String({ format: "uuid" }),
});
export const updateNoteSchema = t.Object({
  title: t.Optional(t.String()),
  folderId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null(), t.Literal("")]),
  ),
  content: t.Optional(t.Union([t.String(), t.Null()])),
});
export const inviteUserSchema = t.Object({
  noteId: t.String({ format: "uuid" }),
  email: t.String({ format: "email" }),
  permission: t.Union([t.Literal("editor"), t.Literal("viewer")]),
});

export const acceptInvitationSchema = t.Object({
  invitationId: t.String({ format: "uuid" }),
});
export type resendType = typeof resendSchema.static;
export type verificationType = typeof verificationSchema.static;
export type registrationType = typeof registrationSchema.static;
export type loginType = typeof loginSchema.static;
export type forgotPasswordType = typeof forgotPasswordSchema.static;
export type resetPasswordType = typeof resetPasswordSchema.static;
export type createFolderType = typeof createFolderSchema.static;
export type updateFolderType = typeof updateFolderSchema.static;
export type createNoteType = typeof createNoteSchema.static;
export type listNotesType = typeof listNotesSchema.static;
export type getNoteType = typeof getNoteSchema.static;
export type updateNoteType = typeof updateNoteSchema.static;
export type inviteUserType = typeof inviteUserSchema.static;
export type acceptInvitationType = typeof acceptInvitationSchema.static;
