"use client";

import { EphemeralTrack, Track } from "@/api";
import { ListTrack } from "@/components/list-track/list-track.component";
import { BaseTrackList } from "@/components/track-list/base-track-list.component";

interface Props {
	tracks: (Track | EphemeralTrack)[];
	trackNumbers?: number[];
	noArt?: boolean;
}

export function TrackList({ tracks, trackNumbers, noArt }: Props) {
	return (
		<BaseTrackList
			totalCount={tracks.length}
			toTrack={(index) => tracks[index] ?? null}
			itemContent={(index, columns) => (
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
				/>
			)}
		/>
	);
}
