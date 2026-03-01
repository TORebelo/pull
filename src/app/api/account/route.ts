import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isValidUsername, normalizeUsername } from "@/lib/username";

const accountUpdateSchema = z.object({
    username: z.string().min(3).max(20).optional(),
    currentPassword: z.string().min(8).max(72).optional(),
    newPassword: z.string().min(8).max(72).optional(),
    avatarDataUrl: z
        .string()
        .startsWith("data:image/")
        .max(2_000_000)
        .optional(),
});

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = accountUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { username, currentPassword, newPassword, avatarDataUrl } = parsed.data;

    if (!username && !newPassword && !avatarDataUrl) {
        return NextResponse.json({ error: "No changes provided." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        },
        select: {
            id: true,
            handle: true,
            passwordHash: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const dataToUpdate: { handle?: string; passwordHash?: string; image?: string } = {};

    if (username) {
        const normalized = normalizeUsername(username);

        if (!isValidUsername(normalized)) {
            return NextResponse.json(
                {
                    error: "Username must be 3-20 chars and use lowercase letters, numbers, or underscore.",
                },
                { status: 400 },
            );
        }

        if (normalized !== user.handle) {
            const existing = await prisma.user.findUnique({ where: { handle: normalized } });
            if (existing) {
                return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
            }

            dataToUpdate.handle = normalized;
        }
    }

    if (newPassword) {
        if (user.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: "Current password is required to set a new password." },
                    { status: 400 },
                );
            }

            const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
            }
        }

        dataToUpdate.passwordHash = await hashPassword(newPassword);
    }

    if (avatarDataUrl) {
        dataToUpdate.image = avatarDataUrl;
    }

    if (!dataToUpdate.handle && !dataToUpdate.passwordHash && !dataToUpdate.image) {
        return NextResponse.json({ ok: true, unchanged: true });
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: session.user.id,
        },
        data: dataToUpdate,
        select: {
            handle: true,
        },
    });

    return NextResponse.json({ ok: true, handle: updatedUser.handle });
}
