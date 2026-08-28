import {
	getGetInstalledPluginsQueryKey,
	getListMarketplacePluginsQueryKey,
	installPlugin,
	MarketplacePlugin,
} from "@api";
import styles from "./list-marketplace-plugin.module.scss";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { IconCloudDownload } from "@tabler/icons-react";
import { IconButton } from "@/components/icon-button/icon-button";
import { useState } from "react";
import { safeFetch } from "@/lib/api.util";
import { useNotificationStore } from "@/store/notification.store";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface Props {
	plugin: MarketplacePlugin;
}

export function ListMarketplacePlugin({ plugin }: Props) {
	const [isInstalling, setIsInstalling] = useState(false);
	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();
	const queryClient = useQueryClient();
	const router = useRouter();

	const install = async () => {
		if (isInstalling) {
			return;
		}
		setIsInstalling(true);

		const [url, ref] = plugin.repository.split("#", 2);
		const notificationId = createNotification(`Installing plugin`, {
			isLoading: true,
			timeout: null,
		});

		const [status, data] = await safeFetch(installPlugin, {
			url,
			ref,
		});

		setIsInstalling(false);

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
		<div className={styles.container}>
			<div className={styles.info}>
				<span className={styles.author}>
					By{" "}
					<OptionalLink href={plugin.authorUrl} target="_blank">
						{plugin.authorName}
					</OptionalLink>
				</span>
				<div className={styles.nameContainer}>
					<span className={styles.name}>{plugin.name}</span>
				</div>
				{plugin.description && (
					<span className={styles.description}>{plugin.description}</span>
				)}
			</div>
			<div className={styles.installContainer}>
				{plugin.installed ? (
					<span className={styles.installedBadge}>Installed</span>
				) : (
					<IconButton
						icon={IconCloudDownload}
						iconSource="tabler"
						style="background"
						loading={isInstalling}
						onClick={install}
					/>
				)}
			</div>
		</div>
	);
}
