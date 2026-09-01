"use client";

import { PluginLibrary } from "@api";
import { useEffect, useMemo, useState } from "react";
import styles from "./library-tracks.module.scss";
import { useSearchLibrary } from "@api";
import { Paginator } from "@/components/paginator/paginator.component";
import { useUrlPagination } from "@/hook/url-pagination.hook";
import { useUrlParam } from "@/hook/url-param.hook";
import { Spinner } from "@/components/spinner/spinner.component";
import { TrackList } from "@/components/track-list/track-list.component";
import { unwrapData } from "@/lib/api.util";
import { useSearchSource } from "@/hook/search-source.hook";
import { useTranslation } from "@/context/language.context";
import {
	Dropdown,
	DropdownEntry,
} from "@/components/dropdown/dropdown.component";

interface Props {
	library: PluginLibrary;
}

export function LibraryTracks({ library }: Props) {
	const search = useSearchLibrary();
	const { currentPage, setPage } = useUrlPagination();
	const { pluginId, sourceId, hasSortMethods, sortMethods } = useSearchSource({
		tracks: true,
	});
	const { t } = useTranslation();
	const [sortParam, setSortParam] = useUrlParam("sort", { replace: true });
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

	const sortEntries = useMemo<DropdownEntry[]>(() => {
		if (!hasSortMethods || !pluginId || !sourceId) {
			return [];
		}
		return sortMethods.flatMap((method) => {
			console.log({ pluginId, sourceId, key: method.key });

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
		const attributeKey = sortParam.slice(0, colonIdx);
		const direction = sortParam.slice(colonIdx + 1);
		if (direction !== "asc" && direction !== "desc") {
			return undefined;
		}
		return { attributeKey, direction } as const;
	}, [sortParam]);

	useEffect(() => {
		search.mutate({
			pluginId: library.pluginId,
			libraryId: library.id,
			data: {
				page: currentPage,
				pageSize: 30,
				sort: sortDto,
			},
		});
	}, [library.pluginId, library.id, currentPage, sortDto]);

	if (!search.data) {
		return (
			<div className={styles.loading}>
				<Spinner position="expand" />
			</div>
		);
	}

	if (search.data.status == 404) {
		return <h1>Not found</h1>;
	}

	const { tracks, totalPages } = unwrapData(search.data);

	return (
		<div className={styles.container}>
			<div className={styles.controls}>
				{hasSortMethods && (
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
				)}
			</div>
			<TrackList tracks={tracks} />
			<div className={styles.pageBar}>
				<Paginator urlKey="page" totalPages={totalPages} />
			</div>
		</div>
	);
}
