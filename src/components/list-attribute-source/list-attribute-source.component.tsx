import { AttributeSource } from "@api";
import styles from "./list-attribute-source.module.scss";
import { useTranslation } from "@/context/language.context";
import { Checkbox } from "@/components/checkbox/checkbox.component";

interface Props {
	source: AttributeSource;
	enabled: boolean;
	onEnable: (enabled: boolean) => void;
	disableInteraction: boolean;
}

export function ListAttributeSource({
	source,
	enabled,
	onEnable,
	disableInteraction,
}: Props) {
	const { t } = useTranslation();

	return (
		<div className={styles.container}>
			<Checkbox
				checked={enabled}
				onChange={onEnable}
				disabled={disableInteraction}
			/>
			<div className={styles.info}>
				<span className={styles.plugin}>
					{t(`plugin.${source.pluginId}.name`)}
				</span>
				<span className={styles.name}>{source.name}</span>
			</div>
		</div>
	);
}
