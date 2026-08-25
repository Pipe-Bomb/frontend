"use client";

import { useState, useEffect } from "react";
import styles from "./setup.module.scss";
import { TextInput } from "@/components/text-input/text-input.component";
import { Button } from "@/components/button/button.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { SystemConfigEntry } from "@/components/system-config-entry/system-config-entry.component";
import { safeFetch } from "@/lib/api.util";
import {
	createUser,
	updateSystemConfigOptions,
	useGetSystemConfigOptions,
	UpdateSystemConfigOptionsDto,
} from "@api";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
	1: "Welcome",
	2: "Admin account",
	3: "User registrations",
	4: "Done",
};

export function SetupWizard() {
	const [step, setStep] = useState<Step>(1);

	const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));

	return (
		<div className={styles.wizard}>
			<div className={styles.card}>
				<div className={styles.header}>
					<span className={styles.stepLabel}>
						Step {step} of 4 — {STEP_LABELS[step]}
					</span>
				</div>
				{step === 1 && <StepWelcome onNext={next} />}
				{step === 2 && <StepCreateAccount onNext={next} />}
				{step === 3 && <StepRegistrations onNext={next} />}
				{step === 4 && <StepDone />}
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

function StepDone() {
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
						window.location.href = "/";
					}}
				>
					Go to Pipe Bomb
				</Button>
			</div>
		</>
	);
}
