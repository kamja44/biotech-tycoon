import { create } from "zustand";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "danger" | "warning" | "info";
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type: Notification["type"]) => void;
  removeNotification: (id: string) => void;
}

let notifId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (message, type) => {
    const id = `notif-${++notifId}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    // 4초 후 자동 제거
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 4000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
