"use client";

import { useGetSavedAlbums } from "@api";
import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { Grid } from "@/components/grid/grid.component";
import { Paginator } from "@/components/paginator/paginator.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import styles from "./saved-section.module.scss";

const PAGE_SIZE = 30;

export function SavedAlbums() {
	const { currentPage } = useUrlPagination("page");
	const { data } = useGetSavedAlbums({
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

	const { albums, total } = data.data;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className={styles.container}>
			<div className={styles.pageBar}>
				<span className={styles.count}>{total} albums</span>
				<Paginator urlKey="page" totalPages={totalPages} />
			</div>
			{albums.length ? (
				<Grid>
					{albums.map((album, i) => (
						<GridAlbum key={album.uuid ?? i} album={album} />
					))}
				</Grid>
			) : (
				<div className={styles.empty}>No saved albums yet.</div>
			)}
		</div>
	);
}
