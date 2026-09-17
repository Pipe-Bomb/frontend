"use client";

import { Modal } from "@/components/modal/modal.component";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { Playlist, updatePlaylistAttributes } from "@api";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./rename-playlist.module.scss";
import { TextInput } from "@/components/text-input/text-input.component";
import { Button } from "@/components/button/button.component";
import { useNotificationStore } from "@/store/notification.store";

interface Props extends SharedProps {
	open: boolean;
}

export function RenamePlaylistModal({ open, onClose, playlist }: Props) {
	const [isRenaming, setIsRenaming] = useState(false);

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isRenaming) {
					onClose?.();
				}
			}}
			title="Rename Playlist"
		>
			<Inner
				playlist={playlist}
				isRenaming={isRenaming}
				setIsRenaming={setIsRenaming}
				onClose={onClose}
			/>
		</Modal>
	);
}

interface InnerProps extends SharedProps {
	isRenaming: boolean;
	setIsRenaming: (isRenaming: boolean) => void;
}

interface SharedProps {
	playlist: Playlist;
	onClose?: () => void;
}

function Inner({ playlist, onClose, isRenaming, setIsRenaming }: InnerProps) {
	const router = useRouter();
	const pathname = usePathname();

	const initialName = useRawAttribute(playlist.attributes, "title", "string");
	const [title, setTitle] = useState(initialName ?? "");
	const { createNotification } = useNotificationStore();

	const rename = () => {
		if (isRenaming || !title.trim()) {
			return;
		}

		setIsRenaming(true);
		updatePlaylistAttributes(playlist.uuid, {
			attributes: [
				{
					type: "string",
					key: "title",
					value: title,
				},
			],
		})
			.then(() => {
				if (pathname == `/playlist/${playlist.uuid}`) {
					router.refresh();
				}
				createNotification("Renamed playlist");
				onClose?.();
			})
			.catch((e) => {
				console.error(e);
				createNotification("Failed to rename playlist");
			})
			.finally(() => {
				setIsRenaming(false);
			});
	};

	return (
		<div className={styles.container}>
			<TextInput
				value={title}
				onChange={setTitle}
				placeholder="Playlist Title"
				autoFocus
				onEnter={rename}
				disabled={isRenaming}
			/>
			<Button onClick={rename} loading={isRenaming}>
				Rename
			</Button>
		</div>
	);
}
