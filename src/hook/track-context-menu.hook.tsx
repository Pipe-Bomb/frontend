"use client";

import { ContextMenuElement } from "@/context/context-menu.context";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { useTrackBookmark } from "@/hook/saved-toggle.hook";
import { PlaylistSelectModal } from "@/modal/playlist-select/playlist-select.modal";
import { useNotificationStore } from "@/store/notification.store";
import { usePlayerStore } from "@/store/player.store";
import { updatePlaylistTracks, EphemeralTrack, Playlist, Track } from "@api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function useTrackContextMenu(
	track: Track | EphemeralTrack | null,
	options: { queueIndex?: number; inPlaylist?: string } = {},
) {
	const { playNext, addToEnd, move } = useQueueActions();
	const { currentIndex, remove } = usePlayerStore();
	const [playlistOpen, setPlaylistOpen] = useState(false);
	const { createNotification } = useNotificationStore();
	const router = useRouter();
	const pathname = usePathname();
	const { bookmarked, toggle: toggleBookmark } = useTrackBookmark(track);

	const menuEntries = useCallback<() => ContextMenuElement[]>(() => {
		if (!track) {
			return [];
		}

		const entries: ContextMenuElement[] = [];

		if (
			options.queueIndex === undefined ||
			(options.queueIndex != currentIndex &&
				options.queueIndex != currentIndex + 1)
		) {
			entries.push({
				languageKey: "contextmenu.track.play-next",
				key: "play-next",
				onClick: () => {
					if (
						options.queueIndex !== undefined &&
						options.queueIndex > currentIndex
					) {
						move(options.queueIndex, currentIndex + 1);
					} else {
						playNext(track);
					}
				},
			});
		}

		if (options.queueIndex === undefined) {
			entries.push({
				languageKey: "contextmenu.track.add-to-queue",
				key: "add-to-queue",
				onClick: () => addToEnd([track]),
			});
		} else {
			const index = options.queueIndex;
			entries.push({
				languageKey: "contextmenu.queue.remove",
				key: "remove",
				onClick: () => remove(index),
			});
		}

		if (options.inPlaylist) {
			const playlistId = options.inPlaylist;
			entries.push({
				languageKey: "contextmenu.track.remove-from-playlist",
				key: "remove-from-playlist",
				onClick: () => {
					updatePlaylistTracks(playlistId, {
						add: null,
						remove: [
							{
								pluginId: track.pluginId,
								libraryId: track.libraryId,
								trackId: track.trackId,
							},
						],
					})
						.then((response) => {
							if (response && response.status == 200) {
								setPlaylistOpen(false);
								createNotification("Removed track from playlist");
								if (pathname == `/playlist/${playlistId}`) {
									router.refresh();
								}
							}
						})
						.catch((e) => {
							console.error(e);
							createNotification("Failed to remove from track from playlist");
						});
				},
			});
		}

		entries.push(
			{
				languageKey: "contextmenu.track.add-to-playlist",
				key: "add-to-playlist",
				onClick: () => setPlaylistOpen(true),
			},
			{
				languageKey: `contextmenu.track.${bookmarked ? "unsave" : "save"}`,
				key: "toggle-save",
				onClick: toggleBookmark,
			},
			{
				languageKey: "contextmenu.track.go-to-page",
				key: "go-to-page",
				href: `/track/${track.pluginId}/${track.libraryId}/${track.trackId}`,
			},
		);

		return entries;
	}, [track, options.queueIndex, currentIndex, bookmarked, toggleBookmark]);

	const addToPlaylist = (playlist: Playlist) => {
		if (!track) {
			return;
		}

		updatePlaylistTracks(playlist.uuid, {
			add: {
				tracks: [
					{
						pluginId: track.pluginId,
						libraryId: track.libraryId,
						trackId: track.trackId,
					},
				],
				albums: null,
			},
			remove: null,
		})
			.then((response) => {
				// todo: update playlist query key
				createNotification("Started importing track to playlist");
			})
			.catch((e) => {
				console.error(e);
				createNotification("Failed to add track to playlist");
			})
			.finally(() => setPlaylistOpen(false));
	};

	const playlistSelect = (
		<PlaylistSelectModal
			open={playlistOpen}
			onClose={() => setPlaylistOpen(false)}
			onSelect={addToPlaylist}
		/>
	);

	return {
		menuEntries,
		modal: <>{playlistSelect}</>,
	};
}
