"use client";

import { useMemo } from "react";
import { getPlaylistTracks, PlaylistTrack } from "@/api";
import { LazyTrackList } from "@/components/track-list/lazy-track-list.component";
import { useTranslation } from "@/context/language.context";
import { formatDate } from "@/lib/util";

interface Props {
	playlistUuid: string;
	totalCount: number;
	initialTracks?: PlaylistTrack[];
	dateModified: string;
}

export function PlaylistTrackList({
	playlistUuid,
	totalCount,
	initialTracks,
	dateModified,
}: Props) {
	const { t } = useTranslation();
	const queryKey = useMemo(
		() => ["playlist", playlistUuid, "tracks", dateModified],
		[playlistUuid, dateModified],
	);

	const trackNumbers = useMemo(() => {
		return Array.from(
			{
				length: totalCount,
			},
			(_, index) => index + 1,
		);
	}, [totalCount]);

	const fetchChunk = async (offset: number, limit: number) => {
		const response = await getPlaylistTracks(playlistUuid, {
			offset,
			amount: limit,
		});

		if (response.status != 200) {
			throw new Error(`Status code ${response.status}`);
		}

		return response.data;
	};

	return (
		<LazyTrackList
			totalCount={totalCount}
			queryKey={queryKey}
			fetchChunk={fetchChunk}
			chunkSize={50}
			initialTracks={initialTracks}
			trackNumbers={trackNumbers}
			specialColumns={[
				{
					id: "playlist_track_date_added",
					formatter: (entry) => formatDate(new Date(entry.dateAdded)),
				},
				{
					id: "playlist_track_added_by",
					formatter: (entry) => {
						if (entry.addedBy.type == "user") {
							return entry.addedBy.user?.username ?? "Unknown user";
						}

						if (entry.addedBy.type == "system") {
							return t("attribute.playlist_track_added_by.system");
						}

						return entry.addedBy.botName ?? entry.addedBy.botId;
					},
					url: (entry) => {
						if (entry.addedBy.type == "user") {
							return `/user/${entry.addedBy.userUuid}`;
						}

						return null;
					},
				},
			]}
			toTrack={(entry) => entry.track}
			inPlaylist={playlistUuid}
		/>
	);
}
