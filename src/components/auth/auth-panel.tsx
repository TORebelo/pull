"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Mode = "login" | "register";

const REGISTER_USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function AuthPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";

    const [mode, setMode] = useState<Mode>("login");
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modeTitle = useMemo(
        () => (mode === "login" ? "Sign in" : "Create account"),
        [mode],
    );

    const handleSubmit = async () => {
        setError("");

        if (mode === "register") {
            const normalizedUsername = username.trim().toLowerCase();

            if (!REGISTER_USERNAME_REGEX.test(normalizedUsername)) {
                setError("Username must be 3-20 chars and use lowercase letters, numbers, or underscore.");
                return;
            }

            if (password.length < 8) {
                setError("Password must have at least 8 characters.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            if (mode === "register") {
                const registerResponse = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        username,
                        password,
                    }),
                });

                if (!registerResponse.ok) {
                    const payload = (await registerResponse.json()) as {
                        error?: string | { fieldErrors?: Record<string, string[]> };
                    };

                    const fieldMessage =
                        typeof payload.error === "object"
                            ? Object.values(payload.error.fieldErrors ?? {})
                                .flat()
                                .find((message) => Boolean(message))
                            : undefined;

                    throw new Error(
                        (typeof payload.error === "string" ? payload.error : fieldMessage) ??
                        "Registration failed.",
                    );
                }
            }

            const result = await signIn("credentials", {
                email,
                password,
                callbackUrl,
                redirect: false,
            });

            if (!result?.ok) {
                throw new Error("Invalid credentials.");
            }

            router.push(result.url ?? callbackUrl);
            router.refresh();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-8">
            <section className="w-full rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-5">
                <h1 className="text-xl font-semibold text-[var(--color-ink)]">{modeTitle}</h1>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                    Use email/password or continue with Google.
                </p>

                <div className="mt-4 grid gap-3">
                    <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                        />
                    </label>

                    {mode === "register" ? (
                        <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                            Username
                            <input
                                value={username}
                                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                                placeholder="letters, numbers, underscore"
                                className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                            />
                        </label>
                    ) : null}

                    <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                        />
                    </label>
                </div>

                {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

                <div className="mt-4 grid gap-2">
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={
                            isSubmitting ||
                            !email.trim() ||
                            !password.trim() ||
                            (mode === "register" && !username.trim())
                        }
                        className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-surface)] disabled:opacity-50"
                    >
                        {isSubmitting ? "Please wait..." : modeTitle}
                    </button>

                    {googleEnabled ? (
                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl })}
                            className="rounded-xl border border-amber-950/10 px-4 py-2 text-sm text-[var(--color-ink)]"
                        >
                            Continue with Google
                        </button>
                    ) : null}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setMode(mode === "login" ? "register" : "login");
                        setError("");
                    }}
                    className="mt-4 inline-flex w-fit items-center rounded-md px-2 py-1 text-sm font-medium text-[var(--color-link)] transition hover:bg-amber-900/10 hover:text-[var(--color-ink)] hover:underline"
                >
                    {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
                </button>
            </section>
        </div>
    );
}
