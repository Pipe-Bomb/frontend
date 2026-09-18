import { useTranslation } from "@/context/language.context";
import styles from "./list-plugin.module.scss";
import { useRightClick } from "@/hook/right-click.hook";
import { ConfirmPluginDeleteModal } from "@/modal/confirm-plugin-delete/confirm-plugin-delete.modal";
import { useMemo, useState } from "react";
import {
	checkPluginUpdates,
	getGetInstalledPluginsQueryKey,
	LoadedPlugin,
	LoadedPluginUpdateStatus,
	updatePlugin,
} from "@api";
import {
	IconButton,
	IconComponent,
} from "@/components/icon-button/icon-button";
import {
	IconCircleCheck,
	IconCloudDown,
	IconCloudDownload,
	IconCloudQuestion,
	IconLoader2,
	IconRefreshOff,
} from "@tabler/icons-react";
import { safeFetch } from "@/lib/api.util";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notification.store";

interface Props {
	plugin: LoadedPlugin;
}

export function ListPlugin({ plugin }: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const onRightClick = useRightClick(() => [
		{
			key: "delete",
			languageKey: "contextmenu.plugin.delete",
			onClick: () => setIsDeleteModalOpen(true),
		},
	]);

	const checkForUpdates = async () => {
		if (isCheckingUpdates) {
			return;
		}
		setIsCheckingUpdates(true);
		const [status, data] = await safeFetch(checkPluginUpdates, plugin.name);
		if (status == 200) {
			queryClient.invalidateQueries({
				queryKey: getGetInstalledPluginsQueryKey(),
			});
		} else {
			if (data?.message) {
				createNotification(`Failed to check for updates: ${data.message}`);
			} else {
				createNotification("Failed to check for updates");
			}
		}
		setIsCheckingUpdates(false);
	};

	const update = async () => {
		if (
			isUpdating ||
			plugin.updateStatus == LoadedPluginUpdateStatus.updating
		) {
			return;
		}
		setIsUpdating(true);
		const name = t(`plugin.${plugin.name}.name`, plugin.name);

		const notificationId = createNotification(`Updating ${name}`, {
			timeout: null,
			isLoading: true,
		});

		const [status, data, response] = await safeFetch(updatePlugin, plugin.name);

		resetNotificationTimeout(notificationId);
		setIsUpdating(false);

		if (status == 200) {
			updateNotification(notificationId, {
				message: `Updated ${name}. Restart server for changes to take effect`,
				isLoading: false,
			});
			queryClient.setQueryData(getGetInstalledPluginsQueryKey(), response);
		} else {
			if (data?.message) {
				updateNotification(notificationId, {
					message: `Failed to update ${name}: ${data.message}`,
					isLoading: false,
				});
			} else {
				updateNotification(notificationId, {
					message: `Failed to update ${name}`,
					isLoading: false,
				});
			}
		}
	};

	const updateButton = (() => {
		if (
			isUpdating ||
			plugin.updateStatus == LoadedPluginUpdateStatus.updating
		) {
			return (
				<IconButton icon={IconCloudDownload} iconSource="tabler" loading />
			);
		}

		switch (plugin.updateStatus) {
			case LoadedPluginUpdateStatus.has_update:
				return (
					<IconButton
						icon={IconCloudDownload}
						style="background"
						iconSource="tabler"
						onClick={update}
					/>
				);
			case LoadedPluginUpdateStatus.not_checked:
			case LoadedPluginUpdateStatus.up_to_date: {
				const upToDate =
					plugin.updateStatus == LoadedPluginUpdateStatus.up_to_date;
				return (
					<IconButton
						icon={upToDate ? IconCircleCheck : IconCloudQuestion}
						iconSource="tabler"
						loading={isCheckingUpdates}
						onClick={checkForUpdates}
					/>
				);
			}

			case LoadedPluginUpdateStatus.unsupported:
				return (
					<IconButton icon={IconRefreshOff} iconSource="tabler" disabled />
				);
		}
	})();

	return (
		<>
			<div className={styles.container} {...onRightClick}>
				<div className={styles.info}>
					<span className={styles.id}>{plugin.name}</span>
					<div className={styles.nameContainer}>
						<span className={styles.name}>
							{t(`plugin.${plugin.name}.name`)}
						</span>
						<span className={styles.version}>{plugin.version}</span>
					</div>

					{!!plugin.description && (
						<span className={styles.description}>{plugin.description}</span>
					)}
				</div>
				<div className={styles.updateContainer}>{updateButton}</div>
			</div>
			<ConfirmPluginDeleteModal
				pluginId={plugin.name}
				open={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>
		</>
	);
}
