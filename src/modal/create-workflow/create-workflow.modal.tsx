"use client";

import { Modal } from "@/components/modal/modal.component";
import { createWorkflow, getGetAllWorkflowsQueryKey, Workflow } from "@api";
import { useState } from "react";
import styles from "./create-workflow.module.scss";
import { TextInput } from "@/components/text-input/text-input.component";
import { Button } from "@/components/button/button.component";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface Props extends SharedProps {
	open: boolean;
	onClose?: () => void;
}

export function CreateWorkflowModal({ open, onClose, onCreate }: Props) {
	const [isCreating, setIsCreating] = useState(false);

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isCreating) {
					onClose?.();
				}
			}}
			title="Create Workflow"
		>
			<Inner
				onCreate={(workflow) => {
					onClose?.();
					onCreate?.(workflow);
				}}
				isCreating={isCreating}
				setIsCreating={setIsCreating}
			/>
		</Modal>
	);
}

interface SharedProps {
	onCreate?: (workflow: Workflow) => void;
}

interface InnerProps extends SharedProps {
	isCreating: boolean;
	setIsCreating: (isCreating: boolean) => void;
}

function Inner({ onCreate, isCreating, setIsCreating }: InnerProps) {
	const [name, setName] = useState("");
	const router = useRouter();
	const queryClient = useQueryClient();

	const create = () => {
		if (isCreating || !name.trim()) {
			return;
		}

		setIsCreating(true);
		createWorkflow({
			name,
		})
			.then((response) => {
				if (response.status == 200) {
					const workflow = response.data;
					router.push(`/settings/workflows/${workflow.uuid}`);
					queryClient.invalidateQueries({
						queryKey: getGetAllWorkflowsQueryKey(),
					});
					onCreate?.(workflow);
				}
			})
			.catch(console.error)
			.finally(() => setIsCreating(false));
	};

	return (
		<div className={styles.container}>
			<TextInput
				value={name}
				onChange={setName}
				placeholder="Workflow Name"
				autoFocus
				onEnter={create}
				disabled={isCreating}
			/>
			<Button onClick={create} loading={isCreating}>
				Create
			</Button>
		</div>
	);
}
