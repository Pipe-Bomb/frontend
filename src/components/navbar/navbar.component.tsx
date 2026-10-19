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
	IconBookmark,
	IconDatabase,
	IconDisc,
	IconHistory,
	IconHome,
	IconMusicCode,
	IconMusicShare,
	IconPlug,
	IconPlus,
	IconServerCog,
	IconUser,
	IconUserCog,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { NavbarLink } from "@/components/navbar-link/navbar-link.component";
import { CreatePlaylistModal } from "@/modal/create-playlist/create-playlist.modal";
import {
	ComponentType,
	CSSProperties,
	SVGProps,
	useMemo,
	useState,
} from "react";
import { useAttribute } from "@/hook/attribute.hook";
import { useRightClick } from "@/hook/right-click.hook";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { useAuth } from "@/context/auth.context";
import { NavbarSection } from "@/components/navbar-section/navbar-section.component";
import { useTranslation } from "@/context/language.context";
import { useUISettings } from "@/context/ui-settings.context";
import { cc } from "@/lib/util";

function clampWidth(width: number) {
	if (width < 70) {
		return 50;
	}
	return Math.min(width, 400);
}

export function Navbar() {
	const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
	const hasPrivilege = usePrivilegeCheck();
	const { t } = useTranslation();
	const [width, setWidth] = useUISettings("navbarWidth", 200);
	const clampedWidth = clampWidth(width);
	const mini = clampedWidth <= 50;

	const widthCss = useMemo(
		() =>
			({
				"--width": `${width}px`,
			}) as CSSProperties,
		[width],
	);

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

	const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();

		const startX = e.pageX;

		const moveListener = (e: MouseEvent) =>
			setWidth(clampWidth(width + e.pageX - startX));

		const mouseUpListener = () => {
			window.removeEventListener("mousemove", moveListener);
			window.removeEventListener("mouseup", mouseUpListener);
		};

		window.addEventListener("mousemove", moveListener);
		window.addEventListener("mouseup", mouseUpListener);
	};

	return (
		<>
			<div
				className={cc(styles.positioner, mini && styles.mini)}
				style={widthCss}
			>
				<div
					className={styles.resizeHandle}
					onMouseDown={onResizeMouseDown}
				></div>
				<div className={styles.container}>
					<div className={styles.main}>
						<NavbarSection title="Main" id="main" mini={mini}>
							<NavbarLink
								href="/"
								name="Home"
								active={pathname == "/"}
								icon={IconHome}
								mini={mini}
							/>
							<NavbarLink
								href="/artists"
								name="Artists"
								active={pathname == "/artists"}
								icon={IconUser}
								mini={mini}
							/>
							<NavbarLink
								href="/albums"
								name="Albums"
								active={pathname == "/albums"}
								icon={IconDisc}
								mini={mini}
							/>
							<NavbarLink
								href="/saved"
								name="Saved"
								active={pathname.startsWith("/saved")}
								icon={IconBookmark}
								mini={mini}
							/>
							<NavbarLink
								href="/history"
								name="History"
								active={pathname.startsWith("/history")}
								icon={IconHistory}
								mini={mini}
							/>
						</NavbarSection>

						<NavbarSection title="Libraries" id="libraries" mini={mini}>
							{libraries.data?.status == 200 ? (
								<>
									{libraries.data.data.map((library) => (
										<NavbarLink
											href={`/library/${library.pluginId}/${library.id}`}
											key={`${library.pluginId} ${library.id}`}
											active={
												pathname == `/library/${library.pluginId}/${library.id}`
											}
											name={library.name}
											subtitle={
												mini ? null : t(`plugin.${library.pluginId}.name`)
											}
											icon={IconPlug}
											mini={mini}
										/>
									))}
								</>
							) : (
								<Spinner position="expand" />
							)}
						</NavbarSection>

						<NavbarSection
							title="Playlists"
							id="playlists"
							mini={mini}
							actions={[
								{
									icon: IconPlus,
									onClick: () => setCreatePlaylistOpen(true),
								},
							]}
						>
							{playlists.data && playlists.data.status == 200 ? (
								<>
									{playlists.data.data.map((playlist) => (
										<PlaylistLink
											playlist={playlist}
											key={playlist.uuid}
											mini={mini}
										/>
									))}
								</>
							) : (
								<Spinner position="expand" />
							)}
						</NavbarSection>
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

function PlaylistLink({
	playlist,
	mini,
}: {
	playlist: Playlist;
	mini: boolean;
}) {
	const pathname = usePathname();
	const title = useAttribute(playlist.attributes, "title", "string");
	const queryClient = useQueryClient();
	const router = useRouter();
	const user = useAuth();
	const thumb = useAttribute(playlist.attributes, "thumb", "buffer");

	const [owner, icon]: [string, ComponentType<SVGProps<SVGSVGElement>> | null] =
		useMemo(() => {
			if (
				playlist.owner.type == "user" &&
				playlist.owner.userUuid !== user?.uuid
			) {
				return [
					playlist.owner.user?.username ?? "Unknown user",
					IconMusicShare,
				];
			}
			if (playlist.owner.type == "bot") {
				return [playlist.owner.botName ?? playlist.owner.botId, IconMusicCode];
			}
			if (playlist.owner.type == "system") {
				return ["SYSTEM", IconMusicCode];
			}
			return [user?.username ?? "Unknown user", null];
		}, [user?.uuid, playlist.owner]);

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
			icon={icon}
			image={thumb}
			showFallbackImage
			subtitle={owner}
			mini={mini}
			{...rightClick}
		/>
	);
}
