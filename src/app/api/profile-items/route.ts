import { ProfileItemType, Visibility } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileItemInputSchema = z.object({
    type: z.enum(["PROJECT", "MUSIC", "MOVIE_SERIES"]),
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    url: z.string().url().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
    publishToFeed: z.boolean().default(false),
    topicSlugs: z.array(z.string().min(1).max(32)).max(5).optional(),
});

const normalizeType = (value: string | null): ProfileItemType | null => {
    if (!value) return null;
    if (value === "PROJECT" || value === "MUSIC" || value === "MOVIE_SERIES") {
        return value;
    }

    return null;
};

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

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const handle = searchParams.get("handle");
    const type = normalizeType(searchParams.get("type"));

    const whereVisibility =
        handle && session?.user?.handle === handle
            ? undefined
            : ({ visibility: Visibility.PUBLIC } satisfies { visibility: Visibility });

    const items = await prisma.profileItem.findMany({
        where: {
            ...(handle
                ? {
                    user: {
                        handle,
                    },
                }
                : {}),
            ...(type
                ? {
                    type,
                }
                : {}),
            ...whereVisibility,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 100,
        include: {
            user: {
                select: {
                    handle: true,
                    name: true,
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
                    posts: true,
                },
            },
        },
    });

    const payload = items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        visibility: item.visibility,
        publishToFeed: item.publishToFeed,
        createdAt: item.createdAt,
        user: item.user,
        topics: item.topics.map((entry) => entry.topic),
        publishedPostsCount: item._count.posts,
    }));

    return NextResponse.json({ items: payload });
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileItemInputSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const topics = await getOrCreateTopics(parsed.data.topicSlugs ?? []);

    const item = await prisma.profileItem.create({
        data: {
            userId: session.user.id,
            type: parsed.data.type,
            title: parsed.data.title,
            description: parsed.data.description,
            url: parsed.data.url,
            visibility: parsed.data.visibility,
            publishToFeed: parsed.data.publishToFeed,
            topics: {
                create: topics.map((topic) => ({
                    topicId: topic.id,
                })),
            },
        },
    });

    if (parsed.data.publishToFeed) {
        await prisma.post.create({
            data: {
                authorId: session.user.id,
                content: `Shared ${parsed.data.type.toLowerCase().replace("_", "/")}: ${parsed.data.title}`,
                visibility: parsed.data.visibility,
                sourceProfileItemId: item.id,
                topics: {
                    create: topics.map((topic) => ({
                        topicId: topic.id,
                    })),
                },
            },
        });
    }

    return NextResponse.json({ item }, { status: 201 });
}
