import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    const session = await getServerSession(authOptions);
    const { postId } = await params;

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
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const canAccess =
        post.visibility === "PUBLIC" ||
        (session?.user?.id ? post.authorId === session.user.id : false);

    if (!canAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
        post: {
            id: post.id,
            content: post.content,
            embedUrl: post.embedUrl,
            createdAt: post.createdAt,
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
        },
    });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        },
        select: {
            id: true,
            authorId: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
        where: {
            id: postId,
        },
    });

    return NextResponse.json({ ok: true });
}
