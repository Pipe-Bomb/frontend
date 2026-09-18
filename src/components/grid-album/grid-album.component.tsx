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
import { useMemo, useState } from "react";
import { AlbumArtists } from "@/components/album-artists/album-artists.component";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { PlaylistSelectModal } from "@/modal/playlist-select/playlist-select.modal";
import { useNotificationStore } from "@/store/notification.store";

interface Props {
	album: Album;
}

export function GridAlbum({ album }: Props) {
	const [infoOpen, setInfoOpen] = useState(false);
	const [playlistOpen, setPlaylistOpen] = useState(false);
	const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
	const { createNotification } = useNotificationStore();

	const link = useMemo(() => {
		if (album.uuid) {
			return `/album/${album.uuid}`;
		}
		if (album.identities?.length) {
			const identity = album.identities[0];
			return `/album/${identity.pluginId}~${identity.identityId}~${identity.value}`;
		}
		return null;
	}, [album]);

	const title = useAttribute(album.attributes, "title", "string");
	const front = useRawAttribute(album.attributes, "front", "buffer");

	const rightClick = useRightClick(() => [
		{
			languageKey: "contextmenu.album.view-info",
			key: "view-info",
			onClick: () => setInfoOpen(true),
		},
		{
			languageKey: "contextmenu.album.add-to-playlist",
			key: "add-to-playlist",
			onClick: () => setPlaylistOpen(true),
		},
	]);

	const addToPlaylist = (playlist: Playlist) => {
		if (isAddingToPlaylist) {
			return;
		}
		setIsAddingToPlaylist(true);
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
			setIsAddingToPlaylist(false);
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
			.finally(() => setIsAddingToPlaylist(false));
	};

	return (
		<>
			<div className={styles.container} {...rightClick}>
				<OptionalLink className={styles.imageContainer} href={link}>
					<ResourceImage
						resource={front}
						className={styles.image}
						fallback={<AlbumArtFallback />}
						width={180}
						height={180}
					/>
				</OptionalLink>
				<OptionalLink href={link} className={styles.name}>
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
			/>
		</>
	);
}
