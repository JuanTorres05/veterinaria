/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  CheckCircle,
  WarningCircle,
  Info,
  X,
  Question,
} from '@phosphor-icons/react';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const resolverRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((type, message, duration = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const notify = {
    success: (msg) => pushToast('success', msg),
    error: (msg) => pushToast('error', msg, 5500),
    info: (msg) => pushToast('info', msg),
  };

  const confirm = useCallback(
    ({
      title = 'Confirmar acción',
      message,
      confirmLabel = 'Confirmar',
      cancelLabel = 'Cancelar',
      tone = 'primary',
    }) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialog({ mode: 'confirm', title, message, confirmLabel, cancelLabel, tone });
      }),
    []
  );

  const promptInput = useCallback(
    ({
      title = 'Ingresar información',
      message,
      placeholder = 'Escribe aquí...',
      confirmLabel = 'Aceptar',
      cancelLabel = 'Cancelar',
    }) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setPromptValue('');
        setDialog({ mode: 'prompt', title, message, placeholder, confirmLabel, cancelLabel, tone: 'danger' });
      }),
    []
  );

  const closeDialog = (result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm, promptInput }}>
      {children}

      {/* Toasts flotantes en esquina superior derecha */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const styles =
            t.type === 'error'
              ? 'bg-white border-rose-200 text-rose-900 shadow-lg shadow-rose-950/10'
              : t.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-900 shadow-lg shadow-emerald-950/10'
              : 'bg-white border-sky-200 text-sky-900 shadow-lg shadow-sky-950/10';
          const Icon =
            t.type === 'error'
              ? WarningCircle
              : t.type === 'success'
              ? CheckCircle
              : Info;
          const iconColor =
            t.type === 'error'
              ? 'text-rose-600'
              : t.type === 'success'
              ? 'text-emerald-600'
              : 'text-sky-600';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${styles} animate-fade-in`}
            >
              <Icon size={19} weight="fill" className={`${iconColor} flex-shrink-0 mt-0.5`} />
              <p className="text-xs font-semibold leading-relaxed flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación / Prompt estilo DataVet */}
      {dialog && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    dialog.tone === 'danger'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}
                >
                  <Question size={22} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900">{dialog.title}</h3>
                  {dialog.message && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dialog.message}</p>
                  )}
                </div>
              </div>

              {dialog.mode === 'prompt' && (
                <input
                  type="text"
                  autoFocus
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={dialog.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') closeDialog(promptValue);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-600"
                />
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => closeDialog(dialog.mode === 'prompt' ? null : false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => closeDialog(dialog.mode === 'prompt' ? promptValue : true)}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${
                    dialog.tone === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-sky-700 hover:bg-sky-600'
                  }`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback debe usarse dentro de <FeedbackProvider>');
  return ctx;
}
