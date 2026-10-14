import type * as React from "react";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}): React.ReactElement {
  return (
    <section className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        This screen is scaffolded and will be implemented in a following milestone.
      </div>
    </section>
  );
}
