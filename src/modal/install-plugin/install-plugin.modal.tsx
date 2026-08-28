import { Button } from "@/components/button/button.component";
import { Modal } from "@/components/modal/modal.component";
import { TextInput } from "@/components/text-input/text-input.component";
import { useNotificationStore } from "@/store/notification.store";
import { safeFetch } from "@/lib/api.util";
import {
	getGetInstalledPluginsQueryKey,
	getListMarketplacePluginsQueryKey,
	installPlugin,
} from "@api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./install-plugin.module.scss";

interface Props {
	open: boolean;
	onClose?: () => void;
}

export function InstallPluginModal({ open, onClose }: Props) {
	const [isInstalling, setIsInstalling] = useState(false);
	const [url, setUrl] = useState("");
	const [ref, setRef] = useState("");
	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();
	const queryClient = useQueryClient();
	const router = useRouter();

	const install = async () => {
		if (isInstalling || !url.trim()) {
			return;
		}

		setIsInstalling(true);
		const notificationId = createNotification(`Installing plugin`, {
			isLoading: true,
			timeout: null,
		});
		onClose?.();

		const [status, data] = await safeFetch(installPlugin, {
			url: url.trim(),
			...(ref.trim() ? { ref: ref.trim() } : {}),
		});

		setIsInstalling(false);
		setUrl("");
		setRef("");

		if (status === 201) {
			updateNotification(notificationId, {
				message: `Plugin installed successfully`,
				isLoading: false,
			});
			queryClient.invalidateQueries({
				queryKey: getGetInstalledPluginsQueryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: getListMarketplacePluginsQueryKey(),
			});
			router.refresh();
		} else {
			if (data) {
				updateNotification(notificationId, {
					message: `Failed to install plugin: ${data.message}`,
					isLoading: false,
				});
			} else {
				updateNotification(notificationId, {
					message: `Failed to install plugin`,
					isLoading: false,
				});
			}
		}
		resetNotificationTimeout(notificationId);
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
				ref_={ref}
				isInstalling={isInstalling}
				onUrlChange={setUrl}
				onRefChange={setRef}
				onInstall={install}
			/>
		</Modal>
	);
}

interface InnerProps {
	url: string;
	ref_: string;
	isInstalling: boolean;
	onUrlChange: (value: string) => void;
	onRefChange: (value: string) => void;
	onInstall: () => void;
}

function Inner({
	url,
	ref_,
	isInstalling,
	onUrlChange,
	onRefChange,
	onInstall,
}: InnerProps) {
	return (
		<div className={styles.container}>
			<h2 className={styles.title}>Install Plugin</h2>
			<div className={styles.field}>
				<span className={styles.label}>Git URL</span>
				<TextInput
					value={url}
					onChange={onUrlChange}
					placeholder="https://github.com/pipe-bomb/local-library-plugin.git"
					disabled={isInstalling}
					autoFocus
					onEnter={onInstall}
				/>
			</div>
			<div className={styles.field}>
				<span className={styles.label}>Branch / Tag (optional)</span>
				<TextInput
					value={ref_}
					onChange={onRefChange}
					placeholder="main"
					disabled={isInstalling}
					onEnter={onInstall}
				/>
			</div>
			<Button onClick={onInstall} disabled={!url.trim()} loading={isInstalling}>
				Install
			</Button>
		</div>
	);
}
