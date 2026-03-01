import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { ThreadClient } from "@/components/post/thread-client";
import { FeedPost } from "@/components/feed/types";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PostPage({
    params,
}: {
    params: Promise<{ postId: string }>;
}) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    handle: true,
                    name: true,
                    image: true,
                },
            },
            sourceProfileItem: {
                select: {
                    id: true,
                    type: true,
                    title: true,
                    url: true,
                },
            },
            topics: {
                include: {
                    topic: {
                        select: {
                            slug: true,
                            label: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    likes: true,
                    replies: true,
                },
            },
            likes: {
                where: {
                    ...(session?.user?.id
                        ? {
                            userId: session.user.id,
                        }
                        : {
                            userId: "",
                        }),
                },
                select: {
                    id: true,
                },
            },
            poll: {
                include: {
                    options: {
                        include: {
                            _count: {
                                select: {
                                    votes: true,
                                },
                            },
                        },
                    },
                    votes: {
                        where: {
                            ...(session?.user?.id
                                ? {
                                    userId: session.user.id,
                                }
                                : {
                                    userId: "",
                                }),
                        },
                        select: {
                            optionId: true,
                        },
                    },
                },
            },
        },
    });

    if (!post) {
        notFound();
    }

    const canAccess =
        post.visibility === "PUBLIC" ||
        (session?.user?.id ? post.authorId === session.user.id : false);

    if (!canAccess) {
        notFound();
    }

    const replies = await prisma.postReply.findMany({
        where: {
            postId,
        },
        orderBy: {
            createdAt: "asc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    handle: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    const initialPost: FeedPost = {
        id: post.id,
        content: post.content,
        embedUrl: post.embedUrl,
        createdAt: post.createdAt.toISOString(),
        likeCount: post._count.likes,
        replyCount: post._count.replies,
        viewerLiked: post.likes.length > 0,
        author: post.author,
        sourceProfileItem: post.sourceProfileItem,
        topics: post.topics.map((entry) => entry.topic),
        poll: post.poll
            ? {
                id: post.poll.id,
                question: post.poll.question,
                viewerVotedOptionId: post.poll.votes[0]?.optionId ?? null,
                totalVotes: post.poll.options.reduce(
                    (sum, option) => sum + option._count.votes,
                    0,
                ),
                options: post.poll.options.map((option) => ({
                    id: option.id,
                    text: option.text,
                    votes: option._count.votes,
                })),
            }
            : null,
    };

    return (
        <ThreadClient
            initialPost={initialPost}
            initialReplies={replies.map((reply) => ({
                id: reply.id,
                postId: reply.postId,
                parentReplyId: reply.parentReplyId,
                content: reply.content,
                embedUrl: reply.embedUrl,
                createdAt: reply.createdAt.toISOString(),
                user: reply.user,
            }))}
        />
    );
}
