"use client";

import { useCallback, useMemo, useState } from "react";

import { PostCard } from "@/components/feed/post-card";
import { QuickComposer } from "@/components/feed/quick-composer";
import { FeedPost } from "@/components/feed/types";

const topicOptions = [
    { value: "", label: "All topics" },
    { value: "coding", label: "Coding" },
    { value: "design", label: "Design" },
    { value: "music", label: "Music" },
    { value: "movies", label: "Movies" },
    { value: "series", label: "Series" },
    { value: "projects", label: "Projects" },
    { value: "games", label: "Games" },
    { value: "life", label: "Life" },
    { value: "politics", label: "Politics" },
] as const;

const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "most_liked", label: "Most liked" },
] as const;

export function FeedClient({ initialPosts }: { initialPosts: FeedPost[] }) {
    const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
    const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("newest");
    const [topicFilter, setTopicFilter] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const query = useMemo(() => {
        const params = new URLSearchParams({ sort });
        if (topicFilter.trim()) params.set("topic", topicFilter.trim().toLowerCase());
        return params.toString();
    }, [sort, topicFilter]);

    const loadFeedFor = useCallback(async (nextSort: string, nextTopic: string) => {
        setIsLoading(true);
        const params = new URLSearchParams({ sort: nextSort });
        if (nextTopic.trim()) params.set("topic", nextTopic.trim().toLowerCase());

        const response = await fetch(`/api/feed?${params.toString()}`);
        const payload = (await response.json()) as { posts: FeedPost[] };
        setPosts(payload.posts ?? []);
        setIsLoading(false);
    }, []);

    const loadFeed = useCallback(async () => {
        setIsLoading(true);
        const response = await fetch(`/api/feed?${query}`);
        const payload = (await response.json()) as { posts: FeedPost[] };
        setPosts(payload.posts ?? []);
        setIsLoading(false);
    }, [query]);

    return (
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-6 pb-72">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-lg font-semibold text-[var(--color-ink)]">Feed</h1>

                <div className="flex items-center gap-2">
                    <select
                        value={topicFilter}
                        onChange={(event) => {
                            const nextTopic = event.target.value;
                            setTopicFilter(nextTopic);
                            void loadFeedFor(sort, nextTopic);
                        }}
                        className="rounded-lg border border-amber-950/10 bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] outline-none"
                    >
                        {topicOptions.map((option) => (
                            <option key={option.value || "all"} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sort}
                        onChange={(event) => {
                            const nextSort = event.target.value as (typeof sortOptions)[number]["value"];
                            setSort(nextSort);
                            void loadFeedFor(nextSort, topicFilter);
                        }}
                        className="rounded-lg border border-amber-950/10 bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] outline-none"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                </div>
            </div>

            {isLoading ? <p className="px-1 text-sm text-[var(--color-ink-soft)]">Loading feed...</p> : null}

            {!isLoading && posts.length === 0 ? (
                <div className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-6 text-sm text-[var(--color-ink-soft)]">
                    No posts yet for this filter.
                </div>
            ) : null}

            <div className="grid gap-3">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLikeChanged={loadFeed} />
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-amber-950/10 bg-[var(--color-surface)]/95 p-3 backdrop-blur">
                <div className="mx-auto w-full max-w-2xl">
                    <QuickComposer onCreated={loadFeed} />
                </div>
            </div>
        </section>
    );
}
