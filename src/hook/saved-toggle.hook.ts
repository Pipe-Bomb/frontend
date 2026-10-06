"use client";

import { safeFetch } from "@/lib/api.util";
import { albumSavedKey, artistSavedKey, trackSavedKey } from "@/lib/saved.util";
import { useNotificationStore } from "@/store/notification.store";
import { useBookmarked, useSavedStore } from "@/store/saved.store";
import {
	Album,
	Artist,
	CreationSession,
	EphemeralTrack,
	Track,
	getCreationSession,
	saveAlbum,
	saveArtist,
	saveEphemeralAlbum,
	saveEphemeralArtist,
	saveTrack,
	unsaveAlbum,
	unsaveArtist,
	unsaveTrack,
} from "@api";
import { useCallback, useState } from "react";

export interface BookmarkToggle {
	bookmarked: boolean;
	isUpdating: boolean;
	toggle: () => void;
}

type ToggleRequest = (
	next: boolean,
) => Promise<{ status: number; data: any }> | null;

function useToggle(
	key: string | null,
	fallback: boolean,
	label: string,
	request: ToggleRequest,
): BookmarkToggle {
	const setOverride = useSavedStore((state) => state.set);
	const { createNotification, resetNotificationTimeout, updateNotification } =
		useNotificationStore();
	const bookmarked = useBookmarked(key, fallback);
	const [isUpdating, setIsUpdating] = useState(false);

	const toggle = useCallback(() => {
		if (!key || isUpdating) {
			return;
		}

		const next = !bookmarked;
		const pending = request(next);
		if (!pending) {
			return;
		}

		const target = key;
		setIsUpdating(true);
		setOverride(target, next);

		const notificationId = createNotification(
			`${next ? "Saving" : "Unsaving"} ${label}`,
			{ isLoading: true, timeout: null },
		);

		pending
			.then((response) => {
				if (response.status < 200 || response.status >= 300) {
					throw new Error(`Unexpected status ${response.status}`);
				}
				// todo: better identification of session
				if (
					response.data &&
					"uuid" in response.data &&
					"dateStarted" in response.data
				) {
					const session: CreationSession = response.data;
					updateNotification(notificationId, {
						message: `Importing ${label}`,
						isLoading: true,
					});

					const checkActive = () => {
						safeFetch(getCreationSession, session.uuid).then(
							([status, data]) => {
								if (status == 200) {
									console.log(data.percent);
									setTimeout(checkActive, 3_000);
								} else {
									updateNotification(notificationId, {
										message: `Imported ${label}`,
										isLoading: false,
									});
									resetNotificationTimeout(notificationId);
								}
							},
						);
					};

					setTimeout(checkActive, 1_000);
				} else {
					resetNotificationTimeout(notificationId);
					updateNotification(notificationId, {
						message: `${next ? "Saved" : "Unsaved"} ${label}`,
						isLoading: false,
					});
				}
			})
			.catch((e) => {
				console.error(e);
				setOverride(target, !next);
				resetNotificationTimeout(notificationId);
				updateNotification(notificationId, {
					message: `Failed to ${next ? "save" : "unsave"} ${label}`,
					isLoading: false,
				});
			})
			.finally(() => {
				setIsUpdating(false);
			});
	}, [
		key,
		isUpdating,
		bookmarked,
		request,
		label,
		setOverride,
		createNotification,
		resetNotificationTimeout,
	]);

	return { bookmarked, isUpdating, toggle };
}

export function useTrackBookmark(
	track: Track | EphemeralTrack | null,
): BookmarkToggle {
	const key = track ? trackSavedKey(track) : null;
	const pluginId = track?.pluginId;
	const libraryId = track?.libraryId;
	const trackId = track?.trackId;

	const request = useCallback<ToggleRequest>(
		(next) => {
			if (!pluginId || !libraryId || !trackId) {
				return null;
			}
			return next
				? saveTrack(pluginId, libraryId, trackId)
				: unsaveTrack(pluginId, libraryId, trackId);
		},
		[pluginId, libraryId, trackId],
	);

	return useToggle(key, !!track?.bookmarked, "track", request);
}

export function useAlbumBookmark(album: Album): BookmarkToggle {
	const key = albumSavedKey(album);
	const uuid = album.uuid;
	const identity = album.identities?.[0] ?? null;
	const identityPluginId = identity?.pluginId;
	const identityId = identity?.identityId;
	const identityValue = identity?.value;

	const request = useCallback<ToggleRequest>(
		(next) => {
			if (uuid) {
				return next ? saveAlbum(uuid) : unsaveAlbum(uuid);
			}
			if (next && identityPluginId && identityId && identityValue) {
				return saveEphemeralAlbum(identityPluginId, identityId, identityValue);
			}
			return null;
		},
		[uuid, identityPluginId, identityId, identityValue],
	);

	return useToggle(key, !!album.bookmarked, "album", request);
}

export function useArtistBookmark(artist: Artist): BookmarkToggle {
	const key = artistSavedKey(artist);
	const uuid = artist.uuid;
	const identity = artist.identities?.[0] ?? null;
	const identityPluginId = identity?.pluginId;
	const identityId = identity?.identityId;
	const identityValue = identity?.value;

	const request = useCallback<ToggleRequest>(
		(next) => {
			if (uuid) {
				return next ? saveArtist(uuid) : unsaveArtist(uuid);
			}
			if (next && identityPluginId && identityId && identityValue) {
				return saveEphemeralArtist(identityPluginId, identityId, identityValue);
			}
			return null;
		},
		[uuid, identityPluginId, identityId, identityValue],
	);

	return useToggle(key, !!artist.bookmarked, "artist", request);
}
