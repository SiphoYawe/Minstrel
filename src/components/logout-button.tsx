'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { capture, reset } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogoutConfirmationDialog } from '@/components/logout-confirmation-dialog';

export function LogoutButton() {
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const logout = async () => {
    capture('user_logged_out');
    reset();

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setShowLogoutDialog(true)}
        className="font-mono text-[11px] uppercase tracking-[0.12em]"
      >
        Sign Out
      </Button>

      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={logout}
      />
    </>
  );
}
