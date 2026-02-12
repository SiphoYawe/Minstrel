'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      gap={8}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          warning: 'group-[.toaster]:!border-l-2 group-[.toaster]:!border-l-accent-warm',
          success: 'group-[.toaster]:!border-l-2 group-[.toaster]:!border-l-accent-success',
          error: 'group-[.toaster]:!border-l-2 group-[.toaster]:!border-l-accent-error',
          info: 'group-[.toaster]:!border-l-2 group-[.toaster]:!border-l-primary',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-accent-success" />,
        info: <InfoIcon className="size-4 text-primary" />,
        warning: <TriangleAlertIcon className="size-4 text-accent-warm" />,
        error: <OctagonXIcon className="size-4 text-accent-error" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--card))',
          '--normal-text': 'hsl(var(--card-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': '0px',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
