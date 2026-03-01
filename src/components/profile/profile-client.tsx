"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { PostCard } from "@/components/feed/post-card";
import { FeedPost } from "@/components/feed/types";
import { AccountSettings } from "@/components/profile/account-settings";
import { ProfileItemComposer } from "@/components/profile/profile-item-composer";

type ProfileItem = {
    id: string;
    type: "PROJECT" | "MUSIC" | "MOVIE_SERIES";
    title: string;
    description: string | null;
    url: string | null;
    visibility: "PUBLIC" | "PRIVATE";
    createdAt: string;
    topics: Array<{ slug: string; label: string }>;
};

const sections: Array<{ type: ProfileItem["type"]; title: string }> = [
    { type: "PROJECT", title: "Projects" },
    { type: "MUSIC", title: "Music" },
    { type: "MOVIE_SERIES", title: "Movies / Series" },
];

export function ProfileClient({
    handle,
    image,
    isOwner,
    initialItems,
    initialPosts,
}: {
    handle: string;
    image: string | null;
    isOwner: boolean;
    initialItems: ProfileItem[];
    initialPosts: FeedPost[];
}) {
    const router = useRouter();
    const [items, setItems] = useState<ProfileItem[]>(initialItems);
    const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        const response = await fetch(`/api/profile-items?handle=${handle}`);
        const payload = (await response.json()) as { items: ProfileItem[] };
        setItems(payload.items ?? []);
        setIsLoading(false);
    }, [handle]);

    const loadPosts = useCallback(async () => {
        const response = await fetch(`/api/profile-posts?handle=${handle}`);
        const payload = (await response.json()) as { posts: FeedPost[] };
        setPosts(payload.posts ?? []);
    }, [handle]);

    const refreshAll = useCallback(async () => {
        await Promise.all([loadItems(), loadPosts()]);
    }, [loadItems, loadPosts]);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
            <section className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Profile</p>
                        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">@{handle}</h1>
                        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                            Your journal hub for projects, media and watch activity.
                        </p>
                    </div>

                    {isOwner ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAddItemModal(true)}
                                className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)]"
                            >
                                + New item
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAccountModal(true)}
                                className="rounded-lg border border-amber-950/10 px-3 py-1.5 text-xs text-[var(--color-ink)]"
                            >
                                Account
                            </button>
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
                {sections.map((section) => {
                    const count = items.filter((item) => item.type === section.type).length;
                    return (
                        <div key={`${section.type}-summary`} className="rounded-xl border border-amber-950/10 bg-[var(--color-surface)] p-3">
                            <p className="text-xs text-[var(--color-ink-soft)]">{section.title}</p>
                            <p className="mt-1 text-xl font-semibold text-[var(--color-ink)]">{count}</p>
                            <p className="text-xs text-[var(--color-ink-soft)]">entries</p>
                        </div>
                    );
                })}
            </section>

            <section className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--color-ink)]">Tweets</h2>
                    <span className="text-xs text-[var(--color-ink-soft)]">{posts.length}</span>
                </div>

                {posts.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)]">No tweets yet.</p>
                ) : (
                    <div className="mt-3 grid gap-3">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} onLikeChanged={refreshAll} />
                        ))}
                    </div>
                )}
            </section>

            {isLoading ? <p className="text-sm text-[var(--color-ink-soft)]">Loading profile...</p> : null}

            {sections.map((section) => {
                const sectionItems = items.filter((item) => item.type === section.type);

                return (
                    <section key={section.type} className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--color-ink)]">{section.title}</h2>
                            <span className="text-xs text-[var(--color-ink-soft)]">{sectionItems.length}</span>
                        </div>

                        {sectionItems.length === 0 ? (
                            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">No items yet.</p>
                        ) : (
                            <div className="mt-3 grid gap-3">
                                {sectionItems.map((item) => (
                                    <article key={item.id} className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-medium text-[var(--color-ink)]">{item.title}</h3>
                                            <span className="text-xs text-[var(--color-ink-soft)]">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        {item.description ? <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{item.description}</p> : null}

                                        {item.url ? (
                                            <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-[var(--color-link)]">
                                                Open link
                                            </a>
                                        ) : null}

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {item.topics.map((topic) => (
                                                <span key={topic.slug} className="rounded-full bg-amber-900/8 px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
                                                    #{topic.label}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}

            {showAddItemModal ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--color-ink)]">Add journal item</h3>
                            <button
                                type="button"
                                onClick={() => setShowAddItemModal(false)}
                                className="rounded-md border border-amber-950/10 px-2 py-1 text-xs text-[var(--color-ink)]"
                            >
                                Close
                            </button>
                        </div>
                        <ProfileItemComposer
                            onCreated={async () => {
                                await refreshAll();
                                setShowAddItemModal(false);
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {showAccountModal ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--color-ink)]">Account settings</h3>
                            <button
                                type="button"
                                onClick={() => setShowAccountModal(false)}
                                className="rounded-md border border-amber-950/10 px-2 py-1 text-xs text-[var(--color-ink)]"
                            >
                                Close
                            </button>
                        </div>
                        <AccountSettings
                            currentUsername={handle}
                            currentImage={image}
                            onUsernameChanged={(nextUsername) => {
                                setShowAccountModal(false);
                                router.push(`/u/${nextUsername}`);
                                router.refresh();
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
