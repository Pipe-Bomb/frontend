"use client";

import { getSavedTracks, Track } from "@api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TrackList } from "@/components/track-list/track-list.component";
import { Spinner } from "@/components/spinner/spinner.component";
import styles from "./saved-section.module.scss";

const PAGE_SIZE = 30;

interface SavedTracksPage {
	tracks: Track[];
	total: number;
	page: number;
}

export function SavedTracks() {
	const query = useInfiniteQuery<SavedTracksPage>({
		queryKey: ["saved", "tracks"],
		queryFn: async ({ pageParam }) => {
			const response = await getSavedTracks({
				page: String(pageParam),
				pageSize: String(PAGE_SIZE),
			});
			if (response.status != 200) {
				throw new Error(`Unexpected status ${response.status}`);
			}
			return {
				tracks: response.data.tracks,
				total: response.data.total,
				page: pageParam as number,
			};
		},
		initialPageParam: 1,
		getNextPageParam: (last, all) => {
			if (last.tracks.length === 0) {
				return undefined;
			}
			const loaded = all.reduce((sum, p) => sum + p.tracks.length, 0);
			return loaded < last.total ? last.page + 1 : undefined;
		},
	});

	const pages = query.data?.pages ?? [];
	const tracks = pages.flatMap((p) => p.tracks);
	const total = pages.length ? pages[pages.length - 1].total : 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	if (query.isPending) {
		return (
			<div className={styles.container}>
				<Spinner position="expand" />
			</div>
		);
	}

	if (!tracks.length) {
		return (
			<div className={styles.container}>
				<div className={styles.empty}>No saved tracks yet.</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.pageBar}>
				<span className={styles.count}>
					{total} tracks · page {pages.length} of {totalPages}
				</span>
			</div>
			<TrackList
				tracks={tracks}
				trackNumbers={tracks.map((_t, i) => i + 1)}
				endReached={() => {
					if (query.hasNextPage && !query.isFetchingNextPage) {
						query.fetchNextPage();
					}
				}}
			/>
			{query.isFetchingNextPage && <Spinner position="expand" />}
		</div>
	);
}
