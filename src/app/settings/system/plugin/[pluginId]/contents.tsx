"use client";

import { RootConfigNode } from "@/components/config-node/root.config-node.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useTranslation } from "@/context/language.context";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import {
	getGetPluginConfigQueryKey,
	PluginConfigUpdateDtoValues,
	updatePluginConfig,
	useGetPluginConfig,
} from "@api";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Props {
	pluginId: string;
}

export function Contents({ pluginId }: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isSaving, setIsSaving] = useState(false);
	const canEdit = usePrivilegeCheck()("edit-plugin-configs");

	const configResponse = useGetPluginConfig(pluginId, {
		query: {
			enabled: true,
		},
	});
	const [config, setConfig] = useState(
		(configResponse.data?.status == 200 && configResponse.data.data) || null,
	);

	useEffect(() => {
		if (configResponse.data?.status == 200) {
			setConfig(configResponse.data.data);
		}
	}, [configResponse.data]);

	const save = (values: PluginConfigUpdateDtoValues) => {
		if (isSaving) {
			return;
		}
		setIsSaving(true);
		updatePluginConfig(pluginId, { values })
			.then((response) => {
				if (!response.data) {
					return;
				}
				queryClient.setQueryData(
					getGetPluginConfigQueryKey(pluginId),
					response,
				);
			})
			.catch(console.error)
			.finally(() => setIsSaving(false));
	};

	return (
		<div>
			<h1>{t(`plugin.${pluginId}.name`)}</h1>
			{configResponse.data ? (
				configResponse.data.status == 200 && config ? (
					<RootConfigNode
						pluginId={pluginId}
						userConfigId={null}
						config={config}
						onSave={save}
						canEdit={canEdit}
						onChange={setConfig}
					/>
				) : (
					<h2>Config not found</h2>
				)
			) : (
				<Spinner position="expand" />
			)}
		</div>
	);
}
