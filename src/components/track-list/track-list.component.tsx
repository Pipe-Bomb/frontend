"use client";

import { EphemeralTrack, Track } from "@/api";
import { ListTrack } from "@/components/list-track/list-track.component";
import { BaseTrackList } from "@/components/track-list/base-track-list.component";
import { SelectionVariant } from "@/store/selection.store";

interface Props {
	tracks: (Track | EphemeralTrack)[];
	trackNumbers?: number[];
	noArt?: boolean;
	variant?: SelectionVariant<"track">[];
}

export function TrackList({ tracks, trackNumbers, noArt, variant }: Props) {
	const getBetweenEntities = (
		a: Track | EphemeralTrack,
		b: Track | EphemeralTrack,
	) => {
		const from = tracks.indexOf(a);
		const to = tracks.indexOf(b);
		if (from < 0 || to < 0) {
			return [];
		}

		const [start, end] = from < to ? [from, to] : [to, from];
		return tracks.slice(start, end + 1);
	};

	return (
		<BaseTrackList
			totalCount={tracks.length}
			toTrack={(index) => tracks[index] ?? null}
			variant={variant}
			getBetweenEntities={getBetweenEntities}
			itemContent={(index, columns, selection) => (
				<ListTrack
					track={tracks[index]}
					columns={columns.map((column) => {
						if (column.type == "special") {
							return {
								type: "special",
								id: column.id,
								width: column.width,
								formatted: column.formatter(tracks[index], index),
								url: column.url?.(tracks[index], index) ?? null,
							};
						}
						return column;
					})}
					number={trackNumbers?.[index]}
					noArt={noArt}
					isSelected={selection.isSelected(tracks[index])}
					onToggleSelected={(bulk) => selection.toggle(tracks[index], bulk)}
				/>
			)}
		/>
	);
}
