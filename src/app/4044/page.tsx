import Link from "next/link";

export default function FourOhFourRedirectPage() {
    return (
        <section className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">404</p>
            <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Page not found</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">The page you requested does not exist.</p>
            <Link
                href="/feed"
                className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-surface)]"
            >
                Go to feed
            </Link>
        </section>
    );
}
