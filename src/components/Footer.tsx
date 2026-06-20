export default function Footer() {
  return (
    <footer className="mt-20 border-t border-foreground/20 bg-background/5 backdrop-blur-sm py-6 text-sm text-muted-foreground">
      <nav
        aria-label="Footer navigation"
        className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
      >
        <a href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        <a href="/legal" className="hover:text-foreground transition-colors">
          Legal Notice
        </a>
        <span>© 2026 Noam van Eijmeren</span>
      </nav>
    </footer>
  );
}
