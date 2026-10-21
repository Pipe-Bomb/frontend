"use client";

import { GridPlaylist } from "@/components/grid-playlist/grid-playlist.component";
import { SelectableHorizontalScroller } from "@/components/selectable-horizontal-scroller/selectable-horizontal-scroller";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { SelectionVariant } from "@/store/selection.store";
import { Playlist } from "@api";

interface Props {
	playlists: Playlist[];
	horizontalScrollerId: HorizontalScrollerId;
	heading: string;
	variant?: SelectionVariant<"playlist">[];
}

export function PlaylistScroller({
	playlists,
	horizontalScrollerId,
	heading,
	variant,
}: Props) {
	return (
		<SelectableHorizontalScroller<"playlist">
			entities={playlists}
			horizontalScrollerId={horizontalScrollerId}
			heading={heading}
			variant={variant}
			itemCreate={(playlist, _index, selected, onToggleSelect) => (
				<GridPlaylist
					playlist={playlist}
					key={playlist.uuid}
					isSelected={selected}
					onToggleSelected={onToggleSelect}
				/>
			)}
		/>
	);
}
