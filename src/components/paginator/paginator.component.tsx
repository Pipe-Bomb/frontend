import { IconButton } from "@/components/icon-button/icon-button";
import { IconCaretLeftFilled, IconCaretRightFilled } from "@tabler/icons-react";
import styles from "./paginator.module.scss";
import { useUrlPagination } from "@hook/url-pagination";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

interface Props {
	urlKey: string;
	totalPages?: number | null;
}

export function Paginator({ urlKey, totalPages }: Props) {
	const { currentPage, setPage } = useUrlPagination(urlKey);
	const [pageString, setPageString] = useState(currentPage.toString());
	const { ref, width } = useResizeDetector();
	const [css, setCss] = useState<CSSProperties>({
		width: "0px",
	});

	useEffect(() => {
		if (width !== undefined) {
			setCss({
				"--width": `${width}px`,
			} as CSSProperties);
		}
	}, [width]);

	useEffect(() => {
		console.log(width);
	}, [width]);

	const additionalButtons: [number[], number[]] = useMemo(() => {
		const before: number[] = [];
		const after: number[] = [];

		if (currentPage > 1) {
			before.push(currentPage - 1);
		}
		if (currentPage != 1 && !before.includes(1)) {
			before.unshift(1);
		}

		if (typeof totalPages != "number" || totalPages > currentPage) {
			after.push(currentPage + 1);
			if (totalPages && !after.includes(totalPages)) {
				after.push(totalPages);
			}
		}

		return [before, after];
	}, [currentPage, totalPages]);

	const atFirst = currentPage <= 1;
	const atLast =
		totalPages !== undefined &&
		totalPages !== null &&
		currentPage >= totalPages;

	return (
		<div className={styles.container}>
			<span className={styles.widthCalculator} ref={ref}>
				{pageString}
			</span>

			<IconButton
				icon={IconCaretLeftFilled}
				onClick={() => {
					setPageString((currentPage - 1).toString());
					setPage(currentPage - 1);
				}}
				iconSource="tabler"
				disabled={atFirst}
			/>
			{additionalButtons[0].map((pageNumber) => (
				<button
					className={styles.sideButton}
					key={pageNumber}
					onClick={() => {
						setPageString(pageNumber.toString());
						setPage(pageNumber);
					}}
				>
					{pageNumber}
				</button>
			))}
			<input
				type="text"
				value={pageString}
				className={styles.pageNumber}
				onChange={(e) => setPageString(e.currentTarget.value)}
				style={css}
				onKeyDown={(e) => {
					if (e.key == "Enter" && pageString) {
						const int = parseInt(pageString);
						if (!isNaN(int)) {
							setPage(int);
						}
					}
				}}
			/>
			{additionalButtons[1].map((pageNumber) => (
				<button
					className={styles.sideButton}
					key={pageNumber}
					onClick={() => {
						setPageString(pageNumber.toString());
						setPage(pageNumber);
					}}
				>
					{pageNumber}
				</button>
			))}
			<IconButton
				icon={IconCaretRightFilled}
				onClick={() => {
					setPageString((currentPage + 1).toString());
					setPage(currentPage + 1);
				}}
				iconSource="tabler"
				disabled={atLast}
			/>
		</div>
	);
}
