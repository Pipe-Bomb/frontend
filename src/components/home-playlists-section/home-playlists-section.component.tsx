"use client";

import { useGetOwnPlaylists, Playlist, useGetPublicPlaylists } from "@/api";
import { useAuth } from "@/context/auth.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { useMemo } from "react";
import { PlaylistScroller } from "@/components/playlist-scroller/playlist-scroller.component";

export function HomePlaylistsSection() {
	const mainResponse = useGetOwnPlaylists({ query: { enabled: true } });
	const currentUser = useAuth();

	const publicResponse = useGetPublicPlaylists({ query: { enabled: true } });

	const [myPlaylists, systemPlaylists, friendsPlaylists, publicPlaylists] =
		useMemo<[Playlist[], Playlist[], Playlist[], Playlist[]]>(() => {
			if (
				mainResponse.data?.status !== 200 ||
				publicResponse.data?.status !== 200
			) {
				return [[], [], [], []];
			}
			const playlists = mainResponse.data.data;
			const mine: Playlist[] = [];
			const system: Playlist[] = [];
			const friends: Playlist[] = [];
			for (const playlist of playlists) {
				if (playlist.owner.type == "system") {
					system.push(playlist);
				}
				if (playlist.owner.type == "bot" && playlist.visibility != "public") {
					system.push(playlist);
				}
				if (playlist.owner.type == "user") {
					if (playlist.owner.userUuid == currentUser?.uuid) {
						mine.push(playlist);
					} else {
						friends.push(playlist);
					}
				}
			}
			return [mine, system, friends, publicResponse.data.data];
		}, [mainResponse.data, publicResponse.data, currentUser]);

	if (!mainResponse.data || !publicResponse.data) {
		return <Spinner position="expand" />;
	}

	return (
		<>
			<PlaylistScroller
				heading="My playlists"
				horizontalScrollerId={HorizontalScrollerId.HOME_MY_PLAYLISTS}
				playlists={myPlaylists}
			/>
			<PlaylistScroller
				heading="System playlists"
				horizontalScrollerId={HorizontalScrollerId.HOME_SYSTEM_PLAYLISTS}
				playlists={systemPlaylists}
			/>
			<PlaylistScroller
				heading="Friends' playlists"
				horizontalScrollerId={HorizontalScrollerId.HOME_FRIENDS_PLAYLISTS}
				playlists={friendsPlaylists}
			/>
			<PlaylistScroller
				heading="Public playlists"
				horizontalScrollerId={HorizontalScrollerId.HOME_PUBLIC_PLAYLISTS}
				playlists={publicPlaylists}
			/>
		</>
	);
}
