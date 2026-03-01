export type FeedPost = {
    id: string;
    content: string;
    embedUrl: string | null;
    createdAt: string;
    likeCount: number;
    replyCount: number;
    viewerLiked: boolean;
    author: {
        id: string;
        handle: string;
        name: string | null;
        image: string | null;
    };
    sourceProfileItem: {
        id: string;
        type: "PROJECT" | "MUSIC" | "MOVIE_SERIES";
        title: string;
        url: string | null;
    } | null;
    topics: Array<{
        slug: string;
        label: string;
    }>;
    poll: {
        id: string;
        question: string;
        totalVotes: number;
        viewerVotedOptionId: string | null;
        options: Array<{
            id: string;
            text: string;
            votes: number;
        }>;
    } | null;
};
