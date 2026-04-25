/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToastRef = useRef<{ message: string; time: number } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const now = Date.now();
    
    // Deduplication: prevent identical toasts within 500ms
    if (
      lastToastRef.current && 
      lastToastRef.current.message === message && 
      now - lastToastRef.current.time < 500
    ) {
      return;
    }
    
    lastToastRef.current = { message, time: now };
    const id = now + Math.random(); // Ensure unique ID even in same ms

    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none w-full max-w-xs">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md
                ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : ''}
                ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : ''}
                ${toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' : ''}
                ${toast.type === 'info' ? 'bg-indigo-500/90 border-indigo-400 text-white' : ''}
              `}>
                <div className="shrink-0">
                  {toast.type === 'success' && <CheckCircle size={20} />}
                  {toast.type === 'error' && <AlertCircle size={20} />}
                  {toast.type === 'warning' && <AlertTriangle size={20} />}
                  {toast.type === 'info' && <Info size={20} />}
                </div>
                <p className="flex-1 text-sm font-bold leading-tight">{toast.message}</p>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
