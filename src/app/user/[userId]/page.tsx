import { getUser } from "@api";
import styles from "./page.module.scss";
import { GridPlaylist } from "@/components/grid-playlist/grid-playlist.component";
import { Metadata } from "next";
import { getAuthHeaders } from "@/lib/server.util";
import { unwrapData } from "@/lib/api.util";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { PlaylistScroller } from "@/components/playlist-scroller/playlist-scroller.component";

interface Props {
	params: Promise<{ userId: string }>;
}

export async function generateMetadata({
	params,
}: Props): Promise<Metadata | null> {
	const { userId } = await params;

	try {
		const userResponse = await getUser(userId, {
			headers: (await getAuthHeaders()) ?? {},
		});

		if (userResponse.status != 200) {
			return null;
		}

		const user = userResponse.data;

		return {
			title: `${user.username} - Pipe Bomb`,
			openGraph: {
				title: user.username,
				description: `View ${user.username}'s profile on Pipe Bomb`,
			},
		};
	} catch (e) {
		console.error(e);
	}

	return null;
}

export default async function Page({ params }: Props) {
	const { userId } = await params;

	const userResponse = await getUser(userId, {
		headers: (await getAuthHeaders()) ?? {},
	});

	if (userResponse.status == 404) {
		return <h1>User not found</h1>;
	}

	const user = unwrapData(userResponse);

	return (
		<div>
			<div className={styles.top}>
				<div className={styles.header}>
					<div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
					<h1 className={styles.username}>{user.username}</h1>
				</div>
			</div>
			{!!user.playlists?.length && (
				<PlaylistScroller
					heading="Playlists"
					horizontalScrollerId={HorizontalScrollerId.USER_PLAYLISTS}
					playlists={user.playlists}
				/>
			)}
		</div>
	);
}
