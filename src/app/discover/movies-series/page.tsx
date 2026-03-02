import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DiscoverMoviesSeriesPage() {
    const items = await prisma.profileItem.findMany({
        where: { type: "MOVIE_SERIES", visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            user: { select: { handle: true } },
        },
    });

    return (
        <section className="grid gap-3">
            {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
                    <p className="text-xs text-[var(--color-ink-soft)]">@{item.user.handle}</p>
                    <h2 className="mt-1 font-semibold text-[var(--color-ink)]">{item.title}</h2>
                    {item.description ? <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{item.description}</p> : null}
                    {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-[var(--color-link)]">
                            Open reference
                        </a>
                    ) : null}
                </article>
            ))}

            {items.length === 0 ? (
                <div className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-soft)]">No public movie/series shares yet.</div>
            ) : null}
        </section>
    );
}
