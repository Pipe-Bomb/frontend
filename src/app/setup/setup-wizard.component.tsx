"use client";

import { useState, useEffect } from "react";
import styles from "./setup.module.scss";
import { TextInput } from "@/components/text-input/text-input.component";
import { Button } from "@/components/button/button.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { SystemConfigEntry } from "@/components/system-config-entry/system-config-entry.component";
import { safeFetch } from "@/lib/api.util";
import {
	addMarketplace,
	createUser,
	updateSystemConfigOptions,
	useGetSystemConfigOptions,
	UpdateSystemConfigOptionsDto,
	createWorkflow,
	addWorkflowTrigger,
	addWorkflowStep,
	updateWorkflowStepOptions,
} from "@api";
import { ProgressBar } from "@/components/progress-bar/progress-bar.component";
import { Checkbox } from "@/components/checkbox/checkbox.component";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<Step, string> = {
	1: "Welcome",
	2: "Admin account",
	3: "Plugin marketplaces",
	4: "User registrations",
	5: "First workflow",
	6: "Done",
};

export function SetupWizard() {
	const [step, setStep] = useState<Step>(1);
	const [hasMarketplaces, setHasMarketplaces] = useState(false);

	const next = () => setStep((s) => (s < 6 ? ((s + 1) as Step) : s));

	return (
		<div className={styles.wizard}>
			<div className={styles.card}>
				<div className={styles.header}>
					<span className={styles.stepLabel}>
						Step {step} of {Object.keys(STEP_LABELS).length} —{" "}
						{STEP_LABELS[step]}
					</span>
				</div>
				{step === 1 && <StepWelcome onNext={next} />}
				{step === 2 && <StepCreateAccount onNext={next} />}
				{step === 3 && (
					<StepMarketplaces
						onNext={(hasMarketplaces) => {
							setHasMarketplaces(hasMarketplaces);
							next();
						}}
					/>
				)}
				{step === 4 && <StepRegistrations onNext={next} />}
				{step === 5 && <StepWorkflow onNext={next} />}
				{step === 6 && <StepDone hasMarketplaces={hasMarketplaces} />}
			</div>
		</div>
	);
}

function StepWelcome({ onNext }: { onNext: () => void }) {
	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>Welcome to Pipe Bomb</h2>
				<p className={styles.description}>
					This wizard will help you create your admin account and configure user
					registration settings.
				</p>
			</div>
			<div className={styles.actions}>
				<Button onClick={onNext}>Get started</Button>
			</div>
		</>
	);
}

function StepCreateAccount({ onNext }: { onNext: () => void }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async () => {
		if (!username.trim() || !password || isLoading) {
			return;
		}
		setIsLoading(true);
		setError(null);

		const [status] = await safeFetch(createUser, { username, password });
		setIsLoading(false);

		if (status === 201) {
			onNext();
			return;
		}

		if (status === 409) {
			setError("That username is already taken.");
		} else if (status === 403) {
			setError("Registrations are currently disabled.");
		} else {
			setError("Something went wrong. Please try again.");
		}
	};

	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>Create your admin account</h2>
				<p className={styles.description}>
					The first account you create will have full admin access to Pipe Bomb.
				</p>
				<TextInput
					value={username}
					onChange={(v) => {
						if (!isLoading) {
							setUsername(v);
						}
					}}
					placeholder="Username"
					onEnter={submit}
					autoFocus
				/>
				<TextInput
					value={password}
					onChange={(v) => {
						if (!isLoading) {
							setPassword(v);
						}
					}}
					placeholder="Password"
					onEnter={submit}
					password
				/>
				{error && <span className={styles.error}>{error}</span>}
			</div>
			<div className={styles.actions}>
				<Button onClick={submit} loading={isLoading}>
					Create account
				</Button>
			</div>
		</>
	);
}

const OFFICIAL_MARKETPLACE_URL =
	"https://raw.githubusercontent.com/Pipe-Bomb/marketplace/refs/heads/master/marketplace.json";
const COMMUNITY_MARKETPLACE_URL =
	"https://raw.githubusercontent.com/Pipe-Bomb-Community/community-marketplace/refs/heads/master/marketplace.json";

function StepMarketplaces({
	onNext,
}: {
	onNext: (hasMarketplaces: boolean) => void;
}) {
	const [official, setOfficial] = useState(true);
	const [community, setCommunity] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSaveAndNext = async () => {
		if (isLoading) {
			return;
		}
		setIsLoading(true);
		const selected = [
			official && OFFICIAL_MARKETPLACE_URL,
			community && COMMUNITY_MARKETPLACE_URL,
		].filter(Boolean) as string[];
		await Promise.all(
			selected.map((url) => safeFetch(addMarketplace, { url })),
		);
		setIsLoading(false);
		onNext(!!selected.length);
	};

	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>Plugin marketplaces</h2>
				<p className={styles.description}>
					Choose which plugin marketplaces to enable. You can add or remove
					marketplaces later.
				</p>
				<label className={styles.marketplaceOption}>
					<Checkbox
						checked={official}
						onChange={setOfficial}
						disabled={isLoading}
					/>
					<span>Official marketplace</span>
				</label>
				<label className={styles.marketplaceOption}>
					<Checkbox
						checked={community}
						onChange={setCommunity}
						disabled={isLoading}
					/>
					<span>Community marketplace</span>
				</label>
			</div>
			<div className={styles.actions}>
				<Button onClick={handleSaveAndNext} loading={isLoading}>
					Save and continue
				</Button>
			</div>
		</>
	);
}

const REGISTRATION_KEYS = ["allow-user-registrations"];

