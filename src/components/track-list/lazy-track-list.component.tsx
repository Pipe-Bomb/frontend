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
} from "@/store/selection.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

	return (
		<BaseTrackList
			totalCount={totalCount}
			specialColumns={specialColumns}
			variant={variant}
			toTrack={(index) => {
				const chunkIndex = Math.floor(index / chunkSize);
				const localIndex = index % chunkSize;

				const cachedChunk = queryClient.getQueryData<T[]>([
					...queryKey,
					"chunk",
					chunkIndex,
				]);

				const tracks =
					cachedChunk ?? (chunkIndex === 0 ? initialTracks : undefined);

				const entry = tracks?.[localIndex];
				if (entry) {
					return toTrack(entry, index);
				}
				return null;
			}}
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
			onToggleSelected={() => selection.toggle(track)}
		/>
	);
}
