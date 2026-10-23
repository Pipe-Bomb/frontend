import styles from "./icon-button.module.scss";
import {
	ComponentType,
	HTMLAttributeAnchorTarget,
	MouseEvent,
	SVGProps,
	useMemo,
} from "react";
import { cc } from "@/lib/util";
import Link from "next/link";

type ButtonStyle = "simple" | "background" | "ghost";
type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Props = {
	icon: IconComponent;
	style?: ButtonStyle;

	loading?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	iconSource: "lucide" | "tabler";
	iconClassName?: string;
	className?: string;
} & (
	| {
			onClick?: ((e: MouseEvent<HTMLElement>) => void) | null;
	  }
	| {
			href: string;
			target?: HTMLAttributeAnchorTarget;
	  }
);

const STYLE_CLASSES: Record<ButtonStyle, string> = {
	simple: "styleSimple",
	background: "styleBackground",
	ghost: "styleHost",
};

export function IconButton({
	icon,
	style,

	loading,
	variant,
	size,
	iconSource,
	disabled,
	iconClassName,
	className,
	...props
}: Props) {
	const IconComponent = icon;
	const styleClass = useMemo(
		() => styles[STYLE_CLASSES[style ?? "simple"]],
		[style],
	);
	const variantClass = useMemo(() => styles[variant ?? "primary"], [variant]);
	const sizeClass = useMemo(() => styles[size ?? "md"], [size]);

	if ("href" in props) {
		return (
			<Link
				className={cc(
					styles.button,
					styleClass,
					variantClass,
					sizeClass,
					loading && styles.loading,
					className,
				)}
				href={props.href}
				target={props.target}
				// disabled={disabled}
				onClick={(e) => e.stopPropagation()}
			>
				<IconComponent
					className={cc(styles.icon, styles[iconSource], iconClassName)}
					strokeWidth={2.5}
				/>
			</Link>
		);
	}

	return (
		<button
			className={cc(
				styles.button,
				styleClass,
				variantClass,
				sizeClass,
				loading && styles.loading,
				className,
			)}
			onClick={props.onClick ?? undefined}
			disabled={disabled}
		>
			<IconComponent
				className={cc(styles.icon, styles[iconSource], iconClassName)}
				strokeWidth={2.5}
			/>
		</button>
	);
}
