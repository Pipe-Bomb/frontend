"use client";

import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { SelectableHorizontalScroller } from "@/components/selectable-horizontal-scroller/selectable-horizontal-scroller";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { SelectionVariant } from "@/store/selection.store";
import { Artist } from "@api";

interface Props {
	artists: Artist[];
	horizontalScrollerId: HorizontalScrollerId;
	heading: string;
	variant?: SelectionVariant<"artist">[];
}

export function ArtistScroller({
	artists,
	horizontalScrollerId,
	heading,
	variant,
}: Props) {
	return (
		<SelectableHorizontalScroller<"artist">
			entities={artists}
			horizontalScrollerId={horizontalScrollerId}
			heading={heading}
			variant={variant}
			itemCreate={(artist, index, selected, onToggleSelect) => (
				<GridArtist
					artist={artist}
					key={artist.uuid ?? index}
					isSelected={selected}
					onToggleSelected={onToggleSelect}
				/>
			)}
		/>
	);
}
