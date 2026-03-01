import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const voteSchema = z.object({
    pollId: z.string().min(1),
    optionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
        where: {
            id: parsed.data.pollId,
        },
        include: {
            post: {
                select: {
                    visibility: true,
                    authorId: true,
                },
            },
            options: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (!poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
    }

    const canAccess =
        poll.post.visibility === "PUBLIC" || poll.post.authorId === session.user.id;

    if (!canAccess) {
        return NextResponse.json({ error: "Poll not available." }, { status: 403 });
    }

    const optionExists = poll.options.some((option) => option.id === parsed.data.optionId);
    if (!optionExists) {
        return NextResponse.json({ error: "Invalid poll option." }, { status: 400 });
    }

    await prisma.pollVote.upsert({
        where: {
            pollId_userId: {
                pollId: parsed.data.pollId,
                userId: session.user.id,
            },
        },
        update: {
            optionId: parsed.data.optionId,
        },
        create: {
            pollId: parsed.data.pollId,
            optionId: parsed.data.optionId,
            userId: session.user.id,
        },
    });

    const options = await prisma.pollOption.findMany({
        where: {
            pollId: parsed.data.pollId,
        },
        include: {
            _count: {
                select: {
                    votes: true,
                },
            },
        },
    });

    const totalVotes = options.reduce((sum, option) => sum + option._count.votes, 0);

    return NextResponse.json({
        ok: true,
        pollId: parsed.data.pollId,
        viewerVotedOptionId: parsed.data.optionId,
        totalVotes,
        options: options.map((option) => ({
            id: option.id,
            votes: option._count.votes,
        })),
    });
}
