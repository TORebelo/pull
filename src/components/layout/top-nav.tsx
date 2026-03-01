"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function TopNav() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

    if (pathname === "/tweet") {
        return null;
    }

    return (
        <header className="sticky top-0 z-20 border-b border-amber-950/10 bg-[var(--color-surface)]/90 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-ink-soft)]">
                    <Link href="/feed" className="font-semibold text-[var(--color-ink)]">
                        Pull
                    </Link>
                    <Link href="/discover/projects">Projects</Link>
                    <Link href="/discover/music">Music</Link>
                    <Link href="/discover/movies-series">Movies/Series</Link>
                </div>

                {session?.user ? (
                    <div className="flex items-center gap-3">
                        <Link href={`/u/${session.user.handle}`} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                            @{session.user.handle}
                        </Link>
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="rounded-full border border-amber-950/10 px-3 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-surface-2)]"
                        >
                            Sign out
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/auth"
                            className="rounded-full border border-amber-950/10 px-3 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-surface-2)]"
                        >
                            Email login
                        </Link>
                        {googleEnabled ? (
                            <button
                                type="button"
                                onClick={() => signIn("google")}
                                className="rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-sm text-[var(--color-surface)] transition hover:opacity-90"
                            >
                                Sign in with Google
                            </button>
                        ) : null}
                    </div>
                )}
            </nav>
        </header>
    );
}
