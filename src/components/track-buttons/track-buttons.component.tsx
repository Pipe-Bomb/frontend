"use client";

import { EphemeralTrack, Track } from "@api";
import styles from "./track-buttons.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconDots, IconPlayerPlayFilled } from "@tabler/icons-react";
import { ListEndIcon, ListStartIcon } from "lucide-react";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { useTrackContextMenu } from "@/hook/track-context-menu.hook";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { TrackBookmarkButton } from "@/components/track-bookmark-button/track-bookmark-button.component";

interface Props {
	track: Track | EphemeralTrack;
}

export function TrackButtons({ track }: Props) {
	const { playNow, playNext, addToEnd } = useQueueActions();

	const { menuEntries, modal } = useTrackContextMenu(track);
	const { onClick: openMenu } = useButtonMenu(menuEntries);

	return (
		<>
			<div className={styles.container}>
				<IconButton
					size="xl"
					style="background"
					icon={IconPlayerPlayFilled}
					iconSource="tabler"
					onClick={() => playNow(track)}
				/>
				<IconButton
					size="md"
					icon={ListStartIcon}
					iconSource="lucide"
					onClick={() => playNext(track)}
				/>
				<IconButton
					size="md"
					icon={ListEndIcon}
					iconSource="lucide"
					onClick={() => addToEnd([track])}
				/>
				<TrackBookmarkButton track={track} size="md" />
				<IconButton
					size="md"
					icon={IconDots}
					iconSource="tabler"
					onClick={openMenu}
				/>
			</div>
			{modal}
		</>
	);
}
