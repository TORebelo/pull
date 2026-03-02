"use client";

import Link from "next/link";

import { QuickComposer } from "@/components/feed/quick-composer";

export default function TweetPage() {
    return (
        <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-4 py-8">
            <div className="px-1">
                <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Compose</h1>
                <p className="text-sm text-[var(--color-ink-soft)]">A full-screen focus space to post without distractions.</p>
            </div>

            <QuickComposer onCreated={async () => { }} />

            <div className="px-1">
                <Link href="/feed" className="text-sm text-[var(--color-link)]">
                    Go to feed
                </Link>
            </div>
        </section>
    );
}
