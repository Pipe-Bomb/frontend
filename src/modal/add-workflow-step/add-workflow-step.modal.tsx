"use client";

import { Modal } from "@/components/modal/modal.component";
import {
	addWorkflowStep,
	getGetWorkflowQueryKey,
	useGetAllWorkflowSteps,
	Workflow,
	WorkflowStepDefinition,
} from "@api";
import { useState } from "react";
import styles from "./add-workflow-step.module.scss";
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

export function AddWorkflowStepModal({ open, onClose, workflow }: Props) {
	const [isCreating, setIsCreating] = useState<string | null>(null);

	return (
		<Modal
			open={open}
			onClose={() => {
				if (!isCreating) {
					onClose?.();
				}
			}}
			title="Add Workflow Step"
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
	const { data } = useGetAllWorkflowSteps();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { createNotification } = useNotificationStore();

	if (!data) {
		return <Spinner position="expand" />;
	}

	if (data.status != 200) {
		return <h1>Error</h1>;
	}

	const addStep = (trigger: WorkflowStepDefinition) => {
		if (isCreating) {
			return;
		}
		setIsCreating(`${trigger.pluginId ?? ""}:${trigger.stepId}`);

		safeFetch(addWorkflowStep, workflow.uuid, {
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
			} else {
				createNotification("Failed to add step to workflow");
			}
		});
	};

	return (
		<div className={styles.container}>
			{data.data.map((step) => (
				<span
					className={styles.step}
					key={`${step.pluginId ?? ""}:${step.stepId}`}
				>
					<IconButton
						icon={IconPlus}
						iconSource="tabler"
						style="background"
						disabled={
							!!isCreating &&
							isCreating != `${step.pluginId ?? ""}:${step.stepId}`
						}
						loading={isCreating == `${step.pluginId ?? ""}:${step.stepId}`}
						onClick={() => addStep(step)}
					/>
					<div className={styles.triggerInfo}>
						<span className={styles.triggerPlugin}>
							{t(
								step.pluginId
									? `plugin.${step.pluginId}.name`
									: "workflow.system",
							)}
						</span>
						<span className={styles.triggerName}>
							{t(
								step.pluginId
									? `workflow.plugin.${step.pluginId}.step.${step.stepId}.name`
									: `workflow.system.step.${step.stepId}.name`,
							)}
						</span>
					</div>
				</span>
			))}
		</div>
	);
}
