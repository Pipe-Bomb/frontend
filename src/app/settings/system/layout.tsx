"use client";

import { ReactNode } from "react";
import styles from "../layout.module.scss";
import Link from "next/link";
import { useGetAllPluginConfigs } from "@api";
import { useTranslation } from "@/context/language.context";
import { Spinner } from "@/components/spinner/spinner.component";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";

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
				<div className={styles.tabs}>
					<Link href="/settings/system">System</Link>
					{hasPrivilege("view-privileges") && (
						<Link href="/settings/system/users">Users</Link>
					)}
					{hasPrivilege("view-plugins") && (
						<Link href="/settings/system/installed-plugins">
							Installed Plugins
						</Link>
					)}
					{hasPrivilege("view-plugin-marketplaces") && (
						<Link href="/settings/system/plugin-marketplace">
							Plugin Marketplace
						</Link>
					)}
					<Link href="/settings/system/libraries">Libraries</Link>
					{hasPrivilege("edit-attribute-source-order") && (
						<Link href="/settings/system/attribute-sources">
							Attribute Sources
						</Link>
					)}
					{hasPrivilege("view-search-sources") && (
						<Link href="/settings/system/search">Search</Link>
					)}

					<Link href="/settings/system/identifiers">Identifiers</Link>
					{hasPrivilege("view-tasks") && (
						<Link href="/settings/system/tasks">Tasks</Link>
					)}
					{hasPrivilege("view-workflows") && (
						<Link href="/settings/workflows">Workflows</Link>
					)}
				</div>
				{hasPrivilege("view-plugin-configs") && (
					<>
						<h3>Plugin Configuration</h3>
						<div className={styles.tabs}>
							{pluginConfigs ? (
								pluginConfigs.configs.map((config) => (
									<Link
										href={`/settings/system/plugin/${config.id}`}
										key={config.id}
									>
										{t(`plugin.${config.id}.name`)}
									</Link>
								))
							) : (
								<Spinner />
							)}
						</div>
					</>
				)}
			</div>
			<div className={styles.content}>{children}</div>
		</div>
	);
}
