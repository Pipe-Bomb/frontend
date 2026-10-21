import { IconButton } from "@/components/icon-button/icon-button";
import { ContextMenuElement } from "@/context/context-menu.context";
import { useBulkFilters } from "@/hook/bulk-filters.hook";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { safeFetch } from "@/lib/api.util";
import { PlaylistSelectModal } from "@/modal/playlist-select/playlist-select.modal";
import { useNotificationStore } from "@/store/notification.store";
import { usePlayerStore } from "@/store/player.store";
import {
	selectionVariantInfo,
	useSelectionStore,
} from "@/store/selection.store";
import { IconDots } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
	AddPlaylistTracksDto,
	TrackIdDto,
	updatePlaylistTracks,
} from "pipe-bomb-tanstack-client";
import { useState } from "react";

export function BulkMenu() {
	const [playlistAddItems, setPlaylistAddItems] =
		useState<AddPlaylistTracksDto | null>(null);
	const selected = useSelectionStore((state) => state.selected);
	const clearAll = useSelectionStore((state) => state.clearAll);
	const removeMany = usePlayerStore((state) => state.removeMany);
	const [isPerformingAction, setIsPerformingAction] = useState(false);
	const { createNotification, resetNotificationTimeout, updateNotification } =
		useNotificationStore();
	const pathname = usePathname();
	const router = useRouter();

	const getMenu = useBulkFilters<ContextMenuElement>(
		({ add, addIf, only, reduce }) => {
			addIf(
				only({
					album: true,
					track: true,
					ephemeralTrack: true,
				}),
				{
					key: "add-to-playlist",
					languageKey: "contextmenu.bulk.add-to-playlist",
					onClick: () => {
						const add: AddPlaylistTracksDto = {
							tracks: [],
							albums: [],
						};
						for (const list of Object.values(selected)) {
							for (const item of Object.values(list)) {
								switch (item.type) {
									case "track":
									case "ephemeralTrack":
										add.tracks!.push({
											pluginId: item.entity.pluginId,
											libraryId: item.entity.libraryId,
											trackId: item.entity.trackId,
										});
										break;
									case "album": {
										const album = item.entity;
										if (album.uuid) {
											add.albums!.push({
												uuid: album.uuid,
												pluginId: null,
												identityId: null,
												identity: null,
											});
										} else if (album.identities?.length) {
											const identity = album.identities[0];
											add.albums!.push({
												uuid: null,
												pluginId: identity.pluginId,
												identityId: identity.identityId,
												identity: identity.value,
											});
										}
										break;
									}
								}
							}
						}
						setPlaylistAddItems(add);
					},
				},
			);

			addIf(
				only({
					track: ["queue"],
					ephemeralTrack: ["queue"],
				}),
				{
					key: "remove-from-queue",
					languageKey: "contextmenu.bulk.remove-from-queue",
					onClick: () => {
						const indices: number[] = [];
						for (const list of Object.values(selected)) {
							for (const item of Object.values(list)) {
								for (const variant of item.variant) {
									const info = selectionVariantInfo(variant);
									if (info.name !== "queue" || !info.id) {
										continue;
									}
									const index = Number(info.id);
									if (Number.isInteger(index)) {
										indices.push(index);
									}
								}
							}
						}
						if (!indices.length) {
							return;
						}
						removeMany(indices);
						clearAll();
					},
				},
			);

			{
				if (
					only({
						track: true,
					})
				) {
					const { playlistIds, allInPlaylist, trackIds } = reduce<
						"track",
						{
							playlistIds: string[];
							allInPlaylist: boolean;
							trackIds: TrackIdDto[];
						}
					>(
						"track",
						{
							playlistIds: [],
							allInPlaylist: true,
							trackIds: [],
						},
						(track, variants, payload) => {
							if (!payload.allInPlaylist) {
								return payload;
							}
							const playlistVariant = variants.find(
								(v) => v.type == "playlist",
							);
							if (!playlistVariant?.id) {
								return { playlistIds: [], allInPlaylist: false, trackIds: [] };
							}
							const trackId: TrackIdDto = {
								pluginId: track.pluginId,
								libraryId: track.libraryId,
								trackId: track.trackId,
							};
							if (payload.playlistIds.includes(playlistVariant.id)) {
								return {
									playlistIds: payload.playlistIds,
									allInPlaylist: true,
									trackIds: [...payload.trackIds, trackId],
								};
							}
							return {
								playlistIds: [...payload.playlistIds, playlistVariant.id],
								allInPlaylist: true,
								trackIds: [...payload.trackIds, trackId],
							};
						},
					);

					if (playlistIds.length == 1 && allInPlaylist) {
						add({
							key: "remove-from-playlist",
							languageKey: "contextmenu.bulk.remove-from-playlist",
							onClick: () => {
								const notifId = createNotification(
									"Removing tracks from playlist",
									{ timeout: null, isLoading: true },
								);
								safeFetch(updatePlaylistTracks, playlistIds[0], {
									add: null,
									remove: trackIds,
								}).then(([status]) => {
									resetNotificationTimeout(notifId);
									if (status == 200) {
										updateNotification(notifId, {
											message: "Removed tracks from playlist",
											isLoading: false,
										});
										if (pathname == `/playlist/${playlistIds[0]}`) {
											router.refresh();
										}
									} else {
										updateNotification(notifId, {
											message: "Failed to remove tracks from playlist",
											isLoading: false,
										});
									}
								});
							},
						});
					}
				}
			}
		},
	);

	const buttonMenu = useButtonMenu(getMenu);

	return (
		<>
			<IconButton
				icon={IconDots}
				iconSource="tabler"
				style="background"
				{...buttonMenu}
			/>
			<PlaylistSelectModal
				open={!!playlistAddItems}
				onClose={() => !isPerformingAction && setPlaylistAddItems(null)}
				onSelect={(playlist) => {
					if (isPerformingAction || !playlistAddItems) {
						return;
					}
					setIsPerformingAction(true);
					setPlaylistAddItems(null);
					safeFetch(updatePlaylistTracks, playlist.uuid, {
						add: playlistAddItems,
						remove: null,
					}).then(([status]) => {
						setIsPerformingAction(false);
						if (status == 200) {
							createNotification("Started importing tracks to playlist...");
						} else {
							createNotification("Failed to add tracks to playlist");
						}
					});
				}}
			/>
		</>
	);
}
