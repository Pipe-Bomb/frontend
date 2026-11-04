import { PluginConfig, SectionConfigNode as SectionConfigNodeType } from "@api";
import styles from "./section.config-node.module.scss";
import { ConfigNode } from "@/components/config-node/config-node.component";
import { cc } from "@/lib/util";

interface Props {
	node: SectionConfigNodeType;
	pluginId: string;
	userConfigId: string | null;
	onChange: (id: string, value: any) => void;
	disabled?: boolean;
	onAction: () => (config: PluginConfig | null) => void;
}

export function SectionConfigNode({
	node,
	pluginId,
	userConfigId,
	onChange,
	disabled,
	onAction,
}: Props) {
	return (
		<div
			className={cc(
				styles.container,
				styles[`background-${node.background}`],
				node.horizontal && styles.horizontal,
			)}
		>
			{node.children.map((child, index) => (
				<ConfigNode
					node={child}
					key={index}
					pluginId={pluginId}
					userConfigId={userConfigId}
					onChange={onChange}
					disabled={disabled}
					onAction={onAction}
				/>
			))}
		</div>
	);
}
