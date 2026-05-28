/// <reference types="vite-plugin-pwa/client" />

// Extend NotificationOptions to include actions (Notification API Level 2 — Chrome/Edge)
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptions {
  actions?: NotificationAction[];
  data?: unknown;
}
