import { RootPadding } from "@/components/root-padding/root-padding.component";
import { getAttribute } from "@/lib/attribute.util";
import { getAuthHeaders } from "@/lib/server.util";
import { getPlaylist, getPlaylistResponseError, getSelf } from "@api";
import styles from "./page.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import Link from "next/link";
import { PlaylistButtons } from "@/components/playlist-buttons/playlist-buttons.component";
import { PlaylistUpdateProgress } from "@/components/playlist-update-progress/playlist-update-progress.component";
import { PlaylistTrackList } from "@/components/playlist-track-list/playlist-track-list.component";
import { Metadata } from "next";
import { PlaylistSmartFilters } from "@/components/playlist-smart-filters/playlist-smart-filters.component";
import { PlaylistVisibilityButton } from "@/components/playlist-visibility-button/playlist-visibility-button.component";
import { Suspense } from "react";
import Loading from "@/app/loading";

interface Props {
	params: Promise<{ playlistUuid: string }>;
}

export async function generateMetadata({
	params,
}: Props): Promise<Metadata | null> {
	const { playlistUuid } = await params;

	try {
		const headers = await getAuthHeaders();

		const playlistResponse = await getPlaylist(
			playlistUuid,
			{},
			{
				headers: headers ?? undefined,
			},
		);

		if (playlistResponse.status != 200) {
			return null;
		}

		const playlist = playlistResponse.data;

		const title = getAttribute(playlist.attributes, "title", "string", true);
		const image = getAttribute(playlist.attributes, "thumb", "buffer");

		return {
			title: `${title ?? "Unnamed Playlist"} - Pipe Bomb`,
			openGraph: {
				title: title ?? "Unnamed Playlist",
				description: `Listen to ${title ?? "Unnamed Playlist"} on Pipe Bomb`,
				images: image ? [image.url] : [],
			},
		};
	} finally {
		return null;
	}
}

export default async function Page(props: Props) {
	return (
		<Suspense fallback={<Loading />}>
			<Contents {...props} />
		</Suspense>
	);
}

async function Contents({ params }: Props) {
	const { playlistUuid } = await params;
	const headers = await getAuthHeaders();
	if (!headers) {
		return <h1>Not logged in!</h1>;
	}

	try {
		const playlistResponse = await getPlaylist(
			playlistUuid,
			{
				tracks: 50,
			},
			{
				headers,
			},
		);

		if (playlistResponse.status != 200) {
			return <h1>Not found</h1>;
		}

		const playlist = playlistResponse.data;

		let isOwner = false;
		try {
			const selfResponse = await getSelf({ headers });
			if (selfResponse.status === 200) {
				isOwner =
					selfResponse.data.uuid ===
					(playlist.ownerUuid as unknown as string | null);
			}
		} catch {}

		const title = getAttribute(playlist.attributes, "title", "string", true);
		const thumb = getAttribute(playlist.attributes, "thumb", "buffer", false);

		return (
			<div>
				<div className={styles.top}>
					<ResourceImage
						resource={thumb}
						fallbackSrc="/no_album_art.jpg"
						className={styles.coverArt}
						width={240}
						height={240}
					/>
					<div className={styles.topInfo}>
						<h1 className={styles.title}>{title ?? "Unnamed Playlist"}</h1>
						{!!playlist.ownerUuid && (
							<div className={styles.ownerContainer}>
								<Link
									href={`/user/${playlist.ownerUuid}`}
									className={styles.ownerLink}
								>
									{playlist.owner?.username ?? "Unknown User"}
								</Link>
								<span className={styles.visibilityButton}>
									<PlaylistVisibilityButton playlist={playlist} />
								</span>
							</div>
						)}

						<div className={styles.topButtons}>
							<PlaylistButtons playlist={playlist} isOwner={isOwner} />
						</div>
						<PlaylistUpdateProgress
							playlist={playlist}
							className={styles.updateProgress}
						/>
					</div>
				</div>
				{!!playlist.filterGroups && (
					<PlaylistSmartFilters
						filterGroups={playlist.filterGroups}
						playlistUuid={playlist.uuid}
					/>
				)}
				{playlist.tracks && (
					<RootPadding>
						<PlaylistTrackList
							initialTracks={playlist.tracks}
							totalCount={playlist.trackCount ?? playlist.tracks.length}
							playlistUuid={playlist.uuid}
							dateModified={playlist.dateModified.toString()}
						/>
					</RootPadding>
				)}
			</div>
		);
	} catch (e: any) {
		if ("status" in e) {
			const response = e as getPlaylistResponseError;
			if (response.status == 401) {
				return <h1>Log in to view playlist</h1>;
			}
			if (response.status == 403) {
				return <h1>Forbidden</h1>;
			}
		}

		return <h1>Something went wrong!</h1>;
	}
}
