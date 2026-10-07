import { useAttribute } from "@/hook/attribute.hook";
import { Playlist } from "@api";
import styles from "./playlist-entry.module.scss";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";

interface Props {
	playlist: Playlist;
	onClick?: () => void;
}

export function PlaylistEntry({ playlist, onClick }: Props) {
	const title = useAttribute(playlist.attributes, "title", "string");
	const thumb = useAttribute(playlist.attributes, "thumb", "buffer");

	return (
		<button className={styles.container} onClick={onClick}>
			<div className={styles.thumbContainer}>
				{thumb ? (
					<img
						src={`${thumb.url}?width=32&height=32`}
						className={styles.thumb}
					/>
				) : (
					<AlbumArtFallback />
				)}
			</div>
			<span className={styles.title}>{title ?? "Unnamed Playlist"}</span>
		</button>
	);
}
