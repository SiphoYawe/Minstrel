'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/features/auth';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <span className="font-mono text-caption text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You need to be signed in to view settings.
          </p>
          <Link
            href="/login?redirectTo=/settings"
            className="mt-4 inline-block text-caption text-primary transition-colors duration-micro hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  async function handleDeleteAccount() {
    // Placeholder — full implementation in a future story with server action
    console.warn('Account deletion requested. Server-side implementation pending.');
    router.push('/');
  }

  return (
    <div className="min-h-svh bg-background px-6 py-8">
      <div className="mx-auto w-full max-w-xl">
        {/* Navigation */}
        <Link
          href="/play"
          className="text-caption text-muted-foreground transition-colors duration-micro hover:text-primary"
        >
          &larr; Back to practice
        </Link>

        {/* Page header */}
        <div className="mt-6 mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Settings</p>
          <div className="mt-2 h-px w-12 bg-primary" />
        </div>

        {/* Profile section */}
        <section className="border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Profile
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-1 font-mono text-sm text-foreground">{user.email}</p>
            </div>
            {user.displayName && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Display Name
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">{user.displayName}</p>
              </div>
            )}
          </div>
        </section>

        {/* API Keys section */}
        <section className="mt-4 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            API Keys
          </h2>
          <p className="mt-3 text-caption text-muted-foreground">
            Configure your LLM API keys &mdash; coming soon
          </p>
        </section>

        {/* Preferences section */}
        <section className="mt-4 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
          <p className="mt-3 text-caption text-muted-foreground">
            Personalization options &mdash; coming soon
          </p>
        </section>

        {/* Actions */}
        <section className="mt-8 flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={signOut}>
            Sign Out
          </Button>

          <div className="border-t border-border pt-6">
            <h2 className="font-mono text-caption uppercase tracking-wider text-[#E8C77B]">
              Danger Zone
            </h2>
            <p className="mt-2 text-caption text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4 w-full">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all data — sessions, progress,
                    drills, everything. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:brightness-110"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}
