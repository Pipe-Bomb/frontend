import {
	getListMarketplacePluginsQueryKey,
	getListMarketplacesQueryKey,
	Marketplace,
	removeMarketplace,
} from "@api";
import styles from "./list-marketplace.module.scss";
import Link from "next/link";
import { useRightClick } from "@/hook/right-click.hook";
import { useState } from "react";
import { useNotificationStore } from "@/store/notification.store";
import { safeFetch } from "@/lib/api.util";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
	marketplace: Marketplace;
}

export function ListMarketplace({ marketplace }: Props) {
	const [isRemoving, setIsRemoving] = useState(false);
	const { createNotification, updateNotification, resetNotificationTimeout } =
		useNotificationStore();
	const queryClient = useQueryClient();

	const rightClick = useRightClick(() => [
		{
			key: "remove",
			languageKey: "contextmenu.marketplace.delete",
			onClick: remove,
		},
	]);

	const remove = async () => {
		if (isRemoving) {
			return;
		}

		const notificationId = createNotification(`Removing marketplace`, {
			isLoading: true,
			timeout: null,
		});

		const [status, data] = await safeFetch(removeMarketplace, marketplace.uuid);

		setIsRemoving(false);

		if (status == 204) {
			updateNotification(notificationId, {
				message: `Marketplace removed successfully`,
				isLoading: false,
			});
			queryClient.invalidateQueries({
				queryKey: getListMarketplacesQueryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: getListMarketplacePluginsQueryKey(),
			});
		} else {
			if (data) {
				updateNotification(notificationId, {
					message: `Failed to remove marketplace: ${data.message}`,
					isLoading: false,
				});
			} else {
				updateNotification(notificationId, {
					message: `Failed to remove marketplace`,
					isLoading: false,
				});
			}
		}
		resetNotificationTimeout(notificationId);
	};

	return (
		<div className={styles.container} {...rightClick}>
			<Link href={marketplace.url} target="_blank" className={styles.url}>
				{marketplace.url}
			</Link>
			<span className={styles.name}>{marketplace.name}</span>
			{!marketplace.reachable && (
				<span className={styles.warning}>Marketplace is unreachable</span>
			)}
		</div>
	);
}
