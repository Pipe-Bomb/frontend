"use client";

import { BookmarkButton } from "@/components/bookmark-button/bookmark-button.component";
import { useTrackBookmark } from "@/hook/saved-toggle.hook";
import { EphemeralTrack, Track } from "@api";

interface Props {
	track: Track | EphemeralTrack | null;
	size?: "sm" | "md" | "lg" | "xl";
}

export function TrackBookmarkButton({ track, size }: Props) {
	const bookmark = useTrackBookmark(track);

	return <BookmarkButton bookmark={bookmark} size={size} disabled={!track} />;
}
