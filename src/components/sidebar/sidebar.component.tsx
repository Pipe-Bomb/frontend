"use client";

import { cc } from "@/lib/util";
import styles from "./sidebar.module.scss";
import { useSidebarStore } from "@/store/sidebar.store";
import { usePlayerStore } from "@/store/player.store";
import { QueueList } from "@/components/queue-list/queue-list.component";
import { ScrollParentProvider } from "@/context/scroll-parent.context";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconTrash } from "@tabler/icons-react";

export function SideBar() {
	const { open } = useSidebarStore();
	const { queue, clearQueue } = usePlayerStore();

	return (
		<div className={cc(styles.positioner, open && styles.open)}>
			<div className={styles.container}>
				<div className={styles.header}>
					<span className={styles.headerTitle}>Up Next</span>
					{queue.length > 0 && (
						<IconButton
							icon={IconTrash}
							iconSource="tabler"
							size="sm"
							onClick={clearQueue}
						/>
					)}
				</div>
				<ScrollParentProvider className={styles.queue}>
					<QueueList />
				</ScrollParentProvider>
			</div>
		</div>
	);
}
