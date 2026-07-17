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
