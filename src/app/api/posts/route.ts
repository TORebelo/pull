import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postInputSchema = z.object({
    content: z.string().max(300).optional(),
    embedUrl: z.string().url().optional(),
    topicSlugs: z.array(z.string().min(1).max(32)).max(5).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    poll: z
        .object({
            question: z.string().min(1).max(120),
            options: z.array(z.string().min(1).max(80)).min(2).max(4),
        })
        .optional(),
}).superRefine((value, context) => {
    const hasContent = Boolean(value.content?.trim());
    const hasPoll = Boolean(value.poll);

    if (!hasContent && !hasPoll) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Post content or a poll is required.",
            path: ["content"],
        });
    }
});

const getOrCreateTopics = async (topicSlugs: string[]) => {
    const normalized = topicSlugs
        .map((slug) => slug.toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 5);

    const unique = [...new Set(normalized)];

    const topics = await Promise.all(
        unique.map((slug) =>
            prisma.topic.upsert({
                where: { slug },
                update: { label: slug },
                create: {
                    slug,
                    label: slug,
                },
            }),
        ),
    );

    return topics;
};

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postInputSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const topics = await getOrCreateTopics(parsed.data.topicSlugs ?? []);
    const trimmedContent = parsed.data.content?.trim() ?? "";
    const embedUrl = parsed.data.embedUrl?.trim() || undefined;
    const normalizedPollOptions =
        parsed.data.poll?.options.map((option) => option.trim()).filter(Boolean) ?? [];

    const post = await prisma.post.create({
        data: {
            authorId: session.user.id,
            content: trimmedContent || parsed.data.poll?.question || "",
            embedUrl,
            visibility: parsed.data.visibility ?? "PUBLIC",
            topics: {
                create: topics.map((topic) => ({
                    topicId: topic.id,
                })),
            },
            ...(parsed.data.poll
                ? {
                    poll: {
                        create: {
                            question: parsed.data.poll.question.trim(),
                            options: {
                                create: normalizedPollOptions.map((option) => ({ text: option })),
                            },
                        },
                    },
                }
                : {}),
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    handle: true,
                    image: true,
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
                            userId: session.user.id,
                        },
                        select: {
                            optionId: true,
                        },
                    },
                },
            },
        },
    });

    return NextResponse.json(
        {
            post: {
                id: post.id,
                content: post.content,
                embedUrl: post.embedUrl,
                createdAt: post.createdAt,
                author: post.author,
                topics: post.topics.map((entry) => entry.topic),
                likeCount: post._count.likes,
                replyCount: post._count.replies,
                viewerLiked: false,
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
        },
        { status: 201 },
    );
}
