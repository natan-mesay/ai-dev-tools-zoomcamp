import { AlertCircle, Bell, CheckCircle2, Info, X } from 'lucide-react';
import React, { createContext, useContext, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
}

interface ToastContextType {
  showToast: (type: 'success' | 'info' | 'warning' | 'alert', title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'info' | 'warning' | 'alert', title: string, message: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-900/90 text-white border-emerald-700',
            info: 'bg-slate-900/90 text-white border-slate-700',
            warning: 'bg-amber-900/90 text-white border-amber-700',
            alert: 'bg-indigo-900/95 text-white border-indigo-500 shadow-indigo-500/30',
          }[toast.type];

          const Icon = {
            success: CheckCircle2,
            info: Info,
            warning: AlertCircle,
            alert: Bell,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${bgColors}`}
            >
              <div className="p-1 rounded-lg bg-white/10 shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold truncate">{toast.title}</h4>
                  <span className="text-[10px] opacity-60 shrink-0">{toast.timestamp}</span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
