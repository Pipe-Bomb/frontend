"use client";

import { useEffect, useState } from "react";
import styles from "./search.module.scss";
import {
	EphemeralSearchDto,
	useSearchEphemeralSource,
} from "pipe-bomb-tanstack-client";
import { useDebounce } from "@/hook/debounce.hook";
import { Spinner } from "@/components/spinner/spinner.component";
import { SearchResults } from "@/components/search-results/search-results.component";
import { unwrapData } from "@/lib/api.util";

interface Props {
	query: string;
	sourceId: string;
	pluginId: string;
}

export function EphemeralSearch({ query, sourceId, pluginId }: Props) {
	const [options, setOptions] = useState<
		Omit<Omit<EphemeralSearchDto, "pluginId">, "sourceId">
	>({
		query,
	});
	const [debouncedOptions] = useDebounce(options, 1_000);

	useEffect(() => {
		setOptions((options) => ({
			...options,
			query,
		}));
	}, [query]);

	const search = useSearchEphemeralSource();

	useEffect(() => {
		if (debouncedOptions.query.length) {
			search.mutate({
				data: { ...debouncedOptions, pluginId, sourceId },
			});
		}
	}, [debouncedOptions, pluginId, sourceId]);

	if (!search.data || search.isPending) {
		return (
			<div className={styles.searchLoading}>
				<Spinner position="expand" />
			</div>
		);
	}

	const results = unwrapData(search.data);

	return (
		<SearchResults
			tracks={results.tracks}
			artists={results.artists}
			albums={results.albums}
		/>
	);
}
