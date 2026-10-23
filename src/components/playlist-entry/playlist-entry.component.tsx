import { useAttribute } from "@/hook/attribute.hook";
import { Playlist } from "@api";
import styles from "./playlist-entry.module.scss";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { cc } from "@/lib/util";
import { Spinner } from "@/components/spinner/spinner.component";

interface Props {
	playlist: Playlist;
	onClick?: () => void;
	loading?: boolean;
}

export function PlaylistEntry({ playlist, onClick, loading }: Props) {
	const title = useAttribute(playlist.attributes, "title", "string");
	const thumb = useAttribute(playlist.attributes, "thumb", "buffer");

	return (
		<button
			className={cc(styles.container, loading && styles.loading)}
			onClick={onClick}
		>
			<div className={styles.thumbContainer}>
				{loading ? (
					<Spinner size="sm" />
				) : (
					<ResourceImage
						resource={thumb}
						fallback={<AlbumArtFallback />}
						className={styles.thumb}
						width={32}
						height={32}
					/>
				)}
			</div>
			<span className={styles.title}>{title ?? "Unnamed Playlist"}</span>
		</button>
	);
}
