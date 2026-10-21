import { useAttribute } from "@/hook/attribute.hook";
import { Playlist } from "@api";
import styles from "./grid-playlist.module.scss";
import Link from "next/link";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";
import { cc } from "@/lib/util";
import { MouseEvent } from "react";
import { useSelectionMode } from "@/store/selection.store";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { useClickHold } from "@/hook/click-hold.hook";

interface Props {
	playlist: Playlist;
	isSelected?: boolean;
	onToggleSelected?: (bulk: boolean) => void;
}

export function GridPlaylist({
	playlist,
	isSelected,
	onToggleSelected,
}: Props) {
	const title = useAttribute(playlist.attributes, "title", "string");
	const thumb = useAttribute(playlist.attributes, "thumb", "buffer");
	const inSelectionMode = useSelectionMode();

	const handleClick = (e: MouseEvent) => {
		e.stopPropagation();
		if (e.ctrlKey || inSelectionMode) {
			e.preventDefault();
			onToggleSelected?.(e.shiftKey);
		}
	};
	const hold = useClickHold((e) => onToggleSelected?.(e.shiftKey), handleClick);

	return (
		<div
			className={cc(
				styles.container,
				isSelected && styles.selected,
				inSelectionMode && styles.selectionMode,
			)}
		>
			<OptionalLink
				className={styles.imageContainer}
				href={`/playlist/${playlist.uuid}`}
				onClick={handleClick}
				{...hold}
			>
				<IconButton
					icon={isSelected ? IconCircleCheckFilled : IconCircle}
					iconSource="tabler"
					className={styles.selectedCheck}
					size="lg"
				/>
				<ResourceImage
					resource={thumb}
					className={styles.image}
					fallback={<AlbumArtFallback />}
					width={180}
					height={180}
				/>
			</OptionalLink>
			<OptionalLink
				href={`/playlist/${playlist.uuid}`}
				className={styles.name}
				onClick={handleClick}
			>
				{title ?? "Unnamed Playlist"}
			</OptionalLink>
			{playlist.owner.type == "user" && (
				<Link
					href={`/user/${playlist.owner.userUuid}`}
					className={styles.owner}
				>
					{playlist.owner.user?.username ?? "Unknown user"}
				</Link>
			)}
			{playlist.owner.type == "bot" && (
				<span className={styles.owner}>
					{playlist.owner.botName ?? playlist.owner.botId}
				</span>
			)}
		</div>
	);
}
