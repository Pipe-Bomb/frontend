"use client";

import { useGetOwnPlaylists, Playlist } from "@/api";
import { useAuth } from "@/context/auth.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { GridPlaylist } from "@/components/grid-playlist/grid-playlist.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { useMemo } from "react";

export function HomePlaylistsSection() {
	const { data } = useGetOwnPlaylists({ query: { enabled: true } });
	const currentUser = useAuth();

	const [myPlaylists, systemPlaylists, friendsPlaylists] = useMemo<
		[Playlist[], Playlist[], Playlist[]]
	>(() => {
		if (data?.status !== 200) {
			return [[], [], []];
		}
		const playlists = data.data;
		const mine: Playlist[] = [];
		const system: Playlist[] = [];
		const friends: Playlist[] = [];
		for (const playlist of playlists) {
			const ownerUuid = playlist.ownerUuid as string | null;
			if (ownerUuid === null) {
				system.push(playlist);
			} else if (ownerUuid === currentUser?.uuid) {
				mine.push(playlist);
			} else {
				friends.push(playlist);
			}
		}
		return [mine, system, friends];
	}, [data, currentUser]);

	if (!data) {
		return <Spinner position="expand" />;
	}

	return (
		<>
			<HorizontalScroller
				heading="My playlists"
				id={HorizontalScrollerId.HOME_MY_PLAYLISTS}
			>
				{myPlaylists.map((playlist) => (
					<GridPlaylist key={playlist.uuid} playlist={playlist} />
				))}
			</HorizontalScroller>
			<HorizontalScroller
				heading="System playlists"
				id={HorizontalScrollerId.HOME_SYSTEM_PLAYLISTS}
			>
				{systemPlaylists.map((playlist) => (
					<GridPlaylist key={playlist.uuid} playlist={playlist} />
				))}
			</HorizontalScroller>
			<HorizontalScroller
				heading="Friends' playlists"
				id={HorizontalScrollerId.HOME_FRIENDS_PLAYLISTS}
			>
				{friendsPlaylists.map((playlist) => (
					<GridPlaylist key={playlist.uuid} playlist={playlist} />
				))}
			</HorizontalScroller>
		</>
	);
}
