"use client";

import { ReactNode } from "react";
import styles from "../layout.module.scss";
import { useGetAllPluginConfigs } from "@api";
import { useTranslation } from "@/context/language.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { SystemSidebarLink } from "@/components/system-sidebar-link/system-sidebar-link.component";
import Link from "next/link";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconArrowLeft } from "@tabler/icons-react";

interface Props {
	children: ReactNode;
}

export default function Layout({ children }: Props) {
	const hasPrivilege = usePrivilegeCheck();
	const pluginConfigsResponse = useGetAllPluginConfigs({
		query: {
			enabled: hasPrivilege("view-plugin-configs"),
			refetchInterval: 3000,
		},
	});

	const { t } = useTranslation();

	const pluginConfigs =
		pluginConfigsResponse.data?.status == 200 &&
		pluginConfigsResponse.data?.data;

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
					<span className={styles.headingText}>Server Settings</span>
				</div>
				<div className={styles.tabs}>
					<SystemSidebarLink href="/settings/system" exactUrl>
						System
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/users"
						privilege="view-privileges"
					>
						Users
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/installed-plugins"
						privilege="view-plugins"
					>
						Installed Plugins
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/plugin-marketplace"
						privilege="view-plugin-marketplaces"
					>
						Plugin Marketplace
					</SystemSidebarLink>

					<SystemSidebarLink href="/settings/system/libraries">
						Libraries
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/attribute-sources"
						privilege="edit-attribute-source-order"
					>
						Attribute Sources
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/search"
						privilege="view-search-sources"
					>
						Search
					</SystemSidebarLink>

					<SystemSidebarLink href="/settings/system/identifiers">
						Identifiers
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/system/tasks"
						privilege="view-tasks"
					>
						Tasks
					</SystemSidebarLink>

					<SystemSidebarLink
						href="/settings/workflows"
						privilege="view-workflows"
					>
						Workflows
					</SystemSidebarLink>
				</div>
				{hasPrivilege("view-plugin-configs") && (
					<>
						<span className={styles.sectionName}>Plugin Configuration</span>
						<div className={styles.tabs}>
							{pluginConfigs ? (
								pluginConfigs.configs.map((config) => (
									<SystemSidebarLink
										href={`/settings/system/plugin/${config.id}`}
										key={config.id}
									>
										{t(`plugin.${config.id}.name`)}
									</SystemSidebarLink>
								))
							) : (
								<div className={styles.sidebarSpinner}>
									<Spinner />
								</div>
							)}
						</div>
					</>
				)}
			</div>
			<div className={styles.content}>{children}</div>
		</div>
	);
}
