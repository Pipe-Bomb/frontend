import { usePlayerStore } from "@/store/player.store";
import styles from "./queue-track.module.scss";
import { cc } from "@/lib/util";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
} from "@tabler/icons-react";

interface Props {
	queueIndex: number;
	isSelected?: boolean;
}

export function QueueTrackSkeleton({ queueIndex, isSelected }: Props) {
	const { currentIndex, isPlaying, toggle, playIndex, setIsPlaying } =
		usePlayerStore();
	const active = currentIndex == queueIndex;

	return (
		<div
			className={cc(
				styles.container,
				active && styles.active,
				currentIndex > queueIndex && styles.history,
				isSelected && styles.selected,
			)}
		>
			<div className={styles.imageContainer}>
				<div className={styles.playButton}>
					<IconButton
						iconSource="tabler"
						icon={
							currentIndex == queueIndex && isPlaying
								? IconPlayerPauseFilled
								: IconPlayerPlayFilled
						}
						style={currentIndex == queueIndex ? "simple" : "background"}
						size="lg"
						onClick={() => {
							if (currentIndex == queueIndex) {
								toggle();
							} else {
								playIndex(queueIndex);
								setIsPlaying(true);
							}
						}}
					/>
				</div>
			</div>
		</div>
	);
}
