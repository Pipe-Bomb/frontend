"use client";

import { useGetOwnPlaybackHistory, Album, Artist, Track } from "@/api";
import { Spinner } from "@/components/spinner/spinner.component";
import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { TrackList } from "@/components/track-list/track-list.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { useMemo } from "react";
import styles from "./home-history-section.module.scss";

function identityKey(
	identities:
		| { pluginId: string; identityId: string; value: string }[]
		| null
		| undefined,
): string | null {
	if (!identities?.length) {
		return null;
	}
	const id = identities[0];
	return `${id.pluginId}~${id.identityId}~${id.value}`;
}

export function HomeHistorySection() {
	const { data } = useGetOwnPlaybackHistory(
		{ page: 1, pageSize: 100 },
		{ query: { enabled: true } },
	);

	const validEntries = useMemo(() => {
		if (data?.status !== 200) {
			return null;
		}
		return data.data.entries.filter((e) => e.track !== null);
	}, [data]);

	const recentAlbums = useMemo<Album[]>(() => {
		if (!validEntries) {
			return [];
		}
		const seen = new Map<
			string,
			{ album: Album; count: number; firstIndex: number }
		>();
		validEntries.forEach((entry, index) => {
			for (const album of entry.track!.albums ?? []) {
				const key = album.uuid ?? identityKey(album.identities);
				if (!key) {
					continue;
				}
				const existing = seen.get(key);
				if (existing) {
					existing.count++;
				} else {
					seen.set(key, { album, count: 1, firstIndex: index });
				}
			}
		});
		return Array.from(seen.values())
			.sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex)
			.map(({ album }) => album);
	}, [validEntries]);

	const recentArtists = useMemo<Artist[]>(() => {
		if (!validEntries) {
			return [];
		}
		const seen = new Map<
			string,
			{ artist: Artist; count: number; firstIndex: number }
		>();
		validEntries.forEach((entry, index) => {
			for (const ta of entry.track!.artists ?? []) {
				const artist = ta.artist;
				const key = artist.uuid ?? identityKey(artist.identities);
				if (!key) {
					continue;
				}
				const existing = seen.get(key);
				if (existing) {
					existing.count++;
				} else {
					seen.set(key, { artist, count: 1, firstIndex: index });
				}
			}
		});
		return Array.from(seen.values())
			.sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex)
			.map(({ artist }) => artist);
	}, [validEntries]);

	const lastTracks = useMemo<Track[]>(() => {
		if (!validEntries) {
			return [];
		}
		return validEntries.slice(0, 20).map((e) => e.track!);
	}, [validEntries]);

	if (!validEntries) {
		return <Spinner position="expand" />;
	}

	return (
		<>
			<HorizontalScroller
				heading="Recently played"
				id={HorizontalScrollerId.HOME_RECENT_ALBUMS}
			>
				{recentAlbums.map((album, i) => (
					<GridAlbum key={album.uuid ?? i} album={album} />
				))}
			</HorizontalScroller>
			<HorizontalScroller
				heading="Recent artists"
				id={HorizontalScrollerId.HOME_RECENT_ARTISTS}
			>
				{recentArtists.map((artist, i) => (
					<GridArtist key={artist.uuid ?? i} artist={artist} />
				))}
			</HorizontalScroller>
			{lastTracks.length > 0 && (
				<div className={styles.trackSection}>
					<h3 className={styles.heading}>Last played</h3>
					<TrackList tracks={lastTracks} />
				</div>
			)}
		</>
	);
}
