import { useAttribute } from "@/hook/attribute.hook";
import { Artist } from "@api";
import styles from "./grid-artist.module.scss";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { useRightClick } from "@/hook/right-click.hook";
import { ArtistInfoModal } from "@/components/artist-info-modal/artist-info-modal.component";
import { useMemo, useState } from "react";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { IconUser } from "@tabler/icons-react";

interface Props {
	artist: Artist;
}

export function GridArtist({ artist }: Props) {
	const [infoOpen, setInfoOpen] = useState(false);

	const link = useMemo(() => {
		if (artist.uuid) {
			return `/artist/${artist.uuid}`;
		}
		if (artist.identities?.length) {
			const identity = artist.identities[0];
			return `/artist/${identity.pluginId}~${identity.identityId}~${identity.value}`;
		}
		return null;
	}, [artist]);

	const name = useAttribute(artist.attributes, "name", "string");
	const thumbnail = useRawAttribute(artist.attributes, "thumb", "buffer");

	const rightClick = useRightClick(() => [
		{
			languageKey: "contextmenu.artist.view-info",
			key: "view-info",
			onClick: () => setInfoOpen(true),
		},
	]);

	return (
		<>
			<OptionalLink className={styles.container} href={link} {...rightClick}>
				<div className={styles.imageContainer}>
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
