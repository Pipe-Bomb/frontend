"use client";

import { useGetSavedArtists } from "@api";
import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { Grid } from "@/components/grid/grid.component";
import { Paginator } from "@/components/paginator/paginator.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import styles from "./saved-section.module.scss";

const PAGE_SIZE = 30;

export function SavedArtists() {
	const { currentPage } = useUrlPagination("page");
	const { data } = useGetSavedArtists({
		page: String(currentPage),
		pageSize: String(PAGE_SIZE),
	});

	if (!data || data.status != 200) {
		return (
			<div className={styles.container}>
				<Spinner position="expand" />
			</div>
		);
	}

	const { artists, total } = data.data;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className={styles.container}>
			<div className={styles.pageBar}>
				<span className={styles.count}>{total} artists</span>
				<Paginator urlKey="page" totalPages={totalPages} />
			</div>
			{artists.length ? (
				<Grid>
					{artists.map((artist, i) => (
						<GridArtist key={artist.uuid ?? i} artist={artist} />
					))}
				</Grid>
			) : (
				<div className={styles.empty}>No saved artists yet.</div>
			)}
		</div>
	);
}
