"use client";

import { ProgressTrack } from "@/components/progress-track/progress-track.component";
import styles from "./player.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconArrowsShuffle,
	IconLayoutSidebarRightCollapseFilled,
	IconLayoutSidebarRightExpandFilled,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
	IconPlayerSkipBackFilled,
	IconPlayerSkipForwardFilled,
	IconRepeat,
	IconRepeatOnce,
	IconVolume,
	IconVolumeOff,
} from "@tabler/icons-react";
import { usePlayerStore } from "@/store/player.store";
import { cc, formatTime } from "@/lib/util";
import { EphemeralTrack, Track } from "@api";
import { useAttribute } from "@/hook/attribute.hook";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { TrackArtists } from "@/components/track-artists/track-artists.component";
import { useSidebarStore } from "@/store/sidebar.store";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { useTrack } from "@/hook/track.hook";
import Link from "next/link";
import { useRightClick } from "@/hook/right-click.hook";
import { useTrackContextMenu } from "@/hook/track-context-menu.hook";
import { useState } from "react";

export function Player() {
	const { open: isSidebarOpen, toggle: toggleSidebar } = useSidebarStore();
	const {
		isPlaying,
		toggle,
		duration,
		currentTime,
		seek,
		queue,
		currentIndex,
		next,
		prev,
		setIsPlaying,
		isBuffering,
		shuffle,
		toggleShuffle,
		repeat,
		cycleRepeat,
		volume,
		muted,
		setVolume,
		toggleMute,
	} = usePlayerStore();
	const currentTrackResult = useTrack(queue[currentIndex]);

	const handlePrev = () => {
		if (currentTime > 3) {
			seek(0);
		} else {
			prev();
			setIsPlaying(true);
		}
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = parseFloat(e.target.value);
		setVolume(v);
		if (muted && v > 0) {
			toggleMute();
		}
	};

	const displayVolume = muted ? 0 : volume;
	const repeatIcon = repeat === "one" ? IconRepeatOnce : IconRepeat;

	return (
		<div className={styles.container}>
			<div className={styles.left}>
				{currentTrackResult.data && (
					<NowPlaying track={currentTrackResult.data} />
				)}
			</div>
			<div className={styles.center}>
				<div className={styles.centerButtons}>
					<IconButton
						icon={IconArrowsShuffle}
						iconSource="tabler"
						iconClassName={shuffle ? styles.activeIcon : undefined}
						onClick={toggleShuffle}
					/>
					<IconButton
						icon={IconPlayerSkipBackFilled}
						iconSource="tabler"
						onClick={handlePrev}
					/>
					<IconButton
						icon={isPlaying ? IconPlayerPauseFilled : IconPlayerPlayFilled}
						iconSource="tabler"
						style="background"
						size="lg"
						onClick={toggle}
					/>
					<IconButton
						icon={IconPlayerSkipForwardFilled}
						iconSource="tabler"
						onClick={() => {
							next();
							setIsPlaying(true);
						}}
					/>
					<IconButton
						icon={repeatIcon}
						iconSource="tabler"
						iconClassName={repeat !== "off" ? styles.activeIcon : undefined}
						onClick={cycleRepeat}
					/>
				</div>
				<div className={styles.progressContainer}>
					<span className={styles.duration}>{formatTime(currentTime)}</span>
					<div className={styles.progressTrack}>
						<ProgressTrack
							max={duration}
							value={currentTime}
							onChange={seek}
							loading={isBuffering}
						/>
					</div>
					<span className={styles.duration}>
						{duration == -1 ? "-:-" : formatTime(duration)}
					</span>
				</div>
			</div>
			<div className={styles.right}>
				<div className={cc(styles.volumeContainer)}>
					<div className={styles.volumePopover}>
						<input
							type="range"
							{...({ orient: "vertical" } as object)}
							suppressHydrationWarning
							className={styles.volumeSlider}
							min="0"
							max="1"
							step="0.01"
							value={displayVolume}
							onChange={handleVolumeChange}
							style={{
								background: `linear-gradient(to top, var(--fg-primary) ${displayVolume * 100}%, color-mix(in srgb, var(--fg-primary) 25%, transparent) ${displayVolume * 100}%)`,
							}}
						/>
					</div>
					<IconButton
						icon={displayVolume === 0 ? IconVolumeOff : IconVolume}
						iconSource="tabler"
						onClick={toggleMute}
					/>
				</div>
				<IconButton
					iconSource="tabler"
					icon={
						isSidebarOpen
							? IconLayoutSidebarRightCollapseFilled
							: IconLayoutSidebarRightExpandFilled
					}
					onClick={toggleSidebar}
				/>
			</div>
		</div>
	);
}

interface NowPlayingProps {
	track: Track | EphemeralTrack;
}

function NowPlaying({ track }: NowPlayingProps) {
	const title =
		useAttribute(track.attributes, "title", "string") ?? track.title;
	const cover = useRawAttribute(track.attributes, "front", "buffer");

	const { menuEntries, modal } = useTrackContextMenu(track);
	const rightClick = useRightClick(menuEntries);

	return (
		<>
			<div className={styles.nowPlaying} {...rightClick}>
				<Link
					href={`/track/${track.pluginId}/${track.libraryId}/${track.trackId}`}
				>
					<ResourceImage
						resource={cover}
						className={styles.nowPlayingCover}
						fallbackSrc="/no_album_art.jpg"
						width={72}
						height={72}
					/>
				</Link>

				<div className={styles.nowPlayingInfo}>
					<Link
						className={styles.nowPlayingTitle}
						href={`/track/${track.pluginId}/${track.libraryId}/${track.trackId}`}
					>
						{title}
					</Link>
					<span className={styles.nowPlayingArtist}>
						{"artists" in track ? (
							<TrackArtists track={track} />
						) : (
							<span>Unknown Artist</span>
						)}
					</span>
				</div>
			</div>
			{modal}
		</>
	);
}
