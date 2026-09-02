"use client";

import Link from "next/link";
import styles from "./navbar.module.scss";
import {
	deletePlaylist,
	getGetOwnPlaylistsQueryKey,
	Playlist,
	useGetAllLibraries,
	useGetOwnPlaylists,
} from "@api";
import { Spinner } from "@/components/spinner/spinner.component";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconDisc,
	IconPlus,
	IconServerCog,
	IconUser,
	IconUserCog,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { NavbarLink } from "@/components/navbar-link/navbar-link.component";
import { CreatePlaylistModal } from "@/modal/create-playlist/create-playlist.modal";
import { useState } from "react";
import { useAttribute } from "@/hook/attribute.hook";
import { useRightClick } from "@/hook/right-click.hook";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";

export function Navbar() {
	const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
	const hasPrivilege = usePrivilegeCheck();

	const libraries = useGetAllLibraries({
		query: {
			enabled: true,
		},
	});
	const playlists = useGetOwnPlaylists({
		query: {
			enabled: true,
			refetchInterval: 10_000,
		},
	});
	const pathname = usePathname();

	if (pathname.startsWith("/settings/")) {
		return null;
	}

	const showSettings =
		hasPrivilege("view-tasks") ||
		hasPrivilege("view-privileges") ||
		hasPrivilege("edit-attribute-source-order") ||
		hasPrivilege("view-workflows");

	return (
		<>
			<div className={styles.positioner}>
				<div className={styles.container}>
					<div className={styles.main}>
						<div>
							<NavbarLink
								href="/artists"
								name="Artists"
								active={pathname == "/artists"}
								icon={IconUser}
							/>
							<NavbarLink
								href="/albums"
								name="Albums"
								active={pathname == "/albums"}
								icon={IconDisc}
							/>
						</div>

						<div>
							<span className={styles.sectionName}>Libraries</span>
							{libraries.data?.status == 200 ? (
								<div className={styles.linkList}>
									{libraries.data.data.map((library) => (
										<NavbarLink
											href={`/library/${library.pluginId}/${library.id}`}
											key={`${library.pluginId} ${library.id}`}
											active={
												pathname == `/library/${library.pluginId}/${library.id}`
											}
											name={library.name}
										/>
									))}
								</div>
							) : (
								<Spinner position="expand" />
							)}
						</div>

						<div>
							<span className={styles.sectionName}>Playlists</span>
							{playlists.data && playlists.data.status == 200 ? (
								<div className={styles.linkList}>
									{playlists.data.data.map((playlist) => (
										<PlaylistLink playlist={playlist} key={playlist.uuid} />
									))}
									<IconButton
										icon={IconPlus}
										iconSource="tabler"
										size="sm"
										onClick={() => setCreatePlaylistOpen(true)}
										className={styles.newPlaylistButton}
									/>
								</div>
							) : (
								<Spinner position="expand" />
							)}
						</div>
					</div>
					<div className={styles.bottom}>
						<Link href="/settings/user">
							<IconButton icon={IconUserCog} iconSource="tabler" />
						</Link>
						{showSettings && (
							<Link href="/settings/system">
								<IconButton icon={IconServerCog} iconSource="tabler" />
							</Link>
						)}
					</div>
				</div>
			</div>
			<CreatePlaylistModal
				open={createPlaylistOpen}
				onClose={() => setCreatePlaylistOpen(false)}
				onCreate={() => setCreatePlaylistOpen(false)}
			/>
		</>
	);
}

function PlaylistLink({ playlist }: { playlist: Playlist }) {
	const pathname = usePathname();
	const title = useAttribute(playlist.attributes, "title", "string");
	const queryClient = useQueryClient();
	const router = useRouter();

	const rightClick = useRightClick(() => [
		{
			key: "delete",
			languageKey: "contextmenu.playlist.delete",
			onClick: () => {
				deletePlaylist(playlist.uuid).then((response) => {
					if (response.status == 204) {
						queryClient.invalidateQueries({
							queryKey: getGetOwnPlaylistsQueryKey(),
						});
						if (pathname == `/playlist/${playlist.uuid}`) {
							router.push("/");
						}
					}
				});
			},
		},
	]);

	return (
		<NavbarLink
			href={`/playlist/${playlist.uuid}`}
			key={playlist.uuid}
			active={pathname == `/playlist/${playlist.uuid}`}
			name={title ?? "Unnamed Playlist"}
			{...rightClick}
		/>
	);
}
