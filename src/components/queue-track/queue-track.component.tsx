"use client";

import { EphemeralTrack, Track } from "@api";
import styles from "./queue-track.module.scss";
import { useAttribute } from "@/hook/attribute.hook";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { TrackArtists } from "@/components/track-artists/track-artists.component";
import { usePlayerStore } from "@/store/player.store";
import { cc } from "@/lib/util";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconGripVertical,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
} from "@tabler/icons-react";
import { useRightClick } from "@/hook/right-click.hook";
import { useCallback } from "react";
import { ContextMenuElement } from "@/context/context-menu.context";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import Link from "next/link";
import { useTrackContextMenu } from "@/hook/track-context-menu.hook";

interface Props {
	track: Track | EphemeralTrack;
	queueIndex: number;
	dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export function QueueTrack({ track, queueIndex, dragHandleProps }: Props) {
	const { currentIndex, isPlaying, toggle, playIndex, setIsPlaying } =
		usePlayerStore();
	const active = currentIndex == queueIndex;

	const cover = useRawAttribute(track.attributes, "front", "buffer");
	const title =
		useAttribute(track.attributes, "title", "string") ?? track.title;

	const { menuEntries, modal } = useTrackContextMenu(track, {
		queueIndex,
	});

	const contextMenu = useCallback<() => ContextMenuElement[]>(() => {
		return menuEntries();
	}, [active, queueIndex, menuEntries]);

	const rightClick = useRightClick(contextMenu);

	return (
		<>
			<div
				className={cc(
					styles.container,
					active && styles.active,
					currentIndex > queueIndex && styles.history,
				)}
				{...rightClick}
			>
				<div className={styles.imageContainer}>
					<ResourceImage
						resource={cover}
						className={styles.cover}
						fallbackSrc="/no_album_art.jpg"
						width={42}
						height={42}
					/>
					<div className={styles.playButton}>
						<IconButton
							iconSource="tabler"
							icon={
								currentIndex == queueIndex && isPlaying
									? IconPlayerPauseFilled
									: IconPlayerPlayFilled
							}
							style={currentIndex == queueIndex ? "simple" : "background"}
							size="lg"
							onClick={() => {
								if (currentIndex == queueIndex) {
									toggle();
								} else {
									playIndex(queueIndex);
									setIsPlaying(true);
								}
							}}
						/>
					</div>
				</div>
				<div className={styles.info}>
					<Link
						className={styles.title}
						href={`/track/${track.pluginId}/${track.libraryId}/${track.trackId}`}
					>
						{title}
					</Link>
					<span className={styles.artists}>
						<TrackArtists track={track} />
					</span>
				</div>
				<div
					className={styles.dragHandle}
					{...(dragHandleProps ?? {})}
					onClick={(e) => e.stopPropagation()}
				>
					<IconGripVertical size={18} strokeWidth={1.5} />
				</div>
			</div>
			{modal}
		</>
	);
}
