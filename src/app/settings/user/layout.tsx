"use client";

import { ReactNode, useMemo } from "react";
import styles from "../layout.module.scss";
import Link from "next/link";
import { useGetAllUserConfigs, UserConfigStub } from "@api";
import { useTranslation } from "@/context/language.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { SystemSidebarLink } from "@/components/system-sidebar-link/system-sidebar-link.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconArrowLeft } from "@tabler/icons-react";

interface Props {
	children: ReactNode;
}

export default function Layout({ children }: Props) {
	const pluginConfigsResponse = useGetAllUserConfigs({
		query: {
			enabled: true,
			refetchInterval: 3000,
		},
	});

	const pluginConfigSections = useMemo(() => {
		if (pluginConfigsResponse.data?.status != 200) {
			return {};
		}

		const map: Record<string, UserConfigStub[]> = {};

		for (const config of pluginConfigsResponse.data.data.configs) {
			if (config.pluginId in map) {
				map[config.pluginId].push(config);
			} else {
				map[config.pluginId] = [config];
			}
		}

		return map;
	}, [pluginConfigsResponse.data?.data]);

	const { t } = useTranslation();

	return (
		<div className={styles.container}>
			<div className={styles.sideBar}>
				<div className={styles.heading}>
					<Link href="/">
						<IconButton
							icon={IconArrowLeft}
							iconSource="tabler"
							style="ghost"
							iconClassName={styles.backArrow}
						/>
					</Link>
					<span className={styles.headingText}>User Settings</span>
				</div>
				{Object.entries(pluginConfigSections).map(([pluginId, configs]) => (
					<div key={pluginId}>
						<span className={styles.sectionName}>
							{t(`plugin.${pluginId}.name`)}
						</span>
						<div className={styles.tabs}>
							{configs.map((config) => (
								<SystemSidebarLink
									href={`/settings/user/${config.pluginId}/${config.configId}`}
									key={config.configId}
								>
									{t(
										`plugin.${config.pluginId}.user-config.${config.configId}.name`,
									)}
								</SystemSidebarLink>
							))}
						</div>
					</div>
				))}
			</div>
			<div className={styles.content}>{children}</div>
		</div>
	);
}
