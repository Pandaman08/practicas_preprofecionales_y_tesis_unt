'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  description?: string;
  confirmOnCloseWhenDirty?: boolean;
  isDirty?: boolean;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-2xl',
  description,
  confirmOnCloseWhenDirty = false,
  isDirty = false,
}: ModalProps) {
  const handleRequestClose = () => {
    if (confirmOnCloseWhenDirty && isDirty) {
      const shouldClose = window.confirm('Tienes cambios sin guardar. ¿Deseas cerrar?');
      if (!shouldClose) return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, confirmOnCloseWhenDirty, isDirty]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        onClick={handleRequestClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] animate-[modalFadeIn_.18s_ease-out]"
        aria-label="Cerrar modal"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidthClassName} animate-[modalScaleIn_.22s_ease-out] rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[72vh] overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? <footer className="border-t border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">{footer}</footer> : null}
      </section>

      <style jsx>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
