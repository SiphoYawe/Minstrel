'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-sm uppercase tracking-wider text-foreground">
            Sign out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-caption text-muted-foreground leading-relaxed">
            Your practice data is saved. You can resume your session when you return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono text-[11px] uppercase tracking-[0.12em]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="font-mono text-[11px] uppercase tracking-[0.12em] bg-background border border-border text-accent-warm hover:bg-card"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
