"use client";

import Loading from "@/app/loading";
import { ListPlugin } from "@/components/list-plugin/list-plugin.component";
import { List } from "@/components/list/list.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { useGetInstalledPlugins } from "@api";
import { IconCloudDownload } from "@tabler/icons-react";
import { InstallPluginModal } from "@/modal/install-plugin/install-plugin.modal";
import { useState } from "react";
import styles from "./page.module.scss";

export default function Page() {
	const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
	const { data } = useGetInstalledPlugins({
		query: {
			enabled: true,
		},
	});

	if (!data || data.status != 200) {
		return <Loading />;
	}

	const installedPlugins = data.data;

	return (
		<div>
			<div className={styles.top}>
				<span className={styles.overview}>
					{installedPlugins.length} plugins loaded
				</span>
				<IconButton
					icon={IconCloudDownload}
					iconSource="tabler"
					style="background"
					onClick={() => setIsInstallModalOpen(true)}
				/>
			</div>
			<List>
				{installedPlugins.map((plugin) => (
					<ListPlugin
						key={plugin.name}
						id={plugin.name}
						description={plugin.description}
						version={plugin.version}
					/>
				))}
			</List>
			<InstallPluginModal
				open={isInstallModalOpen}
				onClose={() => setIsInstallModalOpen(false)}
			/>
		</div>
	);
}
