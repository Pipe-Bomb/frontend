import { Album, Artist, EphemeralTrack, Track } from "@api";
import { useMemo } from "react";
import styles from "./search-results.module.scss";
import { TrackList } from "@/components/track-list/track-list.component";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { ArtistScroller } from "@/components/artist-scroller/artist-scroller.component";
import { AlbumScroller } from "@/components/album-scroller/album-scroller.component";

interface Props {
	tracks: (Track | EphemeralTrack)[];
	artists: Artist[];
	albums: Album[];
}

export function SearchResults({ tracks, artists, albums }: Props) {
	const [topTracks, remainingTracks] = useMemo(() => {
		if (!artists.length && !albums.length) {
			return [[], tracks];
		}
		return [tracks.slice(0, 5), tracks.slice(5)];
	}, [tracks, artists, albums]);

	if (!tracks.length && !artists.length && !albums.length) {
		return (
			<RootPadding className={styles.noResults}>
				<h1>No results</h1>
			</RootPadding>
		);
	}

	return (
		<div className={styles.container}>
			{!!topTracks.length && (
				<RootPadding>
					<h3 className={styles.sectionTitle}>Top Tracks</h3>
					<TrackList
						tracks={topTracks}
						trackNumbers={topTracks.map((_t, index) => index + 1)}
					/>
				</RootPadding>
			)}
			{!!artists.length && (
				<ArtistScroller
					heading="Artists"
					horizontalScrollerId={HorizontalScrollerId.SEARCH_ARTISTS}
					artists={artists}
				/>
			)}
			{!!albums.length && (
				<AlbumScroller
					heading="Albums"
					horizontalScrollerId={HorizontalScrollerId.SEARCH_ALBUMS}
					albums={albums}
				/>
			)}
			{!!remainingTracks.length && (
				<RootPadding>
					<h3 className={styles.sectionTitle}>Tracks</h3>
					<TrackList
						tracks={remainingTracks}
						trackNumbers={remainingTracks.map(
							(_t, index) => index + topTracks.length + 1,
						)}
					/>
				</RootPadding>
			)}
		</div>
	);
}
