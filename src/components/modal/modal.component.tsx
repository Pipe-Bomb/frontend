"use client";

import { useEffect, useId, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cc } from "@/lib/util";
import styles from "./modal.module.scss";
import { useModals } from "@/context/modal.context";
import { useIsMounted } from "@/hook/mounted.hook";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconArrowLeft, IconX } from "@tabler/icons-react";
import { useTranslation } from "@/context/language.context";

type Props = {
	children?: React.ReactNode;
	open?: boolean;
	onClose?: (method: "button" | "background" | "escape") => void;
	onBack?: (() => void) | null;
	className?: string;
} & (
	| {
			titleKey: string;
	  }
	| {
			title: string;
	  }
);

export function Modal({
	children,
	open,
	onClose,
	onBack,
	className,
	...props
}: Props) {
	const { register, unregister } = useModals();
	const id = useId();
	const isMounted = useIsMounted();
	const [shouldRender, setShouldRender] = useState(open);
	const closeRef = useRef(onClose);
	const { t } = useTranslation();

	closeRef.current = onClose;

	useEffect(() => {
		if (open) {
			setShouldRender(true);
			register(id, () => closeRef.current?.("background"));
			return () => unregister(id);
		} else {
			const timer = setTimeout(() => setShouldRender(false), 200);
			return () => clearTimeout(timer);
		}
	}, [open, id]);

	if (!isMounted || !shouldRender) {
		return null;
	}

	return createPortal(
		<div className={cc(styles.container, className, !open && styles.closing)}>
			{onBack && (
				<span className={styles.back}>
					<IconButton
						icon={IconArrowLeft}
						iconSource="tabler"
						iconClassName={styles.backIcon}
						style="ghost"
						onClick={onBack}
					/>
				</span>
			)}
			<span className={styles.close}>
				<IconButton
					icon={IconX}
					iconSource="tabler"
					iconClassName={styles.closeIcon}
					style="ghost"
					onClick={() => closeRef.current?.("button")}
				/>
			</span>

			{"title" in props ? (
				<span className={styles.heading}>{props.title}</span>
			) : (
				"titleKey" in props && (
					<span className={styles.heading}>{t(props.titleKey)}</span>
				)
			)}

			<div className={styles.children}>{children}</div>
		</div>,
		document.body,
	);
}
