import {
	useCallback,
	useId,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./tooltip.module.scss";
import { OptionalLink } from "@/components/optional-link/optional-link.component";

type Side = "top" | "bottom" | "left" | "right";

interface Props extends Omit<
	React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLAnchorElement | HTMLSpanElement>,
		HTMLAnchorElement | HTMLSpanElement
	>,
	"href"
> {
	tooltipContent: ReactNode | null;
	children: ReactNode;
	side?: Side | "auto";
	offset?: number;
	className?: string;
	href?: string;
}

type Position = {
	top: number;
	left: number;
	side: Side;
};

const VIEWPORT_MARGIN = 8;

const OPPOSITE: Record<Side, Side> = {
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left",
};

const AUTO_ORDER: Side[] = ["top", "bottom", "right", "left"];

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, max));
}

function resolveSide(
	preferred: Side | "auto",
	space: Record<Side, number>,
): Side {
	if (preferred === "auto") {
		for (const candidate of AUTO_ORDER) {
			if (space[candidate] >= VIEWPORT_MARGIN) {
				return candidate;
			}
		}

		let best = AUTO_ORDER[0];
		for (const candidate of AUTO_ORDER) {
			if (space[candidate] > space[best]) {
				best = candidate;
			}
		}
		return best;
	}

	if (space[preferred] >= VIEWPORT_MARGIN) {
		return preferred;
	}

	const opposite = OPPOSITE[preferred];
	if (space[opposite] > space[preferred]) {
		return opposite;
	}
	return preferred;
}

export function Tooltip({
	tooltipContent,
	children,
	side = "top",
	offset = 8,
	className,
	href,
	...props
}: Props) {
	const id = useId();
	const anchorRef = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
	const tipRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<Position | null>(null);

	const update = useCallback(() => {
		const anchor = anchorRef.current;
		const tip = tipRef.current;
		if (!anchor || !tip) {
			return;
		}

		const a = anchor.getBoundingClientRect();
		const t = tip.getBoundingClientRect();

		// room left on each side once the tooltip and gap are accounted for
		const space: Record<Side, number> = {
			top: a.top - offset - t.height,
			bottom: window.innerHeight - a.bottom - offset - t.height,
			left: a.left - offset - t.width,
			right: window.innerWidth - a.right - offset - t.width,
		};

		const resolved = resolveSide(side, space);

		let top = 0;
		let left = 0;

		switch (resolved) {
			case "top": {
				top = a.top - offset - t.height;
				left = a.left + a.width / 2 - t.width / 2;
				break;
			}
			case "bottom": {
				top = a.bottom + offset;
				left = a.left + a.width / 2 - t.width / 2;
				break;
			}
			case "left": {
				top = a.top + a.height / 2 - t.height / 2;
				left = a.left - offset - t.width;
				break;
			}
			case "right": {
				top = a.top + a.height / 2 - t.height / 2;
				left = a.right + offset;
				break;
			}
		}

		// keep it inside the viewport on the cross axis
		top = clamp(
			top,
			VIEWPORT_MARGIN,
			window.innerHeight - t.height - VIEWPORT_MARGIN,
		);
		left = clamp(
			left,
			VIEWPORT_MARGIN,
			window.innerWidth - t.width - VIEWPORT_MARGIN,
		);

		setPos({ top, left, side: resolved });
	}, [side, offset]);

	useLayoutEffect(() => {
		if (!open) {
			setPos(null);
			return;
		}

		update();

		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [open, update]);

	return (
		<>
			<OptionalLink
				{...props}
				ref={anchorRef}
				className={className}
				aria-describedby={open ? id : undefined}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				href={href ?? null}
			>
				{children}
			</OptionalLink>
			{open &&
				!!tooltipContent &&
				createPortal(
					<div
						ref={tipRef}
						id={id}
						role="tooltip"
						data-side={pos?.side}
						className={styles.container}
						style={{
							position: "fixed",
							top: pos?.top ?? 0,
							left: pos?.left ?? 0,
							visibility: pos ? "visible" : "hidden",
						}}
					>
						{tooltipContent}
					</div>,
					document.body,
				)}
		</>
	);
}
