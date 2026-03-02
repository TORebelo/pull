import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isValidUsername, normalizeUsername } from "@/lib/username";

const registerInputSchema = z.object({
    email: z.string().trim().email(),
    username: z.string().trim().min(3).max(20),
    password: z.string().min(8).max(72),
});

const getValidationMessage = (
    flattened: ReturnType<z.ZodError["flatten"]>,
) => {
    const firstFieldMessage = Object.values(flattened.fieldErrors)
        .flat()
        .find((message): message is string => Boolean(message));

    return firstFieldMessage ?? "Invalid registration data.";
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerInputSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: getValidationMessage(parsed.error.flatten()),
                },
                { status: 400 },
            );
        }

        const email = parsed.data.email.trim().toLowerCase();
        const username = normalizeUsername(parsed.data.username);

        if (!isValidUsername(username)) {
            return NextResponse.json(
                {
                    error: "Username must be 3-20 chars and use lowercase letters, numbers, or underscore.",
                },
                { status: 400 },
            );
        }

        const [existingByEmail, existingByHandle] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.user.findUnique({ where: { handle: username } }),
        ]);

        if (existingByEmail) {
            return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
        }

        if (existingByHandle) {
            return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
        }

        const passwordHash = await hashPassword(parsed.data.password);

        const user = await prisma.user.create({
            data: {
                email,
                handle: username,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                handle: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error("[register] unexpected error:", error);
        return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
    }
}
