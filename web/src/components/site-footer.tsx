import { PomsoftLogoLink, POMSOFT_EMAIL, POMSOFT_WEBSITE, PUBLISHER_NAME } from "@/components/pomsoft-logo-link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Powered by</p>
        <PomsoftLogoLink surface="light" height={48} />
        <p className="max-w-lg text-sm text-muted-foreground">
          <strong className="text-foreground">Debate Fact Checker</strong> — YouTube fact-checking with live
          agent verification, rhetoric analysis, and cited claim verdicts.
        </p>
        <p className="text-sm">
          <a href={`mailto:${POMSOFT_EMAIL}`} className="text-primary hover:underline">
            {POMSOFT_EMAIL}
          </a>
          <span className="text-muted-foreground"> · </span>
          <a href={POMSOFT_WEBSITE} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            pomsoft.net
          </a>
        </p>
        <p className="text-xs text-muted-foreground">© {year} {PUBLISHER_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
