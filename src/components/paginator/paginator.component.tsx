import { IconButton } from "@/components/icon-button/icon-button";
import { IconCaretLeftFilled, IconCaretRightFilled } from "@tabler/icons-react";
import styles from "./paginator.module.scss";
import { useUrlPagination } from "@hook/url-pagination";

interface Props {
	urlKey: string;
	totalPages?: number;
}

export function Paginator({ urlKey, totalPages }: Props) {
	const { currentPage, setPage } = useUrlPagination(urlKey);

	const atFirst = currentPage <= 1;
	const atLast = totalPages !== undefined && currentPage >= totalPages;

	return (
		<div className={styles.container}>
			<IconButton
				icon={IconCaretLeftFilled}
				onClick={() => setPage(currentPage - 1)}
				iconSource="tabler"
				disabled={atFirst}
			/>
			<span className={styles.pageNumber}>
				{currentPage}
				{totalPages !== undefined ? ` / ${totalPages}` : ""}
			</span>
			<IconButton
				icon={IconCaretRightFilled}
				onClick={() => setPage(currentPage + 1)}
				iconSource="tabler"
				disabled={atLast}
			/>
		</div>
	);
}
