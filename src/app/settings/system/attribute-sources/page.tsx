"use client";

import { IconButton } from "@/components/icon-button/icon-button";
import { ListAttributeSource } from "@/components/list-attribute-source/list-attribute-source.component";
import { SortableList } from "@/components/sortable-list/sortable-list.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { safeFetch } from "@/lib/api.util";
import { useNotificationStore } from "@/store/notification.store";
import {
	getGetAllAttributeSourcesQueryKey,
	setAttributeSourceOrder,
	useGetAllAttributeSources,
} from "@api";
import { AttributeSource } from "@api";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.scss";

export default function Page() {
	const { data: attributesResponse } = useGetAllAttributeSources({
		query: {
			enabled: true,
			// refetchInterval: 3000,
		},
	});
	const [sources, setSources] = useState<AttributeSource[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [enabledSources, setEnabledSources] = useState<AttributeSource[]>([]);
	const { createNotification } = useNotificationStore();
	const queryClient = useQueryClient();
	const needsSaving = useMemo(() => {
		if (attributesResponse?.status != 200) {
			return false;
		}
		if (attributesResponse.data.length != sources.length) {
			return false;
		}

		for (const [index, source] of attributesResponse.data.entries()) {
			if (sources[index] != source) {
				return true;
			}
			if (enabledSources.includes(source) != source.enabled) {
				return true;
			}
		}
		return false;
	}, [attributesResponse, sources, enabledSources]);

	useEffect(() => {
		if (attributesResponse?.status == 200) {
			setSources(attributesResponse.data);
			setEnabledSources(
				attributesResponse.data.filter((source) => source.enabled),
			);
		}
	}, [attributesResponse?.status, attributesResponse?.data]);

	if (!attributesResponse) {
		return <Spinner position="expand" />;
	}

	function update() {
		if (isSaving || !needsSaving) {
			return;
		}
		setIsSaving(true);

		safeFetch(setAttributeSourceOrder, {
			sources: sources
				.filter((source) => enabledSources.includes(source))
				.map((source) => ({
					pluginId: source.pluginId,
					sourceId: source.sourceId,
				})),
		}).then(([status]) => {
			if (status == 200) {
				createNotification("Updated attribute source order");
				queryClient.invalidateQueries({
					queryKey: getGetAllAttributeSourcesQueryKey(),
				});
			} else {
				createNotification("Failed to update attribute source order");
			}
			setIsSaving(false);
		});
	}

	return (
		<div>
			<div className={styles.saveContainer}>
				<IconButton
					icon={IconDeviceFloppy}
					iconSource="tabler"
					style={needsSaving ? "background" : "simple"}
					onClick={update}
					loading={isSaving}
				/>
			</div>

			<SortableList
				items={sources}
				onOrder={setSources}
				getItemKey={(s) => `${s.pluginId}-${s.sourceId}`}
				renderItem={(source) => (
					<ListAttributeSource
						source={source}
						enabled={enabledSources.includes(source)}
						onEnable={(enabled) => {
							if (enabled) {
								setEnabledSources((sources) => [...sources, source]);
							} else {
								setEnabledSources((sources) =>
									sources.filter((s) => s != source),
								);
							}
						}}
						disableInteraction={isSaving}
					/>
				)}
			/>
		</div>
	);
}
