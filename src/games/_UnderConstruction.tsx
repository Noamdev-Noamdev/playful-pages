import { Construction } from "lucide-react";

export function UnderConstruction({ name }: { name: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-foreground bg-muted p-10 text-center sm:p-16">
      <Construction className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
      <p className="mt-4 font-display text-2xl font-extrabold capitalize">
        {name} — under construction
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        This game is temporarily unavailable while we build something great.
      </p>
    </div>
  );
}
