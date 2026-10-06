import { serializeTrackKey } from "@/lib/track-batcher.util";
import { Album, Artist, EphemeralTrack, Track } from "@api";

type IdentityEntry = NonNullable<Album["identities"]>[number];

export function trackSavedKey(track: Track | EphemeralTrack): string {
	return `track:${serializeTrackKey(track)}`;
}

function entitySavedKey(
	prefix: "album" | "artist",
	uuid: string | null,
	identities: IdentityEntry[] | null,
): string | null {
	if (uuid) {
		return `${prefix}:${uuid}`;
	}

	const identity = identities?.[0];
	if (identity) {
		return `${prefix}:${identity.pluginId}:${identity.identityId}:${identity.value}`;
	}

	return null;
}

export function albumSavedKey(album: Album): string | null {
	return entitySavedKey("album", album.uuid, album.identities);
}

export function artistSavedKey(artist: Artist): string | null {
	return entitySavedKey("artist", artist.uuid, artist.identities);
}
