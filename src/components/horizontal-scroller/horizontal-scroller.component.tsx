"use client";

import { ReactNode, useMemo, useState } from "react";
import styles from "./horizontal-scroller.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconChevronLeft,
	IconChevronRight,
	IconDots,
	IconGridDots,
} from "@tabler/icons-react";
import { useResizeDetector } from "react-resize-detector";
import { useIsMounted } from "@/hook/mounted.hook";
import { cc } from "@/lib/util";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import { useUISettings } from "@/context/ui-settings.context";

interface Props {
	children: ReactNode;
	heading: string;
	id: HorizontalScrollerId;
}

export function HorizontalScroller({ children, heading, id }: Props) {
	const { ref, width } = useResizeDetector();
	const { ref: innerRef, width: innerWidth } = useResizeDetector();
	const [scrollAmount, setScrollAmount] = useState(0);
	const isMounted = useIsMounted();

	const [stackSettings, setStackSettings] = useUISettings(
		"horizontalScrollerState",
		{
			"search:albums": false,
			"search:artists": false,
			"artist:albums": false,
			"artist:ephemeral-albums": false,
			"user:playlists": true,
		},
	);

	const stack = !!stackSettings[id];
	const setStack = (stack: boolean) =>
		setStackSettings({
			...stackSettings,
			[id]: stack,
		});

	const [canScrollLeft, canScrollRight] = useMemo<[boolean, boolean]>(() => {
		if (stack || !innerWidth || !width || innerWidth <= width) {
			return [false, false];
		}

		return [scrollAmount > 0, scrollAmount < innerWidth - width];
	}, [width, innerWidth, scrollAmount, isMounted, stack]);

	const scroll = (amount: number) => {
		const div = ref.current;
		if (!div || !width) {
			return;
		}

		div.scrollBy({
			left: amount * width,
			behavior: "smooth",
		});
	};

	if (!children || (Array.isArray(children) && !children.length)) {
		return null;
	}

	return (
		<div className={styles.container}>
			<div className={styles.top}>
				<h3 className={styles.heading}>{heading}</h3>
				{isMounted && (
					<>
						<IconButton
							icon={IconChevronLeft}
							iconSource="tabler"
							onClick={() => scroll(-1)}
							disabled={!canScrollLeft}
						/>
						<IconButton
							icon={IconChevronRight}
							iconSource="tabler"
							onClick={() => scroll(1)}
							disabled={!canScrollRight}
						/>
						<IconButton
							icon={stack ? IconDots : IconGridDots}
							iconSource="tabler"
							onClick={() => setStack(!stack)}
						/>
					</>
				)}
			</div>
			<div
				className={styles.content}
				ref={ref}
				onScroll={(e) => setScrollAmount(e.currentTarget.scrollLeft)}
			>
				<div
					className={cc(stack ? styles.stack : styles.scroll)}
					ref={innerRef}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
