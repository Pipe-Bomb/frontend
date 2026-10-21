import { useAttribute } from "@/hook/attribute.hook";
import { Artist } from "@api";
import styles from "./grid-artist.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { useRightClick } from "@/hook/right-click.hook";
import { useArtistBookmark } from "@/hook/saved-toggle.hook";
import { ArtistInfoModal } from "@/components/artist-info-modal/artist-info-modal.component";
import { MouseEvent, useMemo, useState } from "react";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import {
	IconCircle,
	IconCircleCheckFilled,
	IconUser,
} from "@tabler/icons-react";
import { cc } from "@/lib/util";
import { useSelectionMode } from "@/store/selection.store";
import { IconButton } from "@/components/icon-button/icon-button";
import { useClickHold } from "@/hook/click-hold.hook";

interface Props {
	artist: Artist;
	isSelected?: boolean;
	onToggleSelected?: (bulk: boolean) => void;
}

export function GridArtist({ artist, isSelected, onToggleSelected }: Props) {
	const [infoOpen, setInfoOpen] = useState(false);
	const { bookmarked, toggle } = useArtistBookmark(artist);
	const inSelectionMode = useSelectionMode();

	const link = useMemo(() => {
		if (artist.uuid) {
			return `/artist/${artist.uuid}`;
		}
		if (artist.identities?.length) {
			const identity = artist.identities[0];
			return `/artist/${identity.pluginId}~${identity.identityId}~${identity.value}`;
		}
		return null;
	}, [artist, inSelectionMode]);

	const name = useAttribute(artist.attributes, "name", "string");
	const thumbnail = useAttribute(artist.attributes, "thumb", "buffer");

	const rightClick = useRightClick(() => [
		{
			languageKey: "contextmenu.artist.view-info",
			key: "view-info",
			onClick: () => setInfoOpen(true),
		},
		{
			languageKey: `contextmenu.artist.${bookmarked ? "unsave" : "save"}`,
			key: "toggle-save",
			onClick: toggle,
		},
	]);

	const handleClick = (e: MouseEvent, forceSelection?: boolean) => {
		e.stopPropagation();
		if (e.ctrlKey || inSelectionMode || forceSelection) {
			e.preventDefault();
			onToggleSelected?.(e.shiftKey);
		}
	};
	const hold = useClickHold((e) => onToggleSelected?.(e.shiftKey), handleClick);

	return (
		<>
			<OptionalLink
				className={cc(
					styles.container,
					isSelected && styles.selected,
					inSelectionMode && styles.selectionMode,
				)}
				href={link}
				{...rightClick}
				{...hold}
			>
				<div className={styles.imageContainer}>
					<IconButton
						icon={isSelected ? IconCircleCheckFilled : IconCircle}
						iconSource="tabler"
						className={styles.selectedCheck}
						size="lg"
					/>
					{thumbnail ? (
						<ResourceImage
							resource={thumbnail}
							className={styles.image}
							width={160}
							height={160}
						/>
					) : (
						<div className={styles.imageFallback}>
							<IconUser size={52} stroke={1.25} />
						</div>
					)}
				</div>
				<span className={styles.name}>{name ?? "Unknown Artist"}</span>
			</OptionalLink>
			<ArtistInfoModal
				artist={artist}
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
			/>
		</>
	);
}
