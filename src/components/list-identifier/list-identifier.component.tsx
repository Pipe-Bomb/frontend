import { Identifier, IdentifierDependency } from "@api";
import styles from "./list-identifier.module.scss";
import { useTranslation } from "@/context/language.context";
import { Checkbox } from "@/components/checkbox/checkbox.component";
import {
	IconArrowNarrowRight,
	IconDisc,
	IconMusic,
	IconUser,
} from "@tabler/icons-react";

interface Props {
	identifier: Identifier;
	onEnableChange: (enabled: boolean) => void;
	disabled: boolean;
	preventChanges: boolean;
}

const TYPE_ICON = {
	track: IconMusic,
	artist: IconUser,
	album: IconDisc,
} as const;

export function ListIdentifier({
	identifier,
	onEnableChange,
	disabled,
	preventChanges,
}: Props) {
	const { t } = useTranslation();

	const TypeIcon = TYPE_ICON[identifier.type];
	const TargetIcon = identifier.target && TYPE_ICON[identifier.target];

	return (
		<div className={styles.container}>
			<Checkbox
				onChange={(v) => onEnableChange(!v)}
				checked={!disabled}
				disabled={preventChanges}
			/>
			<div className={styles.info}>
				<span className={styles.plugin}>
					{t(`plugin.${identifier.pluginId}.name`)}
				</span>
				<span className={styles.name}>{identifier.identifierId}</span>
				<div className={styles.iconContainer}>
					<TypeIcon />
					{!!TargetIcon && identifier.type != identifier.target && (
						<>
							<IconArrowNarrowRight />
							<TargetIcon />
						</>
					)}
				</div>
			</div>

			<div className={styles.dependenciesContainer}>
				<DependencyList deps={identifier.dependencies} title="Depends on" />
				<DependencyList
					deps={identifier.softDependencies}
					title="Soft-depends on"
				/>
			</div>
		</div>
	);
}

interface DependencyListProps {
	deps: IdentifierDependency[];
	title: string;
}

function DependencyList({ deps, title }: DependencyListProps) {
	if (!deps.length) {
		return null;
	}

	return (
		<div className={styles.dependencyCategory}>
			<span className={styles.dependencyCategoryTitle}>{title}</span>
			{deps.map((dependency, index) => (
				<div key={index} className={styles.dependency}>
					{dependency.pluginId && (
						<span className={styles.dependencyPlugin}>
							{dependency.pluginId}
						</span>
					)}
					<span>{dependency.sourceId}</span>
				</div>
			))}
		</div>
	);
}
