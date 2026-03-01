import { FeedClient } from "@/components/feed/feed-client";
import { FeedPost } from "@/components/feed/types";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function FeedPage() {
    const session = await getServerSession(authOptions);
    const posts = await prisma.post.findMany({
        where: {
            visibility: "PUBLIC",
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 50,
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

    const initialPosts: FeedPost[] = posts.map((post) => ({
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
    }));

    return <FeedClient initialPosts={initialPosts} />;
}
