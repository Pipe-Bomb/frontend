"use client";

import { Spinner } from "@/components/spinner/spinner.component";
import { useSearchArtists } from "@api";
import { useEffect, useId, useMemo, useState } from "react";
import styles from "./artist-grid.module.scss";
import { GridArtist } from "@/components/grid-artist/grid-artist.component";
import { Paginator } from "@/components/paginator/paginator.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import { useUrlParam } from "@/hook/url-param.hook";
import { Grid } from "@/components/grid/grid.component";
import { unwrapData } from "@/lib/api.util";
import { useSearchSource } from "@/hook/search-source.hook";
import { useTranslation } from "@/context/language.context";
import {
	Dropdown,
	DropdownEntry,
} from "@/components/dropdown/dropdown.component";
import {
	SelectionVariant,
	useListSelection,
	useSelectionStore,
} from "@/store/selection.store";

interface Props {
	variant?: SelectionVariant<"artist">[];
}

export function ArtistGrid({ variant }: Props) {
	const search = useSearchArtists();
	const { currentPage, setPage } = useUrlPagination();
	const { pluginId, sourceId, hasSortMethods, sortMethods } = useSearchSource({
		artists: true,
	});
	const { t } = useTranslation();
	const [sortParam, setSortParam] = useUrlParam("sort", { replace: true });
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
	const listId = useId();
	const selection = useListSelection<"artist">(
		listId,
		variant ?? [],
		(entity1, entity2) => {
			if (search.data?.status == 200) {
				const entities = search.data.data.artists;

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

	const sortEntries = useMemo<DropdownEntry[]>(() => {
		if (!hasSortMethods || !pluginId || !sourceId) {
			return [];
		}
		return sortMethods.flatMap((method) => {
			const label = t(
				`sort.plugin.${pluginId}.${sourceId}.${method.key}.name`,
				method.label ?? method.key,
			);
			const entries: DropdownEntry[] = [];
			if (method.ascending) {
				entries.push({ key: `${method.key}:asc`, content: `${label} ↑` });
			}
			if (method.descending) {
				entries.push({ key: `${method.key}:desc`, content: `${label} ↓` });
			}
			return entries;
		});
	}, [sortMethods, hasSortMethods, pluginId, sourceId, t]);

	const sortDto = useMemo(() => {
		if (!sortParam) {
			return undefined;
		}
		const colonIdx = sortParam.lastIndexOf(":");
		if (colonIdx === -1) {
			return undefined;
		}
		const key = sortParam.slice(0, colonIdx);
		const direction = sortParam.slice(colonIdx + 1);
		if (direction !== "asc" && direction !== "desc") {
			return undefined;
		}
		return { key, direction } as const;
	}, [sortParam]);

	useEffect(() => {
		search.mutate({
			data: {
				page: currentPage,
				pageSize: 30,
				sort: sortDto,
			},
		});
	}, [currentPage, sortDto]);

	if (!search.data) {
		return (
			<div className={styles.loading}>
				<Spinner position="expand" />
			</div>
		);
	}

	const { artists, totalPages } = unwrapData(search.data);

	return (
		<div className={styles.container}>
			{hasSortMethods && (
				<div className={styles.controls}>
					<Dropdown
						entries={sortEntries}
						selected={sortParam}
						open={sortDropdownOpen}
						onToggle={setSortDropdownOpen}
						onChange={(entry) => {
							setSortParam(entry.key);
							setPage(1);
							setSortDropdownOpen(false);
						}}
						floating
					/>
				</div>
			)}
			<Grid>
				{artists.map((artist) => (
					<GridArtist
						key={artist.uuid}
						artist={artist}
						isSelected={selection.isSelected(artist)}
						onToggleSelected={(bulk) => selection.toggle(artist, bulk)}
					/>
				))}
			</Grid>
			<Paginator urlKey="page" totalPages={totalPages} />
		</div>
	);
}
