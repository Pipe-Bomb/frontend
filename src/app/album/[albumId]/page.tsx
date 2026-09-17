import { getAttribute } from "@/lib/attribute.util";
import { getAlbumExternalUrls } from "@api";
import styles from "./page.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { AlbumArtists } from "@/components/album-artists/album-artists.component";
import { AlbumButtons } from "@/components/album-buttons/album-buttons.component";
import { TrackList } from "@/components/track-list/track-list.component";
import { getAlbumById, unwrapData } from "@/lib/api.util";
import { AlbumEphemeralContentTabs } from "@/components/ephemeral-content-tabs/album-ephemeral-content-tabs.component";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { TrackListProvider } from "@/context/tracklist.context";
import { Metadata } from "next";
import { getAuthHeaders } from "@/lib/server.util";
import Link from "next/link";

interface Props {
	params: Promise<{
		albumId: string;
	}>;
}

export async function generateMetadata({
	params,
}: Props): Promise<Metadata | null> {
	const { albumId } = await params;

	try {
		const albumResponse = await getAlbumById(albumId, {
			headers: (await getAuthHeaders()) ?? {},
		});

		if (albumResponse.status != 200) {
			return null;
		}

		const album = albumResponse.data;

		const title = getAttribute(album.attributes, "title", "string", true);
		const image = getAttribute(album.attributes, "front", "buffer");

		let artistString = "";

		if (album.artists?.length) {
			for (const [index, artist] of album.artists.entries()) {
				const name = getAttribute(
					artist.artist.attributes,
					"name",
					"string",
					true,
				);
				artistString += name || "Unknown Artist";
				if (artist.joinPhrase) {
					artistString += artist.joinPhrase;
				} else if (index < album.artists.length - 1) {
					artistString += ", ";
				}
			}
		}

		return {
			title: `${title ?? "Unknown Album"} - Pipe Bomb`,
			openGraph: {
				title: title ?? "Unknown Album",
				description: `Listen to ${title ?? "Unknown Album"}${artistString ? ` by ${artistString}` : ""} on Pipe Bomb`,
				images: image ? [image.url] : [],
			},
		};
	} catch {}

	return null;
}

export default async function Page({ params }: Props) {
	const { albumId } = await params;

	const authHeaders = await getAuthHeaders();

	const albumResponse = await getAlbumById(albumId, {
		headers: authHeaders ?? {},
	});

	if (albumResponse.status == 404) {
		return <h1>Album not found</h1>;
	}

	const album = unwrapData(albumResponse);
	const title =
		getAttribute(album.attributes, "title", "string", true) ?? "Unknown Album";
	const front = getAttribute(album.attributes, "front", "buffer");
	const year = getAttribute(album.attributes, "year", "integer", false);
	const trackCount = album.tracks?.length ?? null;

	const albumUrlsResponse =
		(!!album.uuid &&
			(await getAlbumExternalUrls(album.uuid, {
				headers: authHeaders ?? {},
			}))) ||
		null;

	const externalUrls =
		albumUrlsResponse?.status == 200 && albumUrlsResponse.data.length
			? albumUrlsResponse.data
			: null;

	return (
		<TrackListProvider>
			<div className={styles.container}>
				<div className={`${styles.hero} ${!front ? styles.noArt : ""}`}>
					<div className={styles.background}>
						<ResourceImage resource={front} className={styles.bgImage} />
					</div>
					<div className={styles.overlay} />
					<div className={styles.content}>
						<ResourceImage
							resource={front}
							fallbackSrc="/no_album_art.jpg"
							className={styles.thumb}
							width={180}
							height={180}
						/>
						<div className={styles.info}>
							<h1 className={styles.title}>{title}</h1>
							<span className={styles.artists}>
								<AlbumArtists album={album} />
							</span>
							{(year != null || trackCount != null) && (
								<div className={styles.meta}>
									{year != null && <span>{year}</span>}
									{year != null && trackCount != null && (
										<span className={styles.dot}>·</span>
									)}
									{trackCount != null && (
										<span>
											{trackCount} {trackCount === 1 ? "track" : "tracks"}
										</span>
									)}
								</div>
							)}
							<AlbumButtons album={album} />
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
				</div>
				<RootPadding className={styles.body}>
					{!!album.tracks?.length && (
						<TrackList
							tracks={album.tracks}
							trackNumbers={album.tracks.map((_, index) => index + 1)}
							noArt
						/>
					)}
				</RootPadding>
				<RootPadding>
					<AlbumEphemeralContentTabs albumId={albumId} />
				</RootPadding>
			</div>
		</TrackListProvider>
	);
}
