"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { KeyboardEvent, useRef, useState } from "react";

const tweetTypeOptions = ["tweet", "poll"] as const;

const topicOptions = [
    "coding",
    "design",
    "music",
    "movies",
    "series",
    "projects",
    "games",
    "life",
] as const;

export function QuickComposer({ onCreated }: { onCreated: () => Promise<void> }) {
    const { data: session } = useSession();
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
    const [content, setContent] = useState("");
    const [tweetType, setTweetType] = useState<(typeof tweetTypeOptions)[number]>("tweet");
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [topicToAdd, setTopicToAdd] = useState<string>(topicOptions[0]);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pollQuestionRef = useRef<HTMLInputElement | null>(null);
    const pollOptionRefs = useRef<Array<HTMLInputElement | null>>([]);

    const filledPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    const hasValidPoll =
        tweetType === "poll" &&
        pollQuestion.trim().length > 0 &&
        filledPollOptions.length >= 2 &&
        filledPollOptions.length <= 4;
    const canPublish = Boolean(content.trim()) || hasValidPoll;

    const submitPost = async () => {
        const trimmed = content.trim();
        if (!canPublish) return;

        setIsSubmitting(true);
        await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: trimmed || undefined,
                topicSlugs: selectedTopics,
                ...(hasValidPoll
                    ? {
                        poll: {
                            question: pollQuestion.trim(),
                            options: filledPollOptions,
                        },
                    }
                    : {}),
            }),
        });

        setContent("");
        setTweetType("tweet");
        setSelectedTopics([]);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setIsSubmitting(false);
        await onCreated();
    };

    const cycleTweetType = () => {
        const currentIndex = tweetTypeOptions.indexOf(tweetType);
        const nextIndex = (currentIndex + 1) % tweetTypeOptions.length;
        const nextType = tweetTypeOptions[nextIndex];
        setTweetType(nextType);

        if (nextType !== "poll") {
            setPollQuestion("");
            setPollOptions(["", ""]);
        }
    };

    const cycleTopic = () => {
        const currentIndex = topicOptions.indexOf(topicToAdd as (typeof topicOptions)[number]);
        const nextIndex = currentIndex <= 0 ? topicOptions.length - 1 : currentIndex - 1;
        setTopicToAdd(topicOptions[nextIndex]);
    };

    const addPollOption = () => {
        if (pollOptions.length < 4) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const focusPollField = (fieldIndex: number) => {
        if (fieldIndex === 0) {
            pollQuestionRef.current?.focus();
            return;
        }

        const optionInput = pollOptionRefs.current[fieldIndex - 1];
        optionInput?.focus();
    };

    const onPollFieldKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        fieldIndex: number,
    ) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            const maxFieldIndex = pollOptions.length;
            const next = fieldIndex >= maxFieldIndex ? 0 : fieldIndex + 1;
            focusPollField(next);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            const maxFieldIndex = pollOptions.length;
            const prev = fieldIndex <= 0 ? maxFieldIndex : fieldIndex - 1;
            focusPollField(prev);
            return;
        }

        if (event.shiftKey && event.key.toLowerCase() === "q") {
            event.preventDefault();
            addPollOption();
        }

        if (event.shiftKey && event.key.toLowerCase() === "t") {
            event.preventDefault();
            addTopic();
        }
    };

    const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Tab") {
            event.preventDefault();

            if (event.shiftKey) {
                cycleTopic();
            } else {
                cycleTweetType();
            }

            return;
        }

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!isSubmitting && canPublish) {
                void submitPost();
            }
            return;
        }

        if (event.shiftKey && event.key.toLowerCase() === "t") {
            event.preventDefault();
            addTopic();
            return;
        }

        if (event.shiftKey && event.key.toLowerCase() === "q") {
            event.preventDefault();
            if (tweetType !== "poll") {
                setTweetType("poll");
            }
            addPollOption();
        }
    };

    const addTopic = () => {
        if (!selectedTopics.includes(topicToAdd)) {
            setSelectedTopics([...selectedTopics, topicToAdd]);
        }
    };

    const removeTopic = (topic: string) => {
        setSelectedTopics(selectedTopics.filter((value) => value !== topic));
    };

    return (
        <section className="rounded-xl border border-amber-950/10 bg-[var(--color-surface)] p-2">

            {!session?.user ? (
                <div className="mt-3 rounded-xl border border-dashed border-amber-950/15 bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-ink-soft)]">
                    Sign in to post instantly.
                    <div className="mt-3 flex gap-2">
                        <Link
                            href="/auth"
                            className="rounded-full border border-amber-950/10 px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
                        >
                            Email login
                        </Link>
                        {googleEnabled ? (
                            <button
                                type="button"
                                onClick={() => signIn("google")}
                                className="rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)]"
                            >
                                Sign in with Google
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            {tweetTypeOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        setTweetType(option);
                                        if (option !== "poll") {
                                            setPollQuestion("");
                                            setPollOptions(["", ""]);
                                        }
                                    }}
                                    className={`rounded-md px-2 py-1 capitalize ${tweetType === option
                                        ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                                        : "border border-amber-950/10 text-[var(--color-ink-soft)]"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <div className="group relative">
                            <button
                                type="button"
                                aria-label="Show keyboard shortcuts"
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-950/20 text-[11px] text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-2)]"
                            >
                                ?
                            </button>
                            <div className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-lg border border-amber-950/10 bg-[var(--color-surface)] p-2 text-[11px] text-[var(--color-ink-soft)] shadow-sm group-hover:block">
                                <p>Enter: post</p>
                                <p>Shift+Enter: line break</p>
                                <p>Tab: switch type (tweet/poll)</p>
                                <p>Shift+Tab: switch topic selector</p>
                                <p>Shift+T: add selected topic</p>
                                <p>Shift+Q: add poll option</p>
                                <p>Poll fields: ↑/↓ navigate</p>
                            </div>
                        </div>
                    </div>

                    <textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        onKeyDown={onComposerKeyDown}
                        maxLength={300}
                        placeholder="What are you thinking? (Enter to post, Shift+Enter for line break)"
                        className="min-h-14 rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] px-2.5 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-amber-700/40"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={topicToAdd}
                            onChange={(event) => setTopicToAdd(event.target.value)}
                            className="rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] outline-none"
                        >
                            {topicOptions.map((topic) => (
                                <option key={topic} value={topic}>
                                    {topic}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={addTopic}
                            className="rounded-lg border border-amber-950/10 px-2.5 py-1.5 text-xs text-[var(--color-ink)]"
                        >
                            Add topic
                        </button>
                        {selectedTopics.map((topic) => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => removeTopic(topic)}
                                className="rounded-full bg-amber-900/10 px-2.5 py-1 text-xs text-[var(--color-ink-soft)]"
                            >
                                #{topic} ×
                            </button>
                        ))}
                    </div>

                    {tweetType === "poll" ? (
                        <div className="rounded-lg border border-amber-950/10 bg-[var(--color-surface-2)] p-2.5">
                            <div className="mt-2 grid gap-2">
                                <input
                                    ref={pollQuestionRef}
                                    value={pollQuestion}
                                    onChange={(event) => setPollQuestion(event.target.value)}
                                    onKeyDown={(event) => onPollFieldKeyDown(event, 0)}
                                    placeholder="Poll question"
                                    className="rounded-md border border-amber-950/10 bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] outline-none"
                                />

                                {pollOptions.map((option, index) => (
                                    <input
                                        key={`${index}-poll-option`}
                                        ref={(element) => {
                                            pollOptionRefs.current[index] = element;
                                        }}
                                        value={option}
                                        onChange={(event) => {
                                            const nextOptions = [...pollOptions];
                                            nextOptions[index] = event.target.value;
                                            setPollOptions(nextOptions);
                                        }}
                                        onKeyDown={(event) => onPollFieldKeyDown(event, index + 1)}
                                        placeholder={`Option ${index + 1}`}
                                        className="rounded-md border border-amber-950/10 bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] outline-none"
                                    />
                                ))}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={addPollOption}
                                        className="rounded-lg border border-amber-950/10 px-2.5 py-1 text-xs text-[var(--color-ink)] disabled:opacity-50"
                                        disabled={pollOptions.length >= 4}
                                    >
                                        Add option
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (pollOptions.length > 2) {
                                                setPollOptions(pollOptions.slice(0, pollOptions.length - 1));
                                            }
                                        }}
                                        className="rounded-lg border border-amber-950/10 px-2.5 py-1 text-xs text-[var(--color-ink)] disabled:opacity-50"
                                        disabled={pollOptions.length <= 2}
                                    >
                                        Remove option
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => void submitPost()}
                            disabled={isSubmitting || !canPublish}
                            className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)] disabled:opacity-50"
                        >
                            {isSubmitting ? "Publishing..." : "Publish"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
