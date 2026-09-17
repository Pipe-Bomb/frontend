import { Modal } from "@/components/modal/modal.component";
import { usePathname, useRouter } from "next/navigation";
import { Playlist, PlaylistVisibility, updatePlaylistVisibility } from "@api";
import { useState } from "react";
import styles from "./playlist-visibility.module.scss";
import { Dropdown } from "@/components/dropdown/dropdown.component";
import { Button } from "@/components/button/button.component";
import { useNotificationStore } from "@/store/notification.store";

interface Props extends SharedProps {
	open: boolean;
}

export function PlaylistVisibilityModal({ open, onClose, playlist }: Props) {
	const [isUpdating, setIsUpdating] = useState(false);

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isUpdating) {
					onClose?.();
				}
			}}
			title="Change Playlist Visibility"
		>
			<Inner
				playlist={playlist}
				isUpdating={isUpdating}
				setIsUpdating={setIsUpdating}
				onClose={onClose}
			/>
		</Modal>
	);
}

interface InnerProps extends SharedProps {
	isUpdating: boolean;
	setIsUpdating: (isUpdating: boolean) => void;
}

interface SharedProps {
	playlist: Playlist;
	onClose?: () => void;
}

function Inner({ playlist, onClose, isUpdating, setIsUpdating }: InnerProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [visibility, setVisibility] = useState(playlist.visibility);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { createNotification } = useNotificationStore();

	const update = () => {
		if (isUpdating) {
			return;
		}

		setIsUpdating(true);
		updatePlaylistVisibility(playlist.uuid, {
			visibility,
		})
			.then(() => {
				if (pathname == `/playlist/${playlist.uuid}`) {
					router.refresh();
				}
				createNotification("Updated playlist visibility");
				onClose?.();
			})
			.catch((e) => {
				console.error(e);
				createNotification("Failed to update playlist visibility");
			})
			.finally(() => {
				setIsUpdating(false);
			});
	};

	return (
		<div className={styles.container}>
			<Dropdown
				entries={[
					{
						key: PlaylistVisibility.public,
						t: `playlist.visibility.public.name`,
					},
					{
						key: PlaylistVisibility.unlisted,
						t: `playlist.visibility.unlisted.name`,
					},
					{
						key: PlaylistVisibility.private,
						t: `playlist.visibility.private.name`,
					},
				]}
				selected={visibility}
				onChange={(entry) => {
					setVisibility(entry.key as PlaylistVisibility);
					setDropdownOpen(false);
				}}
				open={dropdownOpen}
				onToggle={setDropdownOpen}
			/>
			<Button loading={isUpdating} onClick={update}>
				Set visibility
			</Button>
		</div>
	);
}
