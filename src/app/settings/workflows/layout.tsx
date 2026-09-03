"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import styles from "../layout.module.scss";
import Link from "next/link";
import {
	deleteWorkflow,
	getGetAllWorkflowsQueryKey,
	useGetAllWorkflows,
	Workflow,
} from "@api";
import { Spinner } from "@/components/spinner/spinner.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { CreateWorkflowModal } from "@/modal/create-workflow/create-workflow.modal";
import { useRightClick } from "@/hook/right-click.hook";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
	WorkflowContextType,
	WorkflowProgressProvider,
} from "@/context/workflow-progress.context";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { SystemSidebarLink } from "@/components/system-sidebar-link/system-sidebar-link.component";

interface Props {
	children: ReactNode;
}

export default function Layout({ children }: Props) {
	const [createOpen, setCreateOpen] = useState(false);
	const canEditWorkflows = usePrivilegeCheck()("edit-workflows");
	useEffect(() => {
		if (!canEditWorkflows) {
			setCreateOpen(false);
		}
	}, [canEditWorkflows]);

	const workflowsResponse = useGetAllWorkflows({
		query: {
			enabled: true,
			refetchInterval: 3000,
		},
	});

	const workflows =
		workflowsResponse.data?.status == 200 && workflowsResponse.data?.data;
	const context: Record<string, WorkflowContextType> = useMemo(() => {
		if (!workflows) {
			return {};
		}

		const output: Record<string, WorkflowContextType> = {};
		for (const workflow of workflows) {
			if (
				workflow.currentActiveStepIndex !== null &&
				workflow.currentActiveStepUuid &&
				workflow.totalActiveSteps !== null
			) {
				output[workflow.uuid] = {
					stepIndex: workflow.currentActiveStepIndex,
					stepUuid: workflow.currentActiveStepUuid,
					totalSteps: workflow.totalActiveSteps,
					stepPercent: workflow.currentActiveStepPercent,
				};
			}
		}
		return output;
	}, [workflows]);

	return (
		<WorkflowProgressProvider data={context}>
			<div className={styles.container}>
				<div className={styles.sideBar}>
					<div className={styles.heading}>
						<Link href="/settings/system">
							<IconButton
								icon={IconArrowLeft}
								iconSource="tabler"
								style="ghost"
								iconClassName={styles.backArrow}
							/>
						</Link>
						<span className={styles.headingText}>Workflows</span>
					</div>

					<div className={styles.tabs}>
						{workflows ? (
							workflows.map((workflow) => (
								<WorkflowEntry workflow={workflow} key={workflow.uuid} />
							))
						) : (
							<div className={styles.sidebarSpinner}>
								<Spinner />
							</div>
						)}
					</div>
					{canEditWorkflows && (
						<IconButton
							icon={IconPlus}
							iconSource="tabler"
							onClick={() => setCreateOpen(true)}
						/>
					)}
				</div>
				<div className={styles.content}>{children}</div>
			</div>
			<CreateWorkflowModal
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</WorkflowProgressProvider>
	);
}

interface WorkflowEntryProps {
	workflow: Workflow;
}

function WorkflowEntry({ workflow }: WorkflowEntryProps) {
	const queryClient = useQueryClient();
	const pathname = usePathname();
	const router = useRouter();

	const rightClick = useRightClick(() => [
		{
			key: "delete",
			text: "Delete workflow",
			onClick: () => {
				deleteWorkflow(workflow.uuid).then((response) => {
					if (response.status == 204) {
						queryClient.invalidateQueries({
							queryKey: getGetAllWorkflowsQueryKey(),
						});
						if (pathname == `/settings/workflows/${workflow.uuid}`) {
							router.push("/settings/workflows");
						}
					}
				});
			},
		},
	]);

	return (
		<SystemSidebarLink
			href={`/settings/workflows/${workflow.uuid}`}
			{...rightClick}
		>
			{workflow.name}
		</SystemSidebarLink>
	);
}
