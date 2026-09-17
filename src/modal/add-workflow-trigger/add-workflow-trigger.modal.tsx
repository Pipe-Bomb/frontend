"use client";

import { Modal } from "@/components/modal/modal.component";
import {
	addWorkflowTrigger,
	getGetWorkflowQueryKey,
	useGetAllWorkflowTriggers,
	Workflow,
	WorkflowStepDefinition,
} from "@api";
import { useState } from "react";
import styles from "./add-workflow-trigger.module.scss";
import { Spinner } from "@/components/spinner/spinner.component";
import { useTranslation } from "@/context/language.context";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconPlus } from "@tabler/icons-react";
import { safeFetch } from "@/lib/api.util";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notification.store";

interface Props extends SharedProps {
	open: boolean;
}

export function AddWorkflowTriggerModal({ open, onClose, workflow }: Props) {
	const [isCreating, setIsCreating] = useState<string | null>(null);

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isCreating) {
					onClose?.();
				}
			}}
			title="Add Workflow Trigger"
		>
			<Inner
				isCreating={isCreating}
				setIsCreating={setIsCreating}
				workflow={workflow}
				onClose={onClose}
			/>
		</Modal>
	);
}

interface SharedProps {
	workflow: Workflow;
	onClose?: () => void;
}

interface InnerProps extends SharedProps {
	isCreating: string | null;
	setIsCreating: (isCreating: string | null) => void;
}

function Inner({ isCreating, setIsCreating, workflow, onClose }: InnerProps) {
	const { data } = useGetAllWorkflowTriggers();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { createNotification } = useNotificationStore();

	if (!data) {
		return <Spinner position="expand" />;
	}

	if (data.status != 200) {
		return <h1>Error</h1>;
	}

	const addTrigger = (trigger: WorkflowStepDefinition) => {
		if (isCreating) {
			return;
		}
		setIsCreating(`${trigger.pluginId ?? ""}:${trigger.stepId}`);

		safeFetch(addWorkflowTrigger, workflow.uuid, {
			pluginId: trigger.pluginId,
			stepId: trigger.stepId,
		}).then(([status, _data, response]) => {
			setIsCreating(null);

			if (status == 200) {
				queryClient.setQueryData(
					getGetWorkflowQueryKey(workflow.uuid),
					response,
				);
				onClose?.();
			} else if (status == 409) {
				createNotification("Workflow already has a trigger");
			} else {
				createNotification("Failed to add trigger to workflow");
			}
		});
	};

	return (
		<div className={styles.container}>
			{data.data.map((trigger) => (
				<span
					className={styles.trigger}
					key={`${trigger.pluginId ?? ""}:${trigger.stepId}`}
				>
					<IconButton
						icon={IconPlus}
						iconSource="tabler"
						style="background"
						disabled={
							!!isCreating &&
							isCreating != `${trigger.pluginId ?? ""}:${trigger.stepId}`
						}
						loading={
							isCreating == `${trigger.pluginId ?? ""}:${trigger.stepId}`
						}
						onClick={() => addTrigger(trigger)}
					/>
					<div className={styles.triggerInfo}>
						<span className={styles.triggerPlugin}>
							{t(
								trigger.pluginId
									? `plugin.${trigger.pluginId}.name`
									: "workflow.system",
							)}
						</span>
						<span className={styles.triggerName}>
							{t(
								trigger.pluginId
									? `workflow.plugin.${trigger.pluginId}.step.${trigger.stepId}.name`
									: `workflow.system.step.${trigger.stepId}.name`,
							)}
						</span>
					</div>
				</span>
			))}
		</div>
	);
}
