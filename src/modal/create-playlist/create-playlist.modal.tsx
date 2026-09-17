"use client";

import { Button } from "@/components/button/button.component";
import { Modal } from "@/components/modal/modal.component";
import { TextInput } from "@/components/text-input/text-input.component";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./create-playlist.module.scss";
import { createPlaylist, getGetOwnPlaylistsQueryKey } from "@api";
import { useQueryClient } from "@tanstack/react-query";

interface Props extends InnerProps {
	open: boolean;
	onClose?: () => void;
}

export function CreatePlaylistModal({ open, onClose, onCreate }: Props) {
	return (
		<Modal open={open} onClose={onClose} title="Create Playlist">
			<Inner onCreate={onCreate} />
		</Modal>
	);
}

interface InnerProps {
	onCreate?: () => void;
}

function Inner({ onCreate }: InnerProps) {
	const router = useRouter();
	const [isCreating, setIsCreating] = useState(false);
	const [title, setTitle] = useState("");
	const queryClient = useQueryClient();

	const create = () => {
		if (isCreating || !title.trim()) {
			return;
		}

		setIsCreating(true);
		createPlaylist({
			attributes: [
				{
					key: "title",
					type: "string",
					value: title.trim(),
				},
			],
		})
			.then((response) => {
				if (response.status == 200) {
					const playlist = response.data;
					router.push(`/playlist/${playlist.uuid}`);
					queryClient.invalidateQueries({
						queryKey: getGetOwnPlaylistsQueryKey(),
					});
					onCreate?.();
				}
			})
			.catch(console.error)
			.finally(() => setIsCreating(false));
	};

	return (
		<div className={styles.container}>
			<TextInput
				value={title}
				onChange={setTitle}
				placeholder="Playlist Title"
				autoFocus
				onEnter={create}
				disabled={isCreating}
			/>
			<Button onClick={create} loading={isCreating}>
				Create
			</Button>
		</div>
	);
}
