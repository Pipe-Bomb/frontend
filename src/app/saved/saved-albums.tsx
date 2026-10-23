"use client";

import { useGetSavedAlbums } from "@api";
import { GridAlbum } from "@/components/grid-album/grid-album.component";
import { Grid } from "@/components/grid/grid.component";
import { Paginator } from "@/components/paginator/paginator.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import styles from "./saved-section.module.scss";
import { useEffect, useId } from "react";
import { useListSelection, useSelectionStore } from "@/store/selection.store";

const PAGE_SIZE = 30;

export function SavedAlbums() {
	const { currentPage } = useUrlPagination("page");
	const { data } = useGetSavedAlbums({
		page: String(currentPage),
		pageSize: String(PAGE_SIZE),
	});
	const listId = useId();
	const selection = useListSelection<"album">(
		listId,
		["saved"],
		(entity1, entity2) => {
			if (data?.status == 200) {
				const entities = data.data.albums;

				let index1 = entities.indexOf(entity1);
				let index2 = entities.indexOf(entity2);
				if (index1 < 0 || index2 < 0) {
					return [];
				}

				if (index2 < index1) {
					[index1, index2] = [index2, index1];
				}

				return entities.slice(index1, index2 + 1);
			}
			return [entity1, entity2];
		},
	);
	const clearList = useSelectionStore((state) => state.clearList);
	useEffect(() => {
		return () => clearList(listId);
	}, [clearList, listId, currentPage]);

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
			</div>
			{albums.length ? (
				<Grid>
					{albums.map((album, i) => (
						<GridAlbum
							key={album.uuid ?? i}
							album={album}
							isSelected={selection.isSelected(album)}
							onToggleSelected={(bulk) => selection.toggle(album, bulk)}
						/>
					))}
				</Grid>
			) : (
				<div className={styles.empty}>No saved albums yet.</div>
			)}
			<Paginator urlKey="page" totalPages={totalPages} />
		</div>
	);
}
