import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sortModeMap = {
    newest: [{ createdAt: "desc" }],
    most_liked: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
} satisfies Record<"newest" | "most_liked", Prisma.PostOrderByWithRelationInput[]>;

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const sort = searchParams.get("sort") ?? "newest";
    const topic = searchParams.get("topic")?.toLowerCase().trim();

    const safeSort = sort === "most_liked" ? "most_liked" : "newest";
    const orderBy = sortModeMap[safeSort];

    const posts = await prisma.post.findMany({
        where: {
            visibility: "PUBLIC",
            ...(topic
                ? {
                    topics: {
                        some: {
                            topic: {
                                slug: topic,
                            },
                        },
                    },
                }
                : {}),
        },
        orderBy,
        take: 50,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    handle: true,
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

    const payload = posts.map((post) => ({
        id: post.id,
        content: post.content,
        embedUrl: post.embedUrl,
        createdAt: post.createdAt,
        author: post.author,
        sourceProfileItem: post.sourceProfileItem,
        topics: post.topics.map((entry) => entry.topic),
        likeCount: post._count.likes,
        replyCount: post._count.replies,
        viewerLiked: post.likes.length > 0,
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
    }));

    return NextResponse.json({ posts: payload });
}
