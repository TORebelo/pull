import Link from "next/link";

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
            <section className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
                <h1 className="text-xl font-semibold text-[var(--color-ink)]">Discover</h1>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Browse public shared items by category.</p>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <Link href="/discover/projects" className="rounded-full border border-amber-950/10 px-3 py-1.5 hover:bg-[var(--color-surface-2)]">
                        Projects
                    </Link>
                    <Link href="/discover/music" className="rounded-full border border-amber-950/10 px-3 py-1.5 hover:bg-[var(--color-surface-2)]">
                        Music
                    </Link>
                    <Link href="/discover/movies-series" className="rounded-full border border-amber-950/10 px-3 py-1.5 hover:bg-[var(--color-surface-2)]">
                        Movies / Series
                    </Link>
                </div>
            </section>

            {children}
        </div>
    );
}
