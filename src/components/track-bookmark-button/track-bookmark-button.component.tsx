"use client";

import { IconButton } from "@/components/icon-button/icon-button";
import { useTrackBookmark } from "@/hook/saved-toggle.hook";
import { EphemeralTrack, Track } from "@api";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";

interface Props {
	track: Track | EphemeralTrack;
}

export function TrackBookmarkButton({ track }: Props) {
	const { bookmarked, isUpdating, toggle } = useTrackBookmark(track);

	return (
		<IconButton
			icon={bookmarked ? IconBookmarkFilled : IconBookmark}
			iconSource="tabler"
			loading={isUpdating}
			onClick={toggle}
		/>
	);
}
