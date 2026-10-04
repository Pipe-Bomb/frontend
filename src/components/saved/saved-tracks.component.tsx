"use client";

import { getSavedTracks, Track, useGetSavedTracks } from "@api";
import { LazyTrackList } from "@/components/track-list/lazy-track-list.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useMemo } from "react";
import styles from "./saved-section.module.scss";

const CHUNK_SIZE = 30;

export function SavedTracks() {
	const { data } = useGetSavedTracks(
		{ page: "1", pageSize: String(CHUNK_SIZE) },
		{ query: { enabled: true } },
	);

	const queryKey = useMemo(() => ["saved", "tracks"], []);

	const fetchChunk = async (offset: number, limit: number) => {
		const page = Math.floor(offset / limit) + 1;
		const response = await getSavedTracks({
			page: String(page),
			pageSize: String(limit),
		});
		if (response.status !== 200) {
			throw new Error(`Status code ${response.status}`);
		}
		return response.data.tracks;
	};

	if (!data || data.status !== 200) {
		return (
			<div className={styles.container}>
				<Spinner position="expand" />
			</div>
		);
	}

	const { tracks: initialTracks, total } = data.data;

	if (!total) {
		return (
			<div className={styles.container}>
				<div className={styles.empty}>No saved tracks yet.</div>
			</div>
		);
	}

	const trackNumbers = Array.from({ length: total }, (_, index) => index + 1);

	return (
		<div className={styles.container}>
			<div className={styles.pageBar}>
				<span className={styles.count}>{total} tracks</span>
			</div>
			<LazyTrackList<Track>
				totalCount={total}
				queryKey={queryKey}
				fetchChunk={fetchChunk}
				chunkSize={CHUNK_SIZE}
				initialTracks={initialTracks}
				trackNumbers={trackNumbers}
				toTrack={(track) => track}
			/>
		</div>
	);
}
