"use client";

import Image from "next/image";
import { useState } from "react";

export function AccountSettings({
    currentUsername,
    currentImage,
    onUsernameChanged,
}: {
    currentUsername: string;
    currentImage: string | null;
    onUsernameChanged: (nextUsername: string) => void;
}) {
    const [username, setUsername] = useState(currentUsername);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentImage);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const onAvatarFileSelected = async (file: File | null) => {
        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file.");
            return;
        }

        if (file.size > 1_500_000) {
            setError("Image is too large. Max size is 1.5MB.");
            return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                    return;
                }

                reject(new Error("Failed to read image."));
            };

            reader.onerror = () => {
                reject(new Error("Failed to read image."));
            };

            reader.readAsDataURL(file);
        });

        setError("");
        setAvatarDataUrl(dataUrl);
        setAvatarPreview(dataUrl);
    };

    const saveSettings = async () => {
        setMessage("");
        setError("");
        setIsSaving(true);

        const response = await fetch("/api/account", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
                avatarDataUrl: avatarDataUrl || undefined,
            }),
        });

        const payload = (await response.json()) as {
            ok?: boolean;
            handle?: string;
            error?: string;
            unchanged?: boolean;
        };

        if (!response.ok) {
            setError(payload.error ?? "Failed to update account settings.");
            setIsSaving(false);
            return;
        }

        if (payload.handle && payload.handle !== currentUsername) {
            onUsernameChanged(payload.handle);
        }

        setMessage(payload.unchanged ? "No changes were applied." : "Account updated.");
        setCurrentPassword("");
        setNewPassword("");
        setAvatarDataUrl(null);
        setIsSaving(false);
    };

    return (
        <section className="rounded-2xl border border-amber-950/10 bg-[var(--color-surface)] p-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Account settings</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Change your username and password.</p>

            <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-amber-950/10 bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)]">
                    {avatarPreview ? (
                        <Image
                            src={avatarPreview}
                            alt="Profile photo preview"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized
                        />
                    ) : (
                        <span>{username.slice(0, 2).toUpperCase()}</span>
                    )}
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-md border border-amber-950/10 px-2.5 py-1 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface)]">
                    Upload photo
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void onAvatarFileSelected(file);
                            event.currentTarget.value = "";
                        }}
                    />
                </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                    Username
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value.toLowerCase())}
                        className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                    />
                </label>

                <label className="grid gap-1 text-sm text-[var(--color-ink-soft)]">
                    Current password
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                    />
                </label>
            </div>

            <label className="mt-3 grid gap-1 text-sm text-[var(--color-ink-soft)]">
                New password
                <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="rounded-xl border border-amber-950/10 bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-ink)] outline-none"
                />
            </label>

            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{message}</p> : null}

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => void saveSettings()}
                    disabled={isSaving || !username.trim()}
                    className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-surface)] disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save account"}
                </button>
            </div>
        </section>
    );
}
