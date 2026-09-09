import {
	BooleanAttribute,
	DecimalAttribute,
	IntegerAttribute,
	StringAttribute,
} from "@/api";
import { Modal } from "@/components/modal/modal.component";
import { useTranslation } from "@/context/language.context";
import { useEffect, useState } from "react";
import styles from "./single-attribute.module.scss";
import { cc } from "@/lib/util";

interface Props {
	attributeKey: string | null;
	entityType: "track" | "artist" | "album" | null;
	attribute:
		| StringAttribute
		| BooleanAttribute
		| IntegerAttribute
		| DecimalAttribute
		| null;
	onClose?: () => void;
}

export function SingleAttributeModal({
	attribute,
	attributeKey,
	entityType,
	onClose,
}: Props) {
	const [debouncedAttribute, setDebouncedAttribute] = useState<
		| [
				(
					| StringAttribute
					| BooleanAttribute
					| IntegerAttribute
					| DecimalAttribute
				),
				string,
				"track" | "artist" | "album",
		  ]
		| null
	>(null);

	useEffect(() => {
		if (attribute && attributeKey && entityType) {
			setDebouncedAttribute([attribute, attributeKey, entityType]);
		} else {
			const timeout = setTimeout(() => {
				setDebouncedAttribute(null);
			}, 500);

			return () => clearTimeout(timeout);
		}
	}, [attribute, attributeKey, entityType]);

	return (
		<Modal open={!!attribute} onClose={onClose}>
			{debouncedAttribute && (
				<Inner
					attribute={debouncedAttribute[0]}
					attributeKey={debouncedAttribute[1]}
					entityType={debouncedAttribute[2]}
				/>
			)}
		</Modal>
	);
}

interface InnerProps {
	attributeKey: string;
	entityType: "track" | "artist" | "album";
	attribute:
		| StringAttribute
		| BooleanAttribute
		| IntegerAttribute
		| DecimalAttribute;
}

function Inner({ attribute, attributeKey }: InnerProps) {
	const { t } = useTranslation();

	return (
		<div className={styles.container}>
			<span className={styles.key}>{attributeKey}</span>
			<span className={styles.name}>
				{t(
					`plugin.${attribute.pluginId}.attribute.track.${attribute.sourceId}.${attributeKey}.name`,
				)}
			</span>
			{attribute.values.map((value, index) => {
				const formatted = attribute.formatted?.[index];

				return (
					<div className={styles.valueContainer} key={index}>
						{formatted !== value ? (
							<>
								<span className={styles.formattedValue}>{formatted}</span>
								<span className={styles.rawValue}>{value}</span>
							</>
						) : (
							<>
								<span className={styles.formattedValue}>{value}</span>
							</>
						)}
					</div>
				);
			})}
			<div className={styles.infoContainer}>
				<div className={styles.infoModule}>
					<span className={styles.infoHeader}>Plugin</span>
					<span className={styles.infoValue}>
						{t(`plugin.${attribute.pluginId}.name`)}
					</span>
				</div>
				<div className={styles.infoModule}>
					<span className={styles.infoHeader}>Source</span>
					<span className={styles.infoValue}>{attribute.sourceId}</span>
				</div>
				<div className={styles.infoModule}>
					<span className={styles.infoHeader}>Type</span>
					<span className={cc(styles.infoValue, styles.infoType)}>
						{attribute.type}
					</span>
				</div>
			</div>
		</div>
	);
}
