"use client";

import { useListMarketplacePlugins, useListMarketplaces } from "@/api";
import { List } from "@/components/list/list.component";
import { useState } from "react";
import styles from "./page.module.scss";
import { AddMarketplaceModal } from "@/modal/add-marketplace/add-marketplace.modal";
import { ListMarketplace } from "@/components/list-marketplace/list-marketplace.component";
import { ListMarketplacePlugin } from "@/components/list-marketplace-plugin/list-marketplace-plugin.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconPlus } from "@tabler/icons-react";
import Loading from "@/app/loading";

export default function Page() {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const { data } = useListMarketplaces({
		query: {
			enabled: true,
			refetchInterval: 10_000,
		},
	});

	const { data: pluginsData } = useListMarketplacePlugins({
		query: {
			enabled: true,
			refetchInterval: 10_000,
		},
	});

	if (!data || data.status != 200) {
		return <Loading />;
	}

	const marketplaces = data.data;
	const plugins = pluginsData?.status === 200 ? pluginsData.data : [];

	return (
		<div className={styles.marketplacesSection}>
			<div className={styles.top}>
				<span className={styles.overview}>
					{marketplaces.length} marketplaces added
				</span>
				<IconButton
					icon={IconPlus}
					iconSource="tabler"
					style="background"
					onClick={() => setIsAddModalOpen(true)}
				/>
			</div>
			{marketplaces.length > 0 && (
				<List className={styles.marketplaceList}>
					{marketplaces.map((marketplace) => (
						<ListMarketplace marketplace={marketplace} key={marketplace.uuid} />
					))}
				</List>
			)}
			{plugins.length > 0 && (
				<>
					<div className={styles.sectionHeader}>
						<span className={styles.sectionTitle}>
							{plugins.length} plugin{plugins.length !== 1 ? "s" : ""} available
						</span>
					</div>
					<List className={styles.pluginList}>
						{plugins.map((plugin) => (
							<ListMarketplacePlugin plugin={plugin} key={plugin.id} />
						))}
					</List>
				</>
			)}
			<AddMarketplaceModal
				open={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>
		</div>
	);
}
