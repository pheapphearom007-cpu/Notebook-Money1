import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-card text-foreground rounded-2xl shadow-2xl border border-border z-10 p-5 sm:p-6 transition-all transform scale-100 animate-scale-up mx-2 sm:mx-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${
              isDanger
                ? 'bg-destructive/15 text-destructive border border-destructive/30'
                : 'bg-secondary text-secondary-foreground border border-border'
            }`}
          >
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-foreground font-khmer">
              {title}
            </h4>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground font-khmer leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto py-2.5 active:scale-95"
          >
            {cancelText || t.common.cancel}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            className="w-full sm:w-auto py-2.5 font-bold active:scale-95"
          >
            {confirmText || t.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
};
