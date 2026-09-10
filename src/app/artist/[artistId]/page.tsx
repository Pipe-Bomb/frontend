import { getAttribute } from "@/lib/attribute.util";
import styles from "./page.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import Link from "next/link";
import { Metadata } from "next";
import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { getArtistExternalUrls } from "@/api";
import { getArtistById, unwrapData } from "@/lib/api.util";
import { ArtistEphemeralContentTabs } from "@/components/ephemeral-content-tabs/artist-ephemeral-content-tabs.component";
import { TrackList } from "@/components/track-list/track-list.component";
import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { getAuthHeaders } from "@/lib/server.util";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";

interface Props {
	params: Promise<{
		artistId: string;
	}>;
}

export async function generateMetadata({
	params,
}: Props): Promise<Metadata | null> {
	const { artistId } = await params;

	try {
		const artistResponse = await getArtistById(artistId, {
			headers: (await getAuthHeaders()) ?? {},
		});

		if (artistResponse.status != 200) {
			return null;
		}

		const artist = artistResponse.data;

		const name = getAttribute(artist.attributes, "name", "string", true);
		const image =
			getAttribute(artist.attributes, "background", "buffer") ??
			getAttribute(artist.attributes, "thumb", "buffer");

		return {
			title: `${name ?? "Unknown Artist"} - Pipe Bomb`,
			openGraph: {
				title: name ?? "Unknown Artist",
				description: `Listen to ${name ?? "Unknown Artist"} on Pipe Bomb`,
				images: image ? [image.url] : [],
			},
		};
	} catch {}

	return null;
}

export default async function Page({ params }: Props) {
	const { artistId } = await params;

	const authHeaders = await getAuthHeaders();
	const artistResponse = await getArtistById(artistId, {
		headers: authHeaders ?? {},
	});

	if (artistResponse.status == 404) {
		return <h1>Artist not found</h1>;
	}

	const artist = unwrapData(artistResponse);

	const artistUrlsResponse =
		(!!artist.uuid &&
			(await getArtistExternalUrls(artist.uuid, {
				headers: authHeaders ?? {},
			}))) ||
		null;

	const name = getAttribute(artist.attributes, "name", "string", true);
	const thumbnail = getAttribute(artist.attributes, "thumb", "buffer");
	const background = getAttribute(artist.attributes, "background", "buffer");
	const logo = getAttribute(artist.attributes, "logo", "buffer");
	const genres = getAttribute(artist.attributes, "genre", "string", true, true);

	const externalUrls =
		artistUrlsResponse?.status == 200 && artistUrlsResponse.data.length
			? artistUrlsResponse.data
			: null;
	const showThumb = !!thumbnail && !logo;

	return (
		<div className={styles.container}>
			<div className={`${styles.hero} ${!background ? styles.noBg : ""}`}>
				<div className={styles.background}>
					<ResourceImage resource={background} className={styles.bgImage} />
				</div>
				{!background && (
					<div className={styles.nameGhost} aria-hidden="true">
						{name ?? ""}
					</div>
				)}
				<div className={styles.overlay} />

				<div className={styles.content}>
					{showThumb && !background && (
						<ResourceImage
							resource={thumbnail}
							className={styles.thumb}
							width={280}
							height={280}
						/>
					)}
					{logo && <ResourceImage resource={logo} className={styles.logo} />}
					<h1 className={styles.name}>{name ?? "Unknown Artist"}</h1>
					{!!genres?.length && (
						<div className={styles.genres}>
							{genres.map((genre, index) => (
								<Link
									href={`/genre/${genre}`}
									key={index}
									className={styles.genre}
								>
									{genre}
								</Link>
							))}
						</div>
					)}
					{externalUrls && (
						<div className={styles.urlRow}>
							{externalUrls.map((url, index) => (
								<Link
									key={index}
									href={url.url}
									target="_blank"
									className={styles.urlItem}
									title={url.name}
								>
									<img src={url.iconUrl} alt={url.name} />
								</Link>
							))}
						</div>
					)}
				</div>
			</div>

			<div className={styles.body}>
				{artist.tracks && (
					<RootPadding className={styles.tracksSection}>
						<h2>Top Tracks</h2>
						<TrackList
							tracks={artist.tracks}
							trackNumbers={artist.tracks.map((_t, i) => i + 1)}
						/>
					</RootPadding>
				)}
				{artist.albums && (
					<div className={styles.albums}>
						<HorizontalScroller
							heading="Albums"
							id={HorizontalScrollerId.ARTIST_ALBUMS}
						>
							{artist.albums.map((album) => (
								<GridAlbum album={album} key={album.uuid} />
							))}
						</HorizontalScroller>
					</div>
				)}
			</div>
			<ArtistEphemeralContentTabs artistId={artistId} />
		</div>
	);
}
