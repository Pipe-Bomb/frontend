"use client";

import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { SelectableHorizontalScroller } from "@/components/selectable-horizontal-scroller/selectable-horizontal-scroller";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { SelectionVariant } from "@/store/selection.store";
import { Album } from "@api";

interface Props {
	albums: Album[];
	horizontalScrollerId: HorizontalScrollerId;
	heading: string;
	variant?: SelectionVariant<"album">[];
}

export function AlbumScroller({
	albums,
	horizontalScrollerId,
	heading,
	variant,
}: Props) {
	return (
		<SelectableHorizontalScroller<"album">
			entities={albums}
			horizontalScrollerId={horizontalScrollerId}
			heading={heading}
			variant={variant}
			itemCreate={(album, index, selected, onToggleSelect) => (
				<GridAlbum
					album={album}
					key={album.uuid ?? index}
					isSelected={selected}
					onToggleSelected={onToggleSelect}
				/>
			)}
		/>
	);
}
