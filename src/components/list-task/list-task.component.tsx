"use client";

import { IconButton } from "@/components/icon-button/icon-button";
import { Task, TaskStatus } from "@api";
import {
	Icon,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
	IconPlayerStopFilled,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import styles from "./list-task.module.scss";
import { ProgressBar } from "@/components/progress-bar/progress-bar.component";
import { useTranslation } from "@/context/language.context";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTasksQueryKey, startTask } from "@api";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { ContextMenuElement } from "@/context/context-menu.context";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { formatDate, formatTime } from "@/lib/util";

interface Props {
	task: Task;
}

export function ListTask({ task }: Props) {
	const canRun = usePrivilegeCheck()("run-tasks");

	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const baseLanguageKey = useMemo(
		() =>
			task.pluginId
				? `task.plugin.${task.pluginId}.${task.taskId}`
				: `task.system.${task.taskId}`,
		[task.pluginId],
	);

	const buttonIcon = useMemo<Icon>(() => {
		if (
			task.status == TaskStatus.stopped ||
			task.status == TaskStatus.suspended
		) {
			return IconPlayerPlayFilled;
		}
		if (task.resumable) {
			return IconPlayerPauseFilled;
		}
		return IconPlayerStopFilled;
	}, [task.status, task.resumable]);

	const { onClick } = useButtonMenu(() => {
		if (!task.subTasks) {
			return [];
		}

		return task.subTasks.map((subTaskId) => {
			const entry: ContextMenuElement = {
				languageKey: `${baseLanguageKey}.subtask.${subTaskId}.name`,
				key: subTaskId,
				onClick: () => start(subTaskId),
			};
			return entry;
		});
	});

	const start = (subTask: string | null) => {
		if (isLoading) {
			return;
		}
		setIsLoading(true);
		startTask(task.uuid, {
			subTask,
		})
			.then((response) => {
				queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
			})
			.catch((e) => {
				console.error(`Error while starting task:`, e);
			})
			.finally(() => setIsLoading(false));
	};

	return (
		<div className={styles.container}>
			<IconButton
				icon={buttonIcon}
				style="background"
				iconSource="tabler"
				onClick={(e) => {
					if (!canRun) {
						return;
					}
					if (task.status == TaskStatus.running) {
						console.log("Cancelling task"); // todo: implement
					} else {
						if (task.subTasks && task.status == TaskStatus.stopped) {
							onClick(e);
						} else {
							start(null);
						}
					}
				}}
				loading={isLoading}
				disabled={!canRun || task.status == TaskStatus.running}
			/>
			<div className={styles.content}>
				<div className={styles.split}>
					<div className={styles.main}>
						<span className={styles.source}>
							{t(
								task.pluginId ? `plugin.${task.pluginId}.name` : "task.system",
							)}
						</span>
						<span className={styles.name}>{t(`${baseLanguageKey}.name`)}</span>
					</div>

					{task.lastRun && (
						<div className={styles.lastRunContainer}>
							<span>
								Last run {task.lastRun.result} in{" "}
								{formatTime(task.lastRun.duration / 1000)}
							</span>
							<span>
								Started: {formatDate(new Date(task.lastRun.dateStarted))}
							</span>
						</div>
					)}

					<span className={styles.percent}>
						{task.percent !== null &&
							`${Math.round(task.percent * 100) / 100}%`}
					</span>
				</div>

				{task.status != TaskStatus.stopped && (
					<ProgressBar percent={task.percent} loading={task.percent === null} />
				)}
			</div>
		</div>
	);
}
