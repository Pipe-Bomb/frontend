"use client";

import { useGetOwnPlaylists, Playlist, useGetPublicPlaylists } from "@/api";
import { useAuth } from "@/context/auth.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { GridPlaylist } from "@/components/grid-playlist/grid-playlist.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { useMemo } from "react";

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
			<HorizontalScroller
				heading="Public playlists"
				id={HorizontalScrollerId.HOME_PUBLIC_PLAYLISTS}
			>
				{publicPlaylists.map((playlist) => (
					<GridPlaylist key={playlist.uuid} playlist={playlist} />
				))}
			</HorizontalScroller>
		</>
	);
}
