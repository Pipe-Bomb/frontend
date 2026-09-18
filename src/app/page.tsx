"use client";

import { RequireAuth } from "@/guard/auth.guard";
import styles from "./page.module.scss";
import { HomeHistorySection } from "@/components/home-history-section/home-history-section.component";
import { HomePlaylistsSection } from "@/components/home-playlists-section/home-playlists-section.component";
import { WelcomeBanner } from "@/components/welcome-banner/welcome-banner.component";

export default function Home() {
	return (
		<RequireAuth>
			<div className={styles.container}>
				<WelcomeBanner />
				<HomePlaylistsSection />
				<HomeHistorySection />
			</div>
		</RequireAuth>
	);
}
