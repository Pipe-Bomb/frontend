import { PluginConfig } from "@api";
import styles from "./config-node.module.scss";
import { SectionConfigNode } from "@/components/config-node/section.config-node.component";
import { HeadingConfigNode } from "@/components/config-node/heading.config-node.component";
import { TextConfigNode } from "@/components/config-node/text.config-node.component";
import { ParagraphConfigNode } from "@/components/config-node/paragraph.config-node.component";
import { CheckboxConfigNode } from "@/components/config-node/checkbox.config-node.component";
import { IconMoodSadDizzy } from "@tabler/icons-react";
import { SearchConfigNode } from "@/components/config-node/search.config-node.component";
import { MarkdownConfigNode } from "@/components/config-node/markdown.config-node.component";
import { ButtonConfigNode } from "@/components/config-node/button.config-node.component";

interface Props {
	node: PluginConfig["node"];
	pluginId: string;
	userConfigId: string | null;
	onChange: (id: string, value: any) => void;
	disabled?: boolean;
	onAction: () => (config: PluginConfig | null) => void;
}

export function ConfigNode({
	node,
	pluginId,
	userConfigId,
	onChange,
	disabled,
	onAction,
}: Props) {
	switch (node.type) {
		case "section":
			return (
				<SectionConfigNode
					node={node}
					pluginId={pluginId}
					userConfigId={userConfigId}
					onChange={onChange}
					disabled={disabled}
					onAction={onAction}
				/>
			);
		case "heading":
			return <HeadingConfigNode node={node} />;
		case "text":
			return (
				<TextConfigNode node={node} onChange={onChange} disabled={disabled} />
			);
		case "paragraph":
			return <ParagraphConfigNode node={node} />;
		case "checkbox":
			return (
				<CheckboxConfigNode
					node={node}
					onChange={onChange}
					disabled={disabled}
				/>
			);
		case "search":
			return (
				<SearchConfigNode
					node={node}
					pluginId={pluginId}
					userConfigId={userConfigId}
					onChange={onChange}
					disabled={disabled}
					onAction={onAction}
				/>
			);
		case "markdown":
			return <MarkdownConfigNode node={node} />;
		case "button":
			return (
				<ButtonConfigNode
					node={node}
					pluginId={pluginId}
					userConfigId={userConfigId}
					disabled={disabled}
					onAction={onAction}
				/>
			);
		default:
			return (
				<div className={styles.unsupportedContainer}>
					<IconMoodSadDizzy />
					<span>Unsupported configuration feature</span>
				</div>
			);
	}
}
