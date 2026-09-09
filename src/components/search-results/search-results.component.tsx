import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { Grid } from "@/components/grid/grid.component";
import { Album, Artist, EphemeralTrack, Track } from "@api";
import { useMemo } from "react";
import styles from "./search-results.module.scss";
import { TrackList } from "@/components/track-list/track-list.component";
import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";

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
				<HorizontalScroller
					heading="Artists"
					id={HorizontalScrollerId.SEARCH_ARTISTS}
				>
					{artists.map((artist, index) => {
						let key = index.toString();
						if (artist.uuid) {
							key = artist.uuid;
						} else if (artist.identities?.length) {
							const identity = artist.identities[0];
							key = `${identity.pluginId} ${identity.identityId} ${identity.value}`;
						}

						return <GridArtist artist={artist} key={key} />;
					})}
				</HorizontalScroller>
			)}
			{!!albums.length && (
				<HorizontalScroller
					heading="Albums"
					id={HorizontalScrollerId.SEARCH_ALBUMS}
				>
					{albums.map((album, index) => {
						let key = index.toString();
						if (album.uuid) {
							key = album.uuid;
						} else if (album.identities?.length) {
							const identity = album.identities[0];
							key = `${identity.pluginId} ${identity.identityId} ${identity.value}`;
						}

						return <GridAlbum album={album} key={key} />;
					})}
				</HorizontalScroller>
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
