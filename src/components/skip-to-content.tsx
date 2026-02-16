export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-modal)] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm"
    >
      Skip to main content
    </a>
  );
}
