"use client";

import { KeyboardEvent, useMemo, useState } from "react";

import { EmbedPreview } from "@/components/feed/embed-preview";
import { PostCard } from "@/components/feed/post-card";
import { FeedPost } from "@/components/feed/types";

type ThreadReply = {
    id: string;
    postId: string;
    parentReplyId: string | null;
    content: string;
    embedUrl: string | null;
    createdAt: string;
    user: {
        id: string;
        handle: string;
        name: string | null;
        image: string | null;
    };
};

type ReplyComposerState = {
    parentReplyId: string | null;
    content: string;
    embedUrl: string;
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const buildDepthMap = (replies: ThreadReply[]) => {
    const map = new Map<string, number>();

    const getDepth = (reply: ThreadReply): number => {
        if (!reply.parentReplyId) return 0;
        if (map.has(reply.id)) return map.get(reply.id) ?? 0;

        const parent = replies.find((entry) => entry.id === reply.parentReplyId);
        const depth = parent ? Math.min(getDepth(parent) + 1, 4) : 0;
        map.set(reply.id, depth);
        return depth;
    };

    for (const reply of replies) {
        map.set(reply.id, getDepth(reply));
    }

    return map;
};

export function ThreadClient({
    initialPost,
    initialReplies,
}: {
    initialPost: FeedPost;
    initialReplies: ThreadReply[];
}) {
    const [post, setPost] = useState(initialPost);
    const [replies, setReplies] = useState(initialReplies);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [composer, setComposer] = useState<ReplyComposerState>({
        parentReplyId: null,
        content: "",
        embedUrl: "",
    });

    const depthMap = useMemo(() => buildDepthMap(replies), [replies]);

    const reloadThread = async () => {
        const [postResponse, repliesResponse] = await Promise.all([
            fetch(`/api/posts/${post.id}`),
            fetch(`/api/posts/${post.id}/replies`),
        ]);

        if (postResponse.ok) {
            const postPayload = (await postResponse.json()) as { post: FeedPost };
            setPost(postPayload.post);
        }

        if (repliesResponse.ok) {
            const repliesPayload = (await repliesResponse.json()) as { replies: ThreadReply[] };
            setReplies(repliesPayload.replies);
        }
    };

    const submitReply = async () => {
        const content = composer.content.trim();
        const embedUrl = composer.embedUrl.trim();

        if (!content && !embedUrl) {
            return;
        }

        setIsSubmitting(true);

        await fetch(`/api/posts/${post.id}/replies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                parentReplyId: composer.parentReplyId ?? undefined,
                content: content || undefined,
                embedUrl: embedUrl || undefined,
            }),
        });

        setComposer({
            parentReplyId: null,
            content: "",
            embedUrl: "",
        });
        setIsSubmitting(false);
        await reloadThread();
    };

    const onReplyComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!isSubmitting) {
                void submitReply();
            }
        }
    };

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6">
            <PostCard post={post} onLikeChanged={reloadThread} />

            <section className="rounded-xl border border-amber-950/10 bg-[var(--color-surface)] p-3">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">Conversation</h2>

                {composer.parentReplyId ? (
                    <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                        Replying in thread ·{" "}
                        <button
                            type="button"
                            onClick={() =>
                                setComposer((current) => ({
                                    ...current,
                                    parentReplyId: null,
                                }))
                            }
                            className="text-[var(--color-link)]"
                        >
                            cancel
                        </button>
                    </p>
                ) : null}

                <div className="mt-2 grid gap-2">
                    <textarea
                        value={composer.content}
                        onChange={(event) =>
                            setComposer((current) => ({
                                ...current,
                                content: event.target.value,
                            }))
                        }
                        onKeyDown={onReplyComposerKeyDown}
                        placeholder="Write a reply..."
                        className="min-h-20 rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                    />

                    <input
                        value={composer.embedUrl}
                        onChange={(event) =>
                            setComposer((current) => ({
                                ...current,
                                embedUrl: event.target.value,
                            }))
                        }
                        placeholder="Embed URL (optional)"
                        className="rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none"
                    />

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => void submitReply()}
                            disabled={isSubmitting}
                            className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)] disabled:opacity-50"
                        >
                            {isSubmitting ? "Sending..." : "Reply"}
                        </button>
                    </div>
                </div>

                <div className="mt-3 grid gap-2">
                    {replies.map((reply) => {
                        const depth = depthMap.get(reply.id) ?? 0;
                        return (
                            <article
                                key={reply.id}
                                className="rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] p-2.5"
                                style={{ marginLeft: `${depth * 18}px` }}
                            >
                                <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                                    <p className="font-medium text-[var(--color-ink)]">@{reply.user.handle}</p>
                                    <span>{formatDate(reply.createdAt)}</span>
                                </div>

                                {reply.content ? (
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{reply.content}</p>
                                ) : null}

                                {reply.embedUrl ? <EmbedPreview url={reply.embedUrl} /> : null}

                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setComposer((current) => ({
                                                ...current,
                                                parentReplyId: reply.id,
                                            }))
                                        }
                                        className="text-xs text-[var(--color-link)]"
                                    >
                                        Reply in thread
                                    </button>
                                </div>
                            </article>
                        );
                    })}

                    {replies.length === 0 ? (
                        <p className="text-sm text-[var(--color-ink-soft)]">No replies yet.</p>
                    ) : null}
                </div>
            </section>
        </section>
    );
}
