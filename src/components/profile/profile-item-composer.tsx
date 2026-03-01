"use client";

import { useState } from "react";

const typeOptions = [
    { value: "PROJECT", label: "Project" },
    { value: "MUSIC", label: "Music" },
    { value: "MOVIE_SERIES", label: "Movie/Series" },
] as const;

export function ProfileItemComposer({ onCreated }: { onCreated: () => Promise<void> }) {
    const [type, setType] = useState<(typeof typeOptions)[number]["value"]>("PROJECT");
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [topics, setTopics] = useState("");
    const [publishToFeed, setPublishToFeed] = useState(true);
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (!title.trim()) return;
        setIsSubmitting(true);

        await fetch("/api/profile-items", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type,
                title: title.trim(),
                description: description.trim() || undefined,
                url: url.trim() || undefined,
                visibility,
                publishToFeed,
                topicSlugs: topics
                    .split(",")
                    .map((topic) => topic.trim().toLowerCase())
                    .filter(Boolean),
            }),
        });

        setTitle("");
        setUrl("");
        setDescription("");
        setTopics("");
        setPublishToFeed(true);
        setVisibility("PUBLIC");
        setIsSubmitting(false);
        await onCreated();
    };

    return (
        <section className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">Add journal item</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Save to profile and optionally publish it to the feed.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                    Type
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value as (typeof typeOptions)[number]["value"])}
                        className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                    >
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                    Link (optional)
                    <input
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://..."
                        className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                    />
                </label>
            </div>

            <label className="mt-3 grid gap-1 text-sm text-[var(--color-ink-soft)]">
                Title
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                />
            </label>

            <label className="mt-3 grid gap-1 text-sm text-[var(--color-ink-soft)]">
                Description
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-20 rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                />
            </label>

            <label className="mt-3 grid gap-1 text-sm text-[var(--color-ink-soft)]">
                Topics
                <input
                    value={topics}
                    onChange={(event) => setTopics(event.target.value)}
                    placeholder="project, soundtrack, sci-fi"
                    className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink-soft)]">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={publishToFeed}
                        onChange={(event) => setPublishToFeed(event.target.checked)}
                    />
                    Publish to feed
                </label>

                <label className="flex items-center gap-2">
                    Visibility
                    <select
                        value={visibility}
                        onChange={(event) => setVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
                        className="rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] px-2 py-1 text-[var(--color-ink)]"
                    >
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                    </select>
                </label>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    disabled={isSubmitting || !title.trim()}
                    onClick={() => void submit()}
                    className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-surface)] disabled:opacity-50"
                >
                    {isSubmitting ? "Saving..." : "Save item"}
                </button>
            </div>
        </section>
    );
}
