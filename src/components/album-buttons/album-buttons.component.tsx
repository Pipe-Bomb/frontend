"use client";

import {
	Album,
	Playlist,
	updatePlaylistTracks,
	updatePlaylistTracksResponse,
} from "@api";
import styles from "./album-buttons.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconDots, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { ListEndIcon, ListStartIcon, ShuffleIcon } from "lucide-react";
import { useTrackListContext } from "@/context/tracklist.context";
import { useIsMounted } from "@/hook/mounted.hook";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { shuffle } from "@/lib/util";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { PlaylistSelectModal } from "@/modal/playlist-select/playlist-select.modal";
import { useNotificationStore } from "@/store/notification.store";
import { useAlbumBookmark } from "@/hook/saved-toggle.hook";
import { BookmarkButton } from "@/components/bookmark-button/bookmark-button.component";

interface Props {
	album: Album;
}

export function AlbumButtons({ album }: Props) {
	const { playEntireList, playListNext, addToEnd } = useQueueActions();
	const { trackList: backupTrackList } = useTrackListContext();
	const isMounted = useIsMounted();
	const [playlistOpen, setPlaylistOpen] = useState(false);
	const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
	const { createNotification } = useNotificationStore();
	const albumBookmark = useAlbumBookmark(album);

	const tracklist = useMemo(() => {
		if (album.tracks?.length) {
			return album.tracks;
		}
		return backupTrackList;
	}, [album.tracks, backupTrackList]);

	const { onClick } = useButtonMenu(() => [
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
			<div className={styles.container}>
				{isMounted && (
					<>
						<IconButton
							size="xl"
							style="background"
							icon={IconPlayerPlayFilled}
							iconSource="tabler"
							onClick={() => playEntireList(tracklist, 0)}
							disabled={!tracklist.length}
						/>
						<IconButton
							size="md"
							icon={ShuffleIcon}
							iconSource="lucide"
							onClick={() => playEntireList(shuffle(tracklist), 0)}
							disabled={!tracklist.length}
						/>
						<IconButton
							size="md"
							icon={ListStartIcon}
							iconSource="lucide"
							onClick={() => playListNext(tracklist)}
							disabled={!tracklist.length}
						/>
						<IconButton
							size="md"
							icon={ListEndIcon}
							iconSource="lucide"
							onClick={() => addToEnd(tracklist)}
							disabled={!tracklist.length}
						/>
						<BookmarkButton bookmark={albumBookmark} size="md" />
						<IconButton
							size="md"
							icon={IconDots}
							iconSource="tabler"
							onClick={onClick}
						/>
					</>
				)}
			</div>
			<PlaylistSelectModal
				open={playlistOpen}
				onClose={() => !isAddingToPlaylist && setPlaylistOpen(false)}
				onSelect={addToPlaylist}
			/>
		</>
	);
}
