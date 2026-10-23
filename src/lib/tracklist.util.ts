import {
	Album,
	EphemeralTrack,
	Playlist,
	Track,
	getAlbum,
	getAlbumEphemeralContentByIdentity,
	getAllPlaylistTrackIds,
} from "@api";

export type AnyTrack = Track | EphemeralTrack;

export async function getAlbumTracklist(album: Album): Promise<AnyTrack[]> {
	if (album.tracks?.length) {
		return album.tracks;
	}

	if (album.uuid) {
		const response = await getAlbum(album.uuid);
		if (response.status !== 200) {
			throw new Error(`Failed to load album "${album.uuid}"`);
		}
		return response.data.tracks ?? [];
	}

	const identity = album.identities?.[0];
	if (!identity) {
		return [];
	}

	const response = await getAlbumEphemeralContentByIdentity(
		identity.pluginId,
		identity.identityId,
		identity.value,
	);
	if (response.status !== 200) {
		throw new Error(`Failed to load album "${identity.value}"`);
	}
	return response.data.tracks;
}

export async function getPlaylistTracklist(
	playlist: Playlist,
): Promise<Track[]> {
	if (
		playlist.tracks &&
		playlist.trackCount !== null &&
		playlist.tracks.length >= playlist.trackCount
	) {
		return playlist.tracks.map(({ track }) => track);
	}

	const response = await getAllPlaylistTrackIds(playlist.uuid);
	if (response.status !== 200) {
		throw new Error(`Failed to load playlist "${playlist.uuid}"`);
	}
	return response.data.map(({ track }) => track);
}
