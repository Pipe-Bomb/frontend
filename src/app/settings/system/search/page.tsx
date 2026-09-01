"use client";

import Loading from "@/app/loading";
import { List } from "@/components/list/list.component";
import {
	SearchSourceSummary,
	clearActiveSearchSource,
	setActiveSearchSource,
	useGetSearchSources,
} from "@api";
import { useState } from "react";
import styles from "./page.module.scss";
import { Checkbox } from "@/components/checkbox/checkbox.component";
import { useTranslation } from "@/context/language.context";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { useNotificationStore } from "@/store/notification.store";

export default function Page() {
	const { data, refetch } = useGetSearchSources({ query: { enabled: true } });
	const [isSaving, setIsSaving] = useState(false);
	const { t } = useTranslation();
	const canChange = usePrivilegeCheck()("select-search-source");
	const { createNotification } = useNotificationStore();

	if (!data || data.status !== 200) {
		return <Loading />;
	}

	const sources = data.data;

	function activate(source: SearchSourceSummary) {
		if (isSaving || canChange) {
			return;
		}

		setIsSaving(true);
		if (source.active) {
			clearActiveSearchSource()
				.then(() => refetch())
				.catch(() =>
					createNotification("Failed to remove active search source"),
				)
				.finally(() => setIsSaving(false));
		} else {
			setActiveSearchSource({
				pluginId: source.pluginId,
				sourceId: source.sourceId,
			})
				.then(() => refetch())
				.catch(() => createNotification("Failed to set active search source"))
				.finally(() => setIsSaving(false));
		}
	}

	return (
		<div>
			<List>
				{sources.map((source) => {
					const key = `${source.pluginId}:${source.sourceId}`;
					return (
						<div key={key} className={styles.sourceItem}>
							<Checkbox
								checked={source.active}
								disabled={isSaving || !canChange}
								onChange={() => activate(source)}
							/>
							<div className={styles.info}>
								<span className={styles.plugin}>
									{t(`plugin.${source.pluginId}.name`)}
								</span>
								<span className={styles.name}>{source.name}</span>
							</div>
						</div>
					);
				})}
			</List>
		</div>
	);
}
