import { Button } from "@/components/button/button.component";
import { Modal } from "@/components/modal/modal.component";
import { useTranslation } from "@/context/language.context";
import { useState } from "react";
import styles from "./confirm-plugin-delete.module.scss";
import { useNotificationStore } from "@/store/notification.store";
import { safeFetch } from "@/lib/api.util";
import {
	getGetInstalledPluginsQueryKey,
	getListMarketplacePluginsQueryKey,
	removePlugin,
} from "@api";
import { useQueryClient } from "@tanstack/react-query";

interface Props extends SharedProps {
	open: boolean;
	onClose?: () => void;
}

export function ConfirmPluginDeleteModal({ open, onClose, pluginId }: Props) {
	const [isDeleting, setIsDeleting] = useState(false);

	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const uninstall = async () => {
		if (isDeleting) {
			return;
		}

		const pluginName = t(`plugin.${pluginId}.name`, pluginId);

		setIsDeleting(true);
		const notificationId = createNotification(
			`Uninstalling plugin "${pluginName}"`,
			{
				isLoading: true,
				timeout: null,
			},
		);
		onClose?.();

		const [status] = await safeFetch(removePlugin, pluginId);
		setIsDeleting(false);
		if (status == 200) {
			updateNotification(notificationId, {
				message: `Uninstalled plugin "${pluginName}"`,
				isLoading: false,
			});
			queryClient.invalidateQueries({
				queryKey: getGetInstalledPluginsQueryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: getListMarketplacePluginsQueryKey(),
			});
		} else {
			updateNotification(notificationId, {
				message: `Failed to uninstall plugin`,
				isLoading: false,
			});
		}
		resetNotificationTimeout(notificationId);
	};

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isDeleting) {
					onClose?.();
				}
			}}
		>
			<Inner pluginId={pluginId} uninstall={uninstall} />
		</Modal>
	);
}

interface InnerProps extends SharedProps {
	uninstall: () => void;
}

interface SharedProps {
	pluginId: string;
}

function Inner({ pluginId, uninstall }: InnerProps) {
	const { t } = useTranslation();

	const pluginName = t(`plugin.${pluginId}.name`);

	return (
		<div className={styles.container}>
			<span>
				Plugin <strong>{pluginName}</strong> will be removed on server restart
			</span>
			<Button style="danger" onClick={uninstall}>
				Uninstall
			</Button>
		</div>
	);
}
