"use client";

import { WorkspaceStepOptionEnumItem } from "@/api";
import { Button } from "@/components/button/button.component";
import { List } from "@/components/list/list.component";
import { Modal } from "@/components/modal/modal.component";
import { useTranslation } from "@/context/language.context";

interface Props extends SharedProps {
	open: boolean;
	onClose?: () => void;
}

interface SharedProps {
	options: WorkspaceStepOptionEnumItem[];
	onSelect?: (id: string) => void;
}

export function SelectWorkflowStepModal({
	options,
	onSelect,
	open,
	onClose,
}: Props) {
	return (
		<Modal open={open} onClose={onClose} title="Select Workflow Step">
			<Inner options={options} onSelect={onSelect} />
		</Modal>
	);
}

function Inner({ options, onSelect }: SharedProps) {
	const { t } = useTranslation();

	return (
		<List>
			{options.map((option) => (
				<Button
					key={option.id}
					onClick={() => onSelect?.(option.id)}
					style="secondary"
				>
					{option.languageKey
						? t(option.languageKey)
						: option.name || option.id}
				</Button>
			))}
		</List>
	);
}