function StepRegistrations({ onNext }: { onNext: () => void }) {
	const { mutate, data } = useGetSystemConfigOptions();
	const [currentValues, setCurrentValues] = useState<
		Record<string, UpdateSystemConfigOptionsDto["options"][0]>
	>({});
	const [isSaving, setIsSaving] = useState(false);

	const serverOptions = data?.status === 200 ? data.data.options : null;

	useEffect(() => {
		mutate({ data: { keys: REGISTRATION_KEYS } });
	}, [mutate]);

	useEffect(() => {
		if (serverOptions) {
			const map: Record<string, UpdateSystemConfigOptionsDto["options"][0]> =
				{};
			for (const option of serverOptions) {
				map[option.key] = {
					key: option.key,
					type: option.type,
					values: option.values as any,
				};
			}
			setCurrentValues(map);
		}
	}, [serverOptions]);

	const handleSaveAndNext = async () => {
		if (isSaving) {
			return;
		}
		setIsSaving(true);
		await safeFetch(updateSystemConfigOptions, {
			options: Object.values(currentValues),
		});
		setIsSaving(false);
		onNext();
	};

	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>User registrations</h2>
				<p className={styles.description}>
					Control whether new users can create accounts. You can change this
					later in Settings → System.
				</p>
				{serverOptions === null ? (
					<Spinner position="normal" />
				) : (
					serverOptions.map((option) => {
						const values = currentValues[option.key];
						if (!values) {
							return null;
						}
						return (
							<SystemConfigEntry
								key={option.key}
								option={option}
								values={values.values}
								setValues={(newValues) => {
									if (!isSaving) {
										setCurrentValues((prev) => ({
											...prev,
											[option.key]: {
												key: option.key,
												type: option.type,
												values: newValues as any,
											},
										}));
									}
								}}
							/>
						);
					})
				)}
			</div>
			<div className={styles.actions}>
				<Button onClick={handleSaveAndNext} loading={isSaving}>
					Save and continue
				</Button>
			</div>
		</>
	);
}

const WORKFLOW_TASKS = [
	":cache-all-libraries:",
	":identify-tracks:new",
	":attribute-tracks:new",
	":identify-albums:new",
	":attribute-albums:new",
	":identify-artists:new",
	":attribute-artists:new",
] as const;

// 1 createWorkflow + 1 addWorkflowTrigger + (addWorkflowStep + updateWorkflowStepOptions) per task
const WORKFLOW_TOTAL_STEPS = 2 + WORKFLOW_TASKS.length * 2;

function StepWorkflow({ onNext }: { onNext: () => void }) {
	const [enabled, setEnabled] = useState(true);
	const [progress, setProgress] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const isCreating = progress !== null;

	const handleContinue = async () => {
		if (isCreating) {
			return;
		}

		if (!enabled) {
			onNext();
			return;
		}

		setError(null);
		setProgress(0);
		let completed = 0;

		const tick = () => {
			completed++;
			setProgress(Math.round((completed / WORKFLOW_TOTAL_STEPS) * 100));
		};

		try {
			const [createStatus, workflow] = await safeFetch(createWorkflow, {
				name: "Cache & induct new tracks",
			});
			if (createStatus !== 200 || !workflow) {
				throw new Error();
			}
			tick();

			const workflowUuid = workflow.uuid;

			const [triggerStatus] = await safeFetch(
				addWorkflowTrigger,
				workflowUuid,
				{
					pluginId: null,
					stepId: "new-tracks",
				},
			);
			if (triggerStatus !== 200) {
				throw new Error();
			}
			tick();

			for (const taskId of WORKFLOW_TASKS) {
				const [stepStatus, stepWorkflow] = await safeFetch(
					addWorkflowStep,
					workflowUuid,
					{ pluginId: null, stepId: "run-task" },
				);
				if (stepStatus !== 200 || !stepWorkflow) {
					throw new Error();
				}
				tick();

				const steps = stepWorkflow.steps ?? [];
				const newStep = steps[steps.length - 1];

				const [status, data] = await safeFetch(
					updateWorkflowStepOptions,
					workflowUuid,
					newStep.uuid,
					{
						options: [
							{
								id: "taskId",
								type: "enum",
								value: taskId,
							},
						],
					},
				);

				tick();
			}

			onNext();
		} catch {
			setError("Something went wrong. Please try again.");
			setProgress(null);
		}
	};

	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>First workflow</h2>
				<p className={styles.description}>
					Create a workflow that automatically caches, identifies, and
					attributes new tracks when they're added to your library.
				</p>
				<label className={styles.marketplaceOption}>
					<Checkbox
						checked={enabled}
						onChange={setEnabled}
						disabled={isCreating}
					/>
					<span>Create first workflow</span>
				</label>
				{isCreating && <ProgressBar percent={progress} />}
				{error && <span className={styles.error}>{error}</span>}
			</div>
			<div className={styles.actions}>
				<Button onClick={handleContinue} loading={isCreating}>
					Continue
				</Button>
			</div>
		</>
	);
}

function StepDone({ hasMarketplaces }: { hasMarketplaces: boolean }) {
	return (
		<>
			<div className={styles.body}>
				<h2 className={styles.title}>You&apos;re all set!</h2>
				<p className={styles.description}>
					Pipe Bomb is ready to use. Head to the home page to start listening.
				</p>
			</div>
			<div className={styles.actions}>
				<Button
					onClick={() => {
						if (hasMarketplaces) {
							window.location.href = "/settings/system/plugin-marketplace";
						} else {
							window.location.href = "/";
						}
					}}
				>
					Go to Pipe Bomb
				</Button>
			</div>
		</>
	);
}
