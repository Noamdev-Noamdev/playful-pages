import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { CardGrid } from "@/components/CardGrid";
import { classics } from "@/data/cards";

export const Route = createFileRoute("/classics")({
  component: Classics,
  head: () => ({
    meta: [
      { title: "Classics — playpile" },
      {
        name: "description",
        content:
          "Old favorites, freshly painted. Chess, sudoku, solitaire and other timeless games to play in your browser.",
      },
    ],
  }),
});

function Classics() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CardGrid
        eyebrow="Classics"
        title="Old favorites, freshly painted."
        subtitle="The games you already know by heart — chess, sudoku, solitaire — with a fresh coat of color."
        items={classics}
      />
    </div>
  );
}
