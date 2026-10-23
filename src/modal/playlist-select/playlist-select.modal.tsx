import { Modal } from "@/components/modal/modal.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { Playlist, useGetOwnPlaylists } from "@api";
import styles from "./playlist-select.module.scss";
import { PlaylistEntry } from "@/components/playlist-entry/playlist-entry.component";
import { TextInput } from "@/components/text-input/text-input.component";
import { useState } from "react";
import { getAttribute } from "@/lib/attribute.util";

interface Props extends InnerProps {
	open: boolean;
	onClose?: () => void;
}

export function PlaylistSelectModal({
	open,
	onClose,
	onSelect,
	loading,
}: Props) {
	return (
		<Modal open={open} onClose={onClose} title="Select Playlist">
			<Inner onSelect={onSelect} loading={loading} />
		</Modal>
	);
}

interface InnerProps {
	onSelect?: (playlist: Playlist) => void;
	loading?: string[] | null;
}

function Inner({ onSelect, loading }: InnerProps) {
	const playlistsQuery = useGetOwnPlaylists({
		query: {
			enabled: true,
		},
	});
	const [query, setQuery] = useState("");

	if (
		playlistsQuery.isPending ||
		!playlistsQuery.data ||
		playlistsQuery.data.status != 200
	) {
		return <Spinner />;
	}

	let playlists = playlistsQuery.data.data;
	if (query) {
		playlists = playlists.filter((playlist) => {
			const title = getAttribute(playlist.attributes, "title", "string", false);
			if (title) {
				return title.toLowerCase().includes(query.toLowerCase());
			}
			return false;
		});
	}

	return (
		<div className={styles.container}>
			<div>
				<TextInput
					value={query}
					onChange={setQuery}
					autoFocus
					placeholder="Search for playlist..."
				/>
			</div>
			{playlists.map((playlist) => (
				<PlaylistEntry
					playlist={playlist}
					key={playlist.uuid}
					onClick={() => onSelect?.(playlist)}
					loading={loading?.includes(playlist.uuid)}
				/>
			))}
		</div>
	);
}
