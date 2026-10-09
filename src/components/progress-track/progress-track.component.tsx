import {
	ChangeEvent,
	CSSProperties,
	MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import styles from "./progress-track.module.scss";
import { cc } from "@/lib/util";

interface Props {
	max: number;
	value: number;
	loading?: boolean;
	onChange?: (value: number) => void;
}

export function ProgressTrack({ max, value, loading, onChange }: Props) {
	const [dragValue, setDragValue] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [pendingValueUpdate, setPendingValueUpdate] = useState(false);

	const percent = useMemo(
		() => ((pendingValueUpdate || isDragging ? dragValue : value) / max) * 100,
		[max, dragValue, isDragging, pendingValueUpdate, value],
	);

	const style = {
		"--percent": `${percent}%`,
		"--center-offset": `${(percent - 50) / -50}`,
	} as CSSProperties;

	const startDrag = () => {
		setIsDragging(true);
		setPendingValueUpdate(true);

		const listener = () => {
			window.removeEventListener("mouseup", listener);
			window.removeEventListener("mouseleave", listener);

			setIsDragging(false);
			setPendingValueUpdate(true);
		};

		window.addEventListener("mouseup", listener);
		window.addEventListener("mouseleave", listener);
	};

	useEffect(() => {
		if (!isDragging) {
			onChange?.(dragValue);
		}
	}, [isDragging]);

	useEffect(() => {
		if (pendingValueUpdate) {
			setPendingValueUpdate(false);
		}
	}, [value]);

	const change = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const value = Number(e.currentTarget.value);
			if (!isDragging) {
				setIsDragging(true);
				setPendingValueUpdate(true);
			}
			setDragValue(value);
		},
		[isDragging],
	);

	return (
		<div
			className={cc(styles.container, loading && styles.isLoading)}
			style={style}
		>
			<input
				type="range"
				className={styles.input}
				step={0.1}
				value={pendingValueUpdate || isDragging ? dragValue : value}
				max={max}
				onChange={change}
				onMouseDown={startDrag}
				data-global-shortcuts
			/>
			<div className={styles.track}>
				<div className={styles.progress} />
				<div className={styles.loading} />
			</div>
			<div className={styles.thumb} />
		</div>
	);
}
