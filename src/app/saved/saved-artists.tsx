"use client";

import { useGetSavedArtists } from "@api";
import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { Grid } from "@/components/grid/grid.component";
import { Paginator } from "@/components/paginator/paginator.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import styles from "./saved-section.module.scss";
import { useEffect, useId } from "react";
import { useListSelection, useSelectionStore } from "@/store/selection.store";

const PAGE_SIZE = 30;

export function SavedArtists() {
	const { currentPage } = useUrlPagination("page");
	const { data } = useGetSavedArtists({
		page: String(currentPage),
		pageSize: String(PAGE_SIZE),
	});
	const listId = useId();
	const selection = useListSelection<"artist">(
		listId,
		["saved"],
		(entity1, entity2) => {
			if (data?.status == 200) {
				const entities = data.data.artists;

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

	const { artists, total } = data.data;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className={styles.container}>
			<div className={styles.pageBar}>
				<span className={styles.count}>{total} artists</span>
			</div>
			{artists.length ? (
				<Grid>
					{artists.map((artist, i) => (
						<GridArtist
							key={artist.uuid ?? i}
							artist={artist}
							isSelected={selection.isSelected(artist)}
							onToggleSelected={(bulk) => selection.toggle(artist, bulk)}
						/>
					))}
				</Grid>
			) : (
				<div className={styles.empty}>No saved artists yet.</div>
			)}
			<Paginator urlKey="page" totalPages={totalPages} />
		</div>
	);
}
