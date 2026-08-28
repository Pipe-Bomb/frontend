"use client";

import { useListMarketplaces } from "@/api";
import { List } from "@/components/list/list.component";
import { useState } from "react";
import styles from "./page.module.scss";
import { AddMarketplaceModal } from "@/modal/add-marketplace/add-marketplace.modal";
import { ListMarketplace } from "@/components/list-marketplace/list-marketplace.component";
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

	if (!data || data.status != 200) {
		return <Loading />;
	}

	const marketplaces = data.data;

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
			<AddMarketplaceModal
				open={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>
		</div>
	);
}
