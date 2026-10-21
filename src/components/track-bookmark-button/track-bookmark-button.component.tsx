"use client";

import {
	BookmarkButton,
	ButtonSize,
	ButtonStyle,
} from "@/components/bookmark-button/bookmark-button.component";
import { useTrackBookmark } from "@/hook/saved-toggle.hook";
import { EphemeralTrack, Track } from "@api";

interface Props {
	track: Track | EphemeralTrack | null;
	size?: ButtonSize;
	style?: ButtonStyle;
}

export function TrackBookmarkButton({ track, size, style }: Props) {
	const bookmark = useTrackBookmark(track);

	return (
		<BookmarkButton
			bookmark={bookmark}
			size={size}
			disabled={!track}
			style={style}
		/>
	);
}
