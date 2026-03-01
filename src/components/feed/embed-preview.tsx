type EmbedPreviewProps = {
    url: string;
};

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
const isVideoUrl = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const getYoutubeEmbedUrl = (url: string) => {
    try {
        const parsed = new URL(url);

        if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.replace("/", "").trim();
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }

        if (parsed.hostname.includes("youtube.com")) {
            const id = parsed.searchParams.get("v");
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }

        return null;
    } catch {
        return null;
    }
};

export function EmbedPreview({ url }: EmbedPreviewProps) {
    const youtubeEmbed = getYoutubeEmbedUrl(url);

    if (youtubeEmbed) {
        return (
            <div className="mt-2 overflow-hidden rounded-lg border border-amber-950/10 bg-black">
                <iframe
                    src={youtubeEmbed}
                    className="h-56 w-full"
                    title="Embedded video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    if (isImageUrl(url)) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-lg border border-amber-950/10">
                <img src={url} alt="Embedded media" className="max-h-96 w-full object-cover" />
            </a>
        );
    }

    if (isVideoUrl(url)) {
        return (
            <div className="mt-2 overflow-hidden rounded-lg border border-amber-950/10 bg-black">
                <video controls src={url} className="max-h-96 w-full" />
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-md border border-amber-950/10 bg-[var(--color-surface-2)] px-2 py-1 text-xs text-[var(--color-link)]"
        >
            Open attachment
        </a>
    );
}
