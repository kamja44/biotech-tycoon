"use client";

import { motion } from "framer-motion";

interface ModalProps {
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}

export default function Modal({
  onClose,
  maxWidth = "max-w-md",
  children,
}: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-card-bg border border-card-border rounded-xl p-6 w-full ${maxWidth}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
