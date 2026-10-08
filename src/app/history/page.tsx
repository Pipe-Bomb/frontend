import { PlaybackHistoryList } from "@/components/playback-history-list.component";
import styles from "./page.module.scss";
import { RootPadding } from "@/components/root-padding/root-padding.component";

export default function Page() {
	return (
		<RootPadding vertical>
			<div className={styles.container}>
				<h1 className={styles.title}>Listen History</h1>
				<PlaybackHistoryList />
			</div>
		</RootPadding>
	);
}
