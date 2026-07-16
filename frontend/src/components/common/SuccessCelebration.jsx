import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SuccessCelebration({ message, onComplete }) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Fast, snappy 2 second celebration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-main)]/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative flex flex-col items-center p-8"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 rounded-full bg-emerald-500/20 blur-[100px]" />
        
        {/* Icon */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.1 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
        >
          <Check size={48} className="text-white" />
          
          {/* Sparkles */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -right-4 -top-4 text-emerald-300"
          >
            <Sparkles size={28} />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -20, 20, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute -left-3 -bottom-3 text-emerald-300"
          >
            <Sparkles size={24} />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-2xl font-bold text-[var(--color-text-main)] text-center tracking-tight"
        >
          {message || t("common.success", "Success!")}
        </motion.h2>
      </motion.div>
    </div>
  );
}
