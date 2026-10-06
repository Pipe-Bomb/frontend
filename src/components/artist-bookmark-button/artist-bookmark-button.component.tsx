"use client";

import { BookmarkButton } from "@/components/bookmark-button/bookmark-button.component";
import { useArtistBookmark } from "@/hook/saved-toggle.hook";
import { Artist } from "@api";

interface Props {
	artist: Artist;
	size?: "sm" | "md" | "lg" | "xl";
}

export function ArtistBookmarkButton({ artist, size }: Props) {
	const bookmark = useArtistBookmark(artist);

	return <BookmarkButton bookmark={bookmark} size={size} />;
}
