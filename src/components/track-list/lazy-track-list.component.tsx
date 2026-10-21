"use client";

import { EphemeralTrack, Track } from "@/api";
import { ListTrackSkeleton } from "@/components/list-track/list-track-skeleton.component";
import { ListTrack } from "@/components/list-track/list-track.component";
import {
	BaseTrackList,
	BaseTrackListSpecialColumn,
} from "@/components/track-list/base-track-list.component";
import {
	BasicAttributeColumn,
	SpecialAttributeColumnFormatter,
} from "@/context/track-columns.context";
import {
	ListSelectionApi,
	SelectionVariant,
	selectionKey,
} from "@/store/selection.store";
import { useNotificationStore } from "@/store/notification.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface Props<T> {
	totalCount: number;
	queryKey: unknown[];
	fetchChunk: (offset: number, limit: number) => Promise<T[]>;
	chunkSize?: number;
	trackNumbers?: number[];
	noArt?: boolean;
	initialTracks?: T[];
	specialColumns?: BaseTrackListSpecialColumn<T>[];
	toTrack: (entry: T, index: number) => Track | EphemeralTrack;
	inPlaylist?: string;
	variant?: SelectionVariant<"track">[];
}

export function LazyTrackList<T>({
	totalCount,
	queryKey,
	fetchChunk,
	chunkSize = 50,
	trackNumbers,
	noArt,
	initialTracks,
	specialColumns,
	toTrack,
	inPlaylist,
	variant,
}: Props<T>) {
	const queryClient = useQueryClient();
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	const chunkKey = (chunkIndex: number) => [...queryKey, "chunk", chunkIndex];

	const getCachedChunk = (chunkIndex: number) =>
		queryClient.getQueryData<T[]>(chunkKey(chunkIndex)) ??
		(chunkIndex === 0 ? initialTracks : undefined);

	const getTrackAt = (index: number) => {
		const chunkIndex = Math.floor(index / chunkSize);
		const localIndex = index % chunkSize;
		const entry = getCachedChunk(chunkIndex)?.[localIndex];
		return entry ? toTrack(entry, index) : null;
	};

	const getBetweenEntities = (
		from: Track | EphemeralTrack,
		to: Track | EphemeralTrack,
	) => {
		const findIndex = (track: Track | EphemeralTrack) => {
			const key = selectionKey(track);
			let keyIndex = -1;

			for (let index = 0; index < totalCount; index++) {
				const candidate = getTrackAt(index);
				if (!candidate) {
					continue;
				}

				if (candidate === track) {
					return index;
				}

				if (keyIndex < 0 && selectionKey(candidate) === key) {
					keyIndex = index;
				}
			}

			return keyIndex;
		};

		const fromIndex = findIndex(from);
		const toIndex = findIndex(to);
		if (fromIndex < 0 || toIndex < 0) {
			return [];
		}

		const start = Math.min(fromIndex, toIndex);
		const end = Math.max(fromIndex, toIndex);
		const startChunk = Math.floor(start / chunkSize);
		const endChunk = Math.floor(end / chunkSize);
		const missingChunks: number[] = [];

		for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
			if (!getCachedChunk(chunkIndex)) {
				missingChunks.push(chunkIndex);
			}
		}

		const collect = () => {
			const result: (Track | EphemeralTrack)[] = [];
			for (let index = start; index <= end; index++) {
				const track = getTrackAt(index);
				if (track) {
					result.push(track);
				}
			}
			return result;
		};

		if (!missingChunks.length) {
			return collect();
		}

		return (async () => {
			const {
				createNotification,
				updateNotification,
				resetNotificationTimeout,
			} = useNotificationStore.getState();
			const notificationId = createNotification(
				"Loading tracks for selection…",
				{ timeout: null, isLoading: true },
			);

			try {
				await Promise.all(
					missingChunks.map((chunkIndex) =>
						queryClient.fetchQuery({
							queryKey: chunkKey(chunkIndex),
							queryFn: () => fetchChunk(chunkIndex * chunkSize, chunkSize),
							staleTime: 5 * 60 * 1000,
						}),
					),
				);

				if (!mounted.current) {
					updateNotification(notificationId, {
						message: "Bulk selection cancelled",
						isLoading: false,
					});
					resetNotificationTimeout(notificationId);
					return null;
				}

				const result = collect();
				updateNotification(notificationId, {
					message: `Selected ${result.length} tracks`,
					isLoading: false,
				});
				resetNotificationTimeout(notificationId);
				return result;
			} catch (error) {
				console.error("Failed to load tracks for bulk selection", error);
				updateNotification(notificationId, {
					message: "Failed to load tracks for selection",
					isLoading: false,
				});
				resetNotificationTimeout(notificationId);
				return null;
			}
		})();
	};

	return (
		<BaseTrackList
			totalCount={totalCount}
			specialColumns={specialColumns}
			variant={variant}
			getBetweenEntities={getBetweenEntities}
			toTrack={getTrackAt}
			itemContent={(index, columns, selection) => (
				<Row<T>
					index={index}
					columns={columns}
					selection={selection}
					queryKey={queryKey}
					fetchChunk={fetchChunk}
					chunkSize={chunkSize}
					trackNumber={trackNumbers?.[index]}
					noArt={noArt}
					initialTracks={initialTracks}
					toTrack={toTrack}
					inPlaylist={inPlaylist}
				/>
			)}
		/>
	);
}

interface RowProps<T> {
	index: number;
	columns: (BasicAttributeColumn | SpecialAttributeColumnFormatter<T>)[];
	selection: ListSelectionApi<"track" | "ephemeralTrack">;
	queryKey: unknown[];
	fetchChunk: (offset: number, limit: number) => Promise<T[]>;
	chunkSize: number;
	trackNumber?: number;
	noArt?: boolean;
	initialTracks?: T[];
	toTrack: (entry: T, index: number) => Track | EphemeralTrack;
	inPlaylist?: string;
}

function Row<T>({
	index,
	columns,
	selection,
	queryKey,
	fetchChunk,
	chunkSize,
	trackNumber,
	noArt,
	initialTracks,
	toTrack,
	inPlaylist,
}: RowProps<T>) {
	const chunkIndex = Math.floor(index / chunkSize);
	const localIndex = index % chunkSize;

	const { data: chunkTracks, isLoading } = useQuery({
		queryKey: [...queryKey, "chunk", chunkIndex],
		queryFn: () => fetchChunk(chunkIndex * chunkSize, chunkSize),
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
		initialData: chunkIndex === 0 ? initialTracks : undefined,
	});

	if (isLoading || !chunkTracks) {
		return <ListTrackSkeleton number={trackNumber} noArt={noArt} />;
	}

	const entry = chunkTracks[localIndex];
	if (!entry) {
		return null;
	}

	const track = toTrack(entry, index);

	return (
		<ListTrack
			track={track}
			columns={columns.map((column) => {
				if (column.type == "special") {
					return {
						type: "special",
						id: column.id,
						width: column.width,
						formatted: column.formatter(entry, index),
						url: column.url?.(entry, index) ?? null,
					};
				}
				return column;
			})}
			number={trackNumber}
			noArt={noArt}
			inPlaylist={inPlaylist}
			isSelected={selection.isSelected(track)}
			onToggleSelected={(bulk) => selection.toggle(track, bulk)}
		/>
	);
}
