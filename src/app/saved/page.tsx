"use client";

import { RequireAuth } from "@/guard/auth.guard";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { useUrlParam } from "@/hook/url-param.hook";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import styles from "./page.module.scss";
import { Tabs } from "@/components/tabs/tabs.component";
import { Button } from "@/components/button/button.component";
import { SavedTracks } from "@/app/saved/saved-tracks.component";
import { SavedArtists } from "@/app/saved/saved-artists";
import { SavedAlbums } from "@/app/saved/saved-albums";

type SavedType = "tracks" | "albums" | "artists";

const TABS: { value: SavedType; label: string }[] = [
	{ value: "tracks", label: "Tracks" },
	{ value: "albums", label: "Albums" },
	{ value: "artists", label: "Artists" },
] as const;

export default function SavedRoute() {
	const [typeParam, setTypeParam] = useUrlParam("type", { replace: true });
	const { setPage } = useUrlPagination("page");

	const active: SavedType =
		typeParam == "albums" || typeParam == "artists" ? typeParam : "tracks";

	const switchTab = (value: SavedType) => {
		setTypeParam(value == "tracks" ? null : value);
		setPage(1);
	};

	return (
		<RequireAuth>
			<RootPadding vertical>
				<div className={styles.container}>
					<h1 className={styles.title}>Saved</h1>
					<Tabs className={styles.tabs}>
						{TABS.map((tab) => (
							<Button
								key={tab.value}
								style={active == tab.value ? "primary" : "secondary"}
								onClick={() => switchTab(tab.value)}
							>
								{tab.label}
							</Button>
						))}
					</Tabs>
					{active == "tracks" && <SavedTracks />}
					{active == "albums" && <SavedAlbums />}
					{active == "artists" && <SavedArtists />}
				</div>
			</RootPadding>
		</RequireAuth>
	);
}
