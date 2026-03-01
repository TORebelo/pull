"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

import { EmbedPreview } from "@/components/feed/embed-preview";
import { FeedPost } from "@/components/feed/types";

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export function PostCard({
    post,
    onLikeChanged,
}: {
    post: FeedPost;
    onLikeChanged: () => Promise<void>;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const canDelete = session?.user?.id === post.author.id;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleLike = async () => {
        if (!session?.user) {
            await signIn();
            return;
        }

        await fetch("/api/likes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId: post.id }),
        });

        await onLikeChanged();
    };

    const voteOnPoll = async (pollId: string, optionId: string) => {
        if (!session?.user) {
            await signIn();
            return;
        }

        await fetch("/api/polls/vote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pollId,
                optionId,
            }),
        });

        await onLikeChanged();
    };

    const deletePost = async () => {
        if (!canDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        const response = await fetch(`/api/posts/${post.id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            setIsDeleting(false);
            return;
        }

        setShowDeleteConfirm(false);
        setIsDeleting(false);

        if (pathname.startsWith("/post/")) {
            router.push("/feed");
            router.refresh();
            return;
        }

        await onLikeChanged();
    };

    return (
        <article className="rounded-xl border border-amber-950/10 bg-[var(--color-surface)] p-3">
            <div className="flex items-start justify-between gap-3 text-sm text-[var(--color-ink-soft)]">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-amber-950/10 bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-ink)]">
                        {post.author.image ? (
                            <img src={post.author.image} alt={`${post.author.handle} avatar`} className="h-full w-full object-cover" />
                        ) : (
                            <span>{post.author.handle.slice(0, 2).toUpperCase()}</span>
                        )}
                    </div>

                    <div>
                        <Link href={`/u/${post.author.handle}`} className="font-medium text-[var(--color-ink)]">
                            @{post.author.handle}
                        </Link>
                        <p className="text-xs">{formatDate(post.createdAt)}</p>
                    </div>
                </div>

                <Link
                    href={`/post/${post.id}`}
                    className="rounded-md border border-amber-950/10 px-2 py-1 text-xs text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-2)]"
                >
                    Open thread
                </Link>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">{post.content}</p>

            {post.embedUrl ? <EmbedPreview url={post.embedUrl} /> : null}

            {post.sourceProfileItem ? (
                <div className="mt-2 rounded-lg bg-[var(--color-surface-2)] p-2.5 text-sm">
                    <p className="font-medium text-[var(--color-ink)]">
                        Shared {post.sourceProfileItem.type.toLowerCase().replace("_", "/")} item
                    </p>
                    <p className="text-[var(--color-ink-soft)]">{post.sourceProfileItem.title}</p>
                    {post.sourceProfileItem.url ? (
                        <a href={post.sourceProfileItem.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-link)]">
                            Open link
                        </a>
                    ) : null}
                </div>
            ) : null}

            {post.poll ? (
                <div className="mt-2 rounded-lg bg-[var(--color-surface-2)] p-2.5 text-sm">
                    <p className="font-medium text-[var(--color-ink)]">Poll: {post.poll.question}</p>
                    <div className="mt-2 grid gap-2">
                        {post.poll.options.map((option) => {
                            const totalVotes = post.poll?.totalVotes ?? 0;
                            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                            const isSelected = post.poll?.viewerVotedOptionId === option.id;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => void voteOnPoll(post.poll!.id, option.id)}
                                    className={`rounded-lg border px-3 py-2 text-left transition ${isSelected
                                        ? "border-amber-700/40 bg-amber-900/10"
                                        : "border-amber-950/10 bg-transparent hover:bg-amber-900/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[var(--color-ink)]">{option.text}</span>
                                        <span className="text-xs text-[var(--color-ink-soft)]">
                                            {option.votes} votes · {percentage}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                        {post.poll.totalVotes} total votes
                    </p>
                </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {post.topics.map((topic) => (
                    <span key={topic.slug} className="rounded-full bg-amber-900/10 px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
                        #{topic.label}
                    </span>
                ))}
            </div>

            <div className="mt-2 flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void toggleLike()}
                        aria-label="React to post"
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition ${post.viewerLiked
                            ? "border-emerald-700/40 bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20"
                            : "border-amber-950/10 text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                            }`}
                    >
                        <span aria-hidden="true">{post.viewerLiked ? "♥" : "♡"}</span>
                        <span>{post.likeCount}</span>
                    </button>

                    <Link
                        href={`/post/${post.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-950/10 px-2.5 py-1 text-xs text-[var(--color-ink)] transition hover:bg-[var(--color-surface-2)]"
                    >
                        <span aria-hidden="true">💬</span>
                        <span>{post.replyCount}</span>
                    </Link>
                </div>

                {canDelete ? (
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-700/30 bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-800 transition hover:border-red-700/40 hover:bg-red-600/20"
                    >
                        <span aria-hidden="true">🗑</span>
                        <span>Delete</span>
                    </button>
                ) : null}
            </div>

            {showDeleteConfirm ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
                    <div className="w-full max-w-sm rounded-xl border border-red-900/20 bg-[var(--color-surface)] p-4 shadow-xl">
                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Delete this post?</h3>
                        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                            This action is permanent and cannot be undone.
                        </p>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="rounded-md border border-amber-950/10 px-3 py-1.5 text-xs text-[var(--color-ink)] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void deletePost()}
                                disabled={isDeleting}
                                className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete post"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </article>
    );
}
