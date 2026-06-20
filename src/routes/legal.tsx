import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import Footer from "@/components/Footer";
import { MarkdownDocument } from "@/components/MarkdownDocument";
import { SiteNav } from "@/components/SiteNav";
import legalNoticeMarkdown from "@/content/legal-notice.md?raw";

const PAGE_TITLE = "Legal Notice — Playpile";
const PAGE_DESCRIPTION = "Legal Notice for Playpile.";
const PAGE_URL = "https://playpile.org/legal";

export const Route = createFileRoute("/legal")({
  component: LegalPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <section className="mt-8 rounded-3xl border-2 border-foreground bg-card p-6 sm:p-8">
          <MarkdownDocument markdown={legalNoticeMarkdown} />
        </section>

        <Footer />
      </main>
    </div>
  );
}
