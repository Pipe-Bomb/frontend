import { useTranslation } from "@/context/language.context";
import styles from "./list-plugin.module.scss";
import { useRightClick } from "@/hook/right-click.hook";
import { ConfirmPluginDeleteModal } from "@/modal/confirm-plugin-delete/confirm-plugin-delete.modal";
import { useState } from "react";

interface Props {
	id: string;
	version: string;
	description?: string | null;
}

export function ListPlugin({ id, version, description }: Props) {
	const { t } = useTranslation();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const onRightClick = useRightClick(() => [
		{
			key: "delete",
			languageKey: "contextmenu.plugin.delete",
			onClick: () => setIsDeleteModalOpen(true),
		},
	]);

	return (
		<>
			<div className={styles.container} {...onRightClick}>
				<span className={styles.id}>{id}</span>
				<div className={styles.nameContainer}>
					<span className={styles.name}>{t(`plugin.${id}.name`)}</span>
					<span className={styles.version}>{version}</span>
				</div>

				{!!description && (
					<span className={styles.description}>{description}</span>
				)}
			</div>
			<ConfirmPluginDeleteModal
				pluginId={id}
				open={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>
		</>
	);
}
