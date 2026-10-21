import { MouseEvent, useRef } from "react";

const HOLD_DURATION = 300;

export function useClickHold(
	onHold: (e: MouseEvent) => void,
	onClick?: (e: MouseEvent) => void,
): Partial<
	React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	>
> {
	const holdMap = useRef<Map<EventTarget, number>>(new Map());

	return {
		onMouseDown: (e) => {
			// only use left click
			if (e.button) {
				return;
			}

			const target = e.currentTarget;
			const start = Date.now();
			holdMap.current.set(target, start);

			const holdTimeout = setTimeout(() => {
				onHold(e);
			}, HOLD_DURATION);

			const cancel = () => {
				target.removeEventListener("mouseup", cancel);
				window.removeEventListener("mousemove", cancel);

				clearTimeout(holdTimeout);
				setTimeout(() => holdMap.current.delete(target));
			};

			target.addEventListener("mouseup", cancel);
			window.addEventListener("mousemove", cancel);
		},
		onMouseUp: (e) => {
			setTimeout(() => holdMap.current.delete(e.currentTarget));
		},
		onClick: (e) => {
			const holdStart = holdMap.current.get(e.currentTarget);
			if (holdStart) {
				const holdDuration = Date.now() - holdStart;
				if (holdDuration >= HOLD_DURATION) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
			}
			onClick?.(e);
		},
	};
}
