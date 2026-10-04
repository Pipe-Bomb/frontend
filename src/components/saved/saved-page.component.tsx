"use client";

import { Button } from "@/components/button/button.component";
import { Tabs } from "@/components/tabs/tabs.component";
import { useUrlParam } from "@/hook/url-param.hook";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import { SavedAlbums } from "./saved-albums.component";
import { SavedArtists } from "./saved-artists.component";
import { SavedTracks } from "./saved-tracks.component";
import styles from "./saved-page.module.scss";

type SavedType = "tracks" | "albums" | "artists";

const TABS: { value: SavedType; label: string }[] = [
	{ value: "tracks", label: "Tracks" },
	{ value: "albums", label: "Albums" },
	{ value: "artists", label: "Artists" },
];

export function SavedPage() {
	const [typeParam, setTypeParam] = useUrlParam("type", { replace: true });
	const { setPage } = useUrlPagination("page");

	const active: SavedType =
		typeParam == "albums" || typeParam == "artists"
			? typeParam
			: "tracks";

	const switchTab = (value: SavedType) => {
		setTypeParam(value == "tracks" ? null : value);
		setPage(1);
	};

	return (
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
	);
}
