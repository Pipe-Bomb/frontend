import { useAttribute } from "@/hook/attribute.hook";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { Playlist } from "@api";
import styles from "./grid-playlist.module.scss";
import Link from "next/link";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";

interface Props {
	playlist: Playlist;
}

export function GridPlaylist({ playlist }: Props) {
	const title = useAttribute(playlist.attributes, "title", "string");
	const thumb = useRawAttribute(playlist.attributes, "thumb", "buffer");

	return (
		<div className={styles.container}>
			<Link
				className={styles.imageContainer}
				href={`/playlist/${playlist.uuid}`}
			>
				<ResourceImage
					resource={thumb}
					className={styles.image}
					fallback={<AlbumArtFallback />}
					width={180}
					height={180}
				/>
			</Link>
			<Link href={`/playlist/${playlist.uuid}`} className={styles.name}>
				{title ?? "Unnamed Playlist"}
			</Link>
			{!!playlist.owner && (
				<Link href={`/user/${playlist.owner.uuid}`} className={styles.owner}>
					{playlist.owner.username}
				</Link>
			)}
		</div>
	);
}
