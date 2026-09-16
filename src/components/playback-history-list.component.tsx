"use client";

import {
	getOwnPlaybackHistory,
	PlaybackHistoryEntry,
	useGetOwnPlaybackHistory,
} from "@/api";
import { Spinner } from "@/components/spinner/spinner.component";
import { LazyTrackList } from "@/components/track-list/lazy-track-list.component";
import { formatDate } from "@/lib/util";
import { useMemo } from "react";

const CHUNK_SIZE = 50;

export function PlaybackHistoryList() {
	const { data } = useGetOwnPlaybackHistory(
		{
			page: 1,
			pageSize: CHUNK_SIZE,
		},
		{
			query: {
				enabled: true,
			},
		},
	);

	const queryKey = useMemo(() => ["playback-history"], []);

	const fetchChunk = async (offset: number, limit: number) => {
		const page = Math.floor(offset / limit) + 1;
		const response = await getOwnPlaybackHistory({ page, pageSize: limit });
		if (response.status !== 200) {
			throw new Error(`Status code ${response.status}`);
		}
		return response.data.entries.filter((e) => e.track);
	};

	if (!data || data.status !== 200) {
		return <Spinner position="expand" />;
	}

	const { entries, total } = data.data;
	const validEntries = entries.filter((e) => e.track);

	return (
		<LazyTrackList<PlaybackHistoryEntry>
			totalCount={total}
			queryKey={queryKey}
			fetchChunk={fetchChunk}
			chunkSize={CHUNK_SIZE}
			initialTracks={validEntries}
			specialColumns={[
				{
					id: "history_date_played",
					formatter: (entry) => formatDate(new Date(entry.datePlayed)),
				},
				{
					id: "history_client_name",
					formatter: (entry) => entry.clientName,
				},
			]}
			toTrack={(entry) => entry.track!}
		/>
	);
}
