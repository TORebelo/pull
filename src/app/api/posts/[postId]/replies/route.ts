import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const replySchema = z.object({
    content: z.string().max(1000).optional(),
    embedUrl: z.string().url().optional(),
    parentReplyId: z.string().optional(),
}).superRefine((value, context) => {
    const hasContent = Boolean(value.content?.trim());
    const hasEmbed = Boolean(value.embedUrl?.trim());

    if (!hasContent && !hasEmbed) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reply content or embed URL is required.",
            path: ["content"],
        });
    }
});

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
        select: {
            id: true,
            authorId: true,
            visibility: true,
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

    return NextResponse.json({
        replies: replies.map((reply) => ({
            id: reply.id,
            postId: reply.postId,
            parentReplyId: reply.parentReplyId,
            content: reply.content,
            embedUrl: reply.embedUrl,
            createdAt: reply.createdAt,
            user: reply.user,
            isOwner: session?.user?.id === reply.userId,
        })),
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const body = await request.json();
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        },
        select: {
            id: true,
            authorId: true,
            visibility: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const canAccess =
        post.visibility === "PUBLIC" || post.authorId === session.user.id;

    if (!canAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (parsed.data.parentReplyId) {
        const parent = await prisma.postReply.findUnique({
            where: {
                id: parsed.data.parentReplyId,
            },
            select: {
                id: true,
                postId: true,
            },
        });

        if (!parent || parent.postId !== postId) {
            return NextResponse.json({ error: "Invalid parent reply." }, { status: 400 });
        }
    }

    const reply = await prisma.postReply.create({
        data: {
            postId,
            userId: session.user.id,
            parentReplyId: parsed.data.parentReplyId,
            content: parsed.data.content?.trim() ?? "",
            embedUrl: parsed.data.embedUrl?.trim() || null,
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

    return NextResponse.json(
        {
            reply: {
                id: reply.id,
                postId: reply.postId,
                parentReplyId: reply.parentReplyId,
                content: reply.content,
                embedUrl: reply.embedUrl,
                createdAt: reply.createdAt,
                user: reply.user,
                isOwner: true,
            },
        },
        { status: 201 },
    );
}
