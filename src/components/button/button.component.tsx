"use client";

import { ReactNode } from "react";
import styles from "./button.module.scss";
import { cc } from "@/lib/util";
import { useTranslation } from "@/context/language.context";
import { Spinner } from "@/components/spinner/spinner.component";

type Props = {
	style?: "primary" | "secondary" | "ghost" | "danger";
	onClick?: (() => void) | null;
	disabled?: boolean;
	loading?: boolean;
} & (
	| {
			children: ReactNode;
	  }
	| {
			t: string;
	  }
);

export function Button({ style, onClick, disabled, loading, ...props }: Props) {
	const { t } = useTranslation();

	return (
		<button
			className={cc(
				styles.button,
				styles[style ?? "primary"],
				loading && styles.loading,
			)}
			onClick={onClick ?? undefined}
			disabled={disabled}
		>
			<span className={styles.content}>
				{"children" in props ? props.children : t(props.t)}
			</span>
			{loading && <Spinner position="absolute" color="accent" size="sm" />}
		</button>
	);
}
