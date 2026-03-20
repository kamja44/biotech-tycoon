"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/store/notificationStore";

const TYPE_STYLES = {
  success: {
    bg: "bg-accent/20 border-accent/50",
    text: "text-accent",
    icon: "✅",
  },
  danger: {
    bg: "bg-danger/20 border-danger/50",
    text: "text-danger",
    icon: "🚨",
  },
  warning: {
    bg: "bg-warning/20 border-warning/50",
    text: "text-warning",
    icon: "⚠️",
  },
  info: {
    bg: "bg-primary/20 border-primary/50",
    text: "text-primary",
    icon: "ℹ️",
  },
};

export default function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const style = TYPE_STYLES[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`${style.bg} border rounded-xl px-4 py-3 shadow-lg pointer-events-auto`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{style.icon}</span>
                <p className={`${style.text} text-sm flex-1 leading-relaxed`}>
                  {notif.message}
                </p>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors
                    cursor-pointer text-xs flex-shrink-0 mt-0.5"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
