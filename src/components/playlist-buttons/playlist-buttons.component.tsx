"use client";

import {
	getAllPlaylistTrackIds,
	Playlist,
	runPlaylistSmartFilters,
	updatePlaylistAttributes,
	uploadAttributeBuffer,
} from "@api";
import styles from "./playlist-buttons.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconDots, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import { ListEndIcon, ListStartIcon, ShuffleIcon } from "lucide-react";
import { useIsMounted } from "@/hook/mounted.hook";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { shuffle } from "@/lib/util";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { usePathname, useRouter } from "next/navigation";
import { RenamePlaylistModal } from "@/modal/rename-playlist/rename-playlist.modal";
import { PlaylistCollaboratorsModal } from "@/modal/playlist-collaborators/playlist-collaborators.modal";
import { openFilePicker } from "@/lib/file-upload.util";
import path from "path";
import { useNotificationStore } from "@/store/notification.store";

interface Props {
	playlist: Playlist;
	isOwner?: boolean;
}

export function PlaylistButtons({ playlist, isOwner }: Props) {
	const { playEntireList, playListNext, addToEnd } = useQueueActions();
	const isMounted = useIsMounted();
	const [isLoadingTracklist, setIsLoadingTracklist] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();

	const tracklist = useMemo(() => {
		return playlist.tracks?.map(({ track }) => track) ?? null;
	}, [playlist.tracks]);

	const getFullTracklist = useCallback(async () => {
		if (
			tracklist &&
			playlist.trackCount !== null &&
			tracklist.length >= playlist.trackCount
		) {
			return tracklist;
		}
		setIsLoadingTracklist(true);

		try {
			const response = await getAllPlaylistTrackIds(playlist.uuid);
			if (response.status != 200) {
				throw new Error(`Status code ${response.status}`);
			}
			return response.data.map(({ track }) => track);
		} finally {
			setIsLoadingTracklist(false);
		}
	}, [playlist, playlist.trackCount]);

	const { onClick } = useButtonMenu(() => [
		...(isOwner
			? [
					{
						key: "rename",
						languageKey: "contextmenu.playlist.rename",
						onClick: () => setIsRenameOpen(true),
					},
					{
						key: "manage-collaborators",
						languageKey: "contextmenu.playlist.manage-collaborators",
						onClick: () => setIsCollaboratorsOpen(true),
					},
					{
						key: "change-thumb",
						languageKey: "contextmenu.playlist.change-thumbnail",
						onClick: () => {
							openFilePicker("image/*,.png,.jpg,.jpeg,.webp,.gif").then(
								async (file) => {
									if (!file) {
										return;
									}

									const extension = path.extname(file.name).substring(1);
									if (!extension) {
										createNotification("Failed to upload image");
										return;
									}

									const notifId = createNotification(
										"Requesting to upload image",
										{
											isLoading: true,
											timeout: null,
										},
									);

									try {
										const response = await updatePlaylistAttributes(
											playlist.uuid,
											{
												attributes: [
													{
														type: "buffer",
														key: "thumb",
														extension,
													},
												],
											},
										);

										if (response.status != 200) {
											throw new Error(
												`Unsupported status code ${response.status}`,
											);
										}

										const session = response.data.find(
											(session) =>
												session.extension == extension &&
												session.key == "thumb",
										);

										if (!session) {
											throw new Error(`Session not found`);
										}
										updateNotification(notifId, {
											message: "Uploading image...",
										});

										const bufferResponse = await uploadAttributeBuffer(
											session.uuid,
											{
												file,
											},
										);

										if (bufferResponse.status != 204) {
											throw new Error(
												`Unsupported status code ${response.status}`,
											);
										}
										updateNotification(notifId, {
											message: "Uploaded image",
											isLoading: false,
										});
										if (pathname == `/playlist/${playlist.uuid}`) {
											router.refresh();
										}
									} catch (e) {
										console.error(e);
										updateNotification(notifId, {
											message: "Failed to upload image",
											isLoading: false,
										});
									} finally {
										resetNotificationTimeout(notifId);
									}
								},
							);
						},
					},
					{
						key: "scan-smart-filters",
						languageKey: "contextmenu.playlist.scan-smart-filters",
						onClick: () => {
							runPlaylistSmartFilters(playlist.uuid)
								.then(() => {
									if (pathname == `/playlist/${playlist.uuid}`) {
										router.refresh();
									}
								})
								.catch(console.error);
						},
					},
				]
			: []),
	]);

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
							onClick={() =>
								getFullTracklist().then((tracklist) =>
									playEntireList(tracklist ?? [], 0),
								)
							}
							disabled={!tracklist}
							loading={isLoadingTracklist}
						/>
						<IconButton
							size="md"
							icon={ShuffleIcon}
							iconSource="lucide"
							onClick={() =>
								getFullTracklist().then((tracklist) =>
									playEntireList(shuffle(tracklist), 0),
								)
							}
							disabled={!tracklist}
						/>
						<IconButton
							size="md"
							icon={ListStartIcon}
							iconSource="lucide"
							onClick={() =>
								getFullTracklist().then((tracklist) =>
									playListNext(tracklist ?? []),
								)
							}
							disabled={!tracklist}
						/>
						<IconButton
							size="md"
							icon={ListEndIcon}
							iconSource="lucide"
							onClick={() =>
								getFullTracklist().then((tracklist) =>
									addToEnd(tracklist ?? []),
								)
							}
							disabled={!tracklist}
						/>
						{isOwner && (
							<IconButton
								size="md"
								icon={IconDots}
								iconSource="tabler"
								onClick={onClick}
							/>
						)}
					</>
				)}
			</div>
			<RenamePlaylistModal
				open={isRenameOpen}
				onClose={() => setIsRenameOpen(false)}
				playlist={playlist}
			/>
			<PlaylistCollaboratorsModal
				open={isCollaboratorsOpen}
				onClose={() => setIsCollaboratorsOpen(false)}
				playlist={playlist}
			/>
		</>
	);
}
