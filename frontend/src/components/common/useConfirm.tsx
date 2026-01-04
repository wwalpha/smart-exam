import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  hideCancel?: boolean;
};

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((message: string, opts: ConfirmOptions = {}) => {
    setOptions({
      title: opts.title || '確認',
      description: message,
      confirmText: opts.confirmText || 'OK',
      cancelText: opts.cancelText || 'キャンセル',
      variant: opts.variant || 'default',
      hideCancel: opts.hideCancel,
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef(false);
  };

  const ConfirmDialog = () => (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!options.hideCancel && (
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={options.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {options.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
};
