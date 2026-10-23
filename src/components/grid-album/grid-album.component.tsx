"use client";

import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";

import { useAttribute } from "@/hook/attribute.hook";
import {
	Album,
	Playlist,
	updatePlaylistTracks,
	updatePlaylistTracksResponse,
} from "@api";
import styles from "./grid-album.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { useRightClick } from "@/hook/right-click.hook";
import { MouseEvent, useMemo, useState } from "react";
import { AlbumArtists } from "@/components/album-artists/album-artists.component";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { PlaylistSelectModal } from "@/modal/playlist-select/playlist-select.modal";
import { useNotificationStore } from "@/store/notification.store";
import { useAlbumBookmark } from "@/hook/saved-toggle.hook";
import { cc } from "@/lib/util";
import { IconCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { useSelectionMode } from "@/store/selection.store";
import { IconButton } from "@/components/icon-button/icon-button";
import { useClickHold } from "@/hook/click-hold.hook";

interface Props {
	album: Album;
	isSelected?: boolean;
	onToggleSelected?: (bulk: boolean) => void;
}

export function GridAlbum({ album, isSelected, onToggleSelected }: Props) {
	const [playlistOpen, setPlaylistOpen] = useState(false);
	const [isAddingToPlaylist, setIsAddingToPlaylist] = useState<string | null>(
		null,
	);
	const { createNotification } = useNotificationStore();
	const { bookmarked, toggle } = useAlbumBookmark(album);
	const inSelectionMode = useSelectionMode();

	const link = useMemo(() => {
		if (album.uuid) {
			return `/album/${album.uuid}`;
		}
		if (album.identities?.length) {
			const identity = album.identities[0];
			return `/album/${identity.pluginId}~${identity.identityId}~${identity.value}`;
		}
		return null;
	}, [album, inSelectionMode]);

	const title = useAttribute(album.attributes, "title", "string");
	const front = useAttribute(album.attributes, "front", "buffer");

	const rightClick = useRightClick(() => [
		{
			languageKey: "contextmenu.album.add-to-playlist",
			key: "add-to-playlist",
			onClick: () => setPlaylistOpen(true),
		},
		{
			languageKey: `contextmenu.album.${bookmarked ? "unsave" : "save"}`,
			key: "toggle-save",
			onClick: toggle,
		},
	]);

	const addToPlaylist = (playlist: Playlist) => {
		if (isAddingToPlaylist) {
			return;
		}
		setIsAddingToPlaylist(playlist.uuid);
		let promise: Promise<updatePlaylistTracksResponse | undefined>;

		if (album.uuid) {
			promise = updatePlaylistTracks(playlist.uuid, {
				add: {
					tracks: null,
					albums: [
						{
							uuid: album.uuid,
							pluginId: null,
							identityId: null,
							identity: null,
						},
					],
				},
				remove: null,
			});
		} else if (album.identities?.length) {
			const identity = album.identities[0];
			promise = updatePlaylistTracks(playlist.uuid, {
				add: {
					tracks: null,
					albums: [
						{
							uuid: album.uuid,
							pluginId: identity.pluginId,
							identityId: identity.identityId,
							identity: identity.value,
						},
					],
				},
				remove: null,
			});
		} else {
			setIsAddingToPlaylist(null);
			return;
		}

		promise
			.then((response) => {
				if (response && response.status == 200) {
					setPlaylistOpen(false);
					createNotification("Started importing tracks to playlist...");
				}
			})
			.catch((e) => {
				console.error(e);
				createNotification("Failed to add tracks to playlist");
			})
			.finally(() => setIsAddingToPlaylist(null));
	};

	const handleClick = (e: MouseEvent, forceSelection?: boolean) => {
		e.stopPropagation();
		if (e.ctrlKey || inSelectionMode || forceSelection) {
			e.preventDefault();
			onToggleSelected?.(e.shiftKey);
		}
	};
	const hold = useClickHold((e) => onToggleSelected?.(e.shiftKey), handleClick);

	return (
		<>
			<div
				className={cc(
					styles.container,
					isSelected && styles.selected,
					inSelectionMode && styles.selectionMode,
				)}
				{...rightClick}
			>
				<OptionalLink className={styles.imageContainer} href={link} {...hold}>
					<IconButton
						icon={isSelected ? IconCircleCheckFilled : IconCircle}
						iconSource="tabler"
						className={styles.selectedCheck}
						size="lg"
					/>
					<ResourceImage
						resource={front}
						className={styles.image}
						fallback={<AlbumArtFallback />}
						width={180}
						height={180}
					/>
				</OptionalLink>
				<OptionalLink href={link} className={styles.name} {...hold}>
					{title ?? "Unknown Album"}
				</OptionalLink>
				<span className={styles.artists}>
					<AlbumArtists album={album} />
				</span>
			</div>
			<PlaylistSelectModal
				open={playlistOpen}
				onClose={() => !isAddingToPlaylist && setPlaylistOpen(false)}
				onSelect={addToPlaylist}
				loading={isAddingToPlaylist ? [isAddingToPlaylist] : null}
			/>
		</>
	);
}
