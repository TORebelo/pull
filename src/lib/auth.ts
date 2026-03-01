import { OAuthAccount } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

import { createDefaultHandle } from "@/lib/handle";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const isGoogleOAuthConfigured =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET);

const oauthProviders = isGoogleOAuthConfigured
    ? [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ]
    : [];

const upsertOAuthAccount = async ({
    userId,
    provider,
    providerAccountId,
}: {
    userId: string;
    provider: OAuthAccount["provider"];
    providerAccountId: OAuthAccount["providerAccountId"];
}) => {
    await prisma.oAuthAccount.upsert({
        where: {
            provider_providerAccountId: {
                provider,
                providerAccountId,
            },
        },
        update: {
            userId,
        },
        create: {
            provider,
            providerAccountId,
            userId,
        },
    });
};

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth",
    },
    providers: [
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const credentialsSchema = z.object({
                    email: z.string().email(),
                    password: z.string().min(8).max(72),
                });

                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }

                const email = parsed.data.email.trim().toLowerCase();
                const user = await prisma.user.findUnique({ where: { email } });

                if (!user?.passwordHash) {
                    return null;
                }

                const isPasswordValid = await verifyPassword(
                    parsed.data.password,
                    user.passwordHash,
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
        ...oauthProviders,
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) {
                return false;
            }

            const existing = await prisma.user.findUnique({
                where: { email: user.email },
            });

            const dbUser =
                existing ??
                (await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        handle: createDefaultHandle(user.email),
                    },
                }));

            if (!existing) {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: {
                        handle: dbUser.handle,
                    },
                });
            }

            if (account?.provider && account.providerAccountId) {
                await upsertOAuthAccount({
                    userId: dbUser.id,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                });
            }

            return true;
        },
        async jwt({ token }) {
            if (!token.email) {
                return token;
            }

            const dbUser = await prisma.user.findUnique({
                where: { email: token.email },
            });

            if (!dbUser) {
                return token;
            }

            token.userId = dbUser.id;
            token.handle = dbUser.handle;

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = typeof token.userId === "string" ? token.userId : "";
                session.user.handle = typeof token.handle === "string" ? token.handle : "";
            }

            return session;
        },
    },
};
