import { ConfigNode } from "@/components/config-node/config-node.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { PluginConfigUpdateDtoValues } from "@api";
import { PluginConfig } from "@api";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./root.config-node.module.scss";

interface Props {
	config: PluginConfig;
	pluginId: string;
	userConfigId: string | null;
	onSave: (values: PluginConfigUpdateDtoValues) => void;
	canEdit?: boolean;
	onChange: (config: PluginConfig) => void;
}

export function RootConfigNode({
	config,
	onSave,
	canEdit,
	pluginId,
	userConfigId,
	onChange,
}: Props) {
	const [actionKey, setActionKey] = useState<{} | null>();

	const defaultValues = useMemo(() => {
		const values: Record<string, any> = {};
		const evaluate = (node: PluginConfig["node"]) => {
			if (node.type == "section") {
				for (const child of node.children) {
					evaluate(child);
				}
			}
			if (node.type == "text") {
				values[node.id] = node.value;
			}
		};
		evaluate(config.node);
		return values;
	}, [config]);

	const [values, setValues] = useState<Record<string, any>>({});
	const hasChanges = useMemo(() => {
		for (const [key, value] of Object.entries(defaultValues)) {
			if (key in values) {
				if (value !== values[key]) {
					return true;
				}
			}
		}
		return false;
	}, [defaultValues, values]);

	useEffect(() => {
		setValues(defaultValues);
	}, [defaultValues]);

	return (
		<div>
			<ConfigNode
				node={config.node}
				pluginId={pluginId}
				userConfigId={userConfigId}
				onChange={(id, value) =>
					setValues((values) => ({ ...values, [id]: value }))
				}
				disabled={!canEdit || !!actionKey}
				onAction={() => {
					const actionKey = {};
					setActionKey(actionKey);

					return (config) => {
						setActionKey((current) => {
							if (current === actionKey) {
								return null;
							}
							return current;
						});
						if (config) {
							onChange(config);
						}
					};
				}}
			/>
			{canEdit && (
				<div className={styles.saveContainer}>
					<IconButton
						icon={IconDeviceFloppy}
						iconSource="tabler"
						style={hasChanges ? "background" : "simple"}
						onClick={() => onSave(values)}
					/>
				</div>
			)}
		</div>
	);
}
