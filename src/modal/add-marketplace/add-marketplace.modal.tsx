import { Modal } from "@/components/modal/modal.component";
import { TextInput } from "@/components/text-input/text-input.component";
import { useNotificationStore } from "@/store/notification.store";
import { safeFetch } from "@/lib/api.util";
import {
	addMarketplace,
	getListMarketplacePluginsQueryKey,
	getListMarketplacesQueryKey,
} from "@api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./add-marketplace.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconPlus } from "@tabler/icons-react";

interface Props {
	open: boolean;
	onClose?: () => void;
}

export function AddMarketplaceModal({ open, onClose }: Props) {
	const [isInstalling, setIsInstalling] = useState(false);
	const [url, setUrl] = useState("");
	const { createNotification } = useNotificationStore();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (open) {
			setUrl("");
		}
	}, [open]);

	const install = async () => {
		if (isInstalling || !url.trim()) {
			return;
		}

		setIsInstalling(true);

		const [status, data] = await safeFetch(addMarketplace, { url });
		setIsInstalling(false);

		if (status === 201) {
			createNotification("Marketplace added successfully");
			queryClient.invalidateQueries({
				queryKey: getListMarketplacesQueryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: getListMarketplacePluginsQueryKey(),
			});
			onClose?.();
		} else {
			if (data) {
				createNotification(`Failed to install plugin: ${data.message}`);
			} else {
				createNotification(`Failed to install plugin`);
			}
		}
	};

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isInstalling) {
					onClose?.();
				}
			}}
		>
			<Inner
				url={url}
				isInstalling={isInstalling}
				onUrlChange={setUrl}
				onInstall={install}
			/>
		</Modal>
	);
}

interface InnerProps {
	url: string;
	isInstalling: boolean;
	onUrlChange: (value: string) => void;
	onInstall: () => void;
}

function Inner({ url, isInstalling, onUrlChange, onInstall }: InnerProps) {
	return (
		<div className={styles.container}>
			{/* <h2 className={styles.title}>Install Plugin</h2> */}
			<TextInput
				value={url}
				onChange={onUrlChange}
				placeholder="https://.../marketplace.json"
				disabled={isInstalling}
				autoFocus
				onEnter={onInstall}
			/>
			<IconButton
				onClick={onInstall}
				disabled={!url.trim()}
				loading={isInstalling}
				icon={IconPlus}
				iconSource="tabler"
			/>
		</div>
	);
}
