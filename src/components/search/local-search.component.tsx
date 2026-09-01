import { SearchDto, useSearch } from "@/api";
import { SearchResults } from "@/components/search-results/search-results.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { useDebounce } from "@/hook/debounce.hook";
import { useEffect, useMemo, useState } from "react";
import styles from "./search.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconPlusFilled, IconXFilled } from "@tabler/icons-react";
import { SearchParamModal } from "@/modal/search-param/search-param.modal";
import { SearchAttributeDto } from "@/interface/search-attribute-dto.interface";
import { useSearchSource } from "@/hook/search-source.hook";
import { useTranslation } from "@/context/language.context";
import {
	Dropdown,
	DropdownEntry,
} from "@/components/dropdown/dropdown.component";

interface Props {
	query: string;
}

export function LocalSearch({ query }: Props) {
	const {
		source,
		pluginId,
		sourceId,
		hasSortMethods,
		hasFilterableAttributes,
		sortMethods,
	} = useSearchSource({ tracks: true, albums: true, artists: true });
	const { t } = useTranslation();
	const [modalOpen, setModalOpen] = useState(false);
	const [customAttributes, setCustomAttributes] = useState<
		(SearchAttributeDto & { name: string })[]
	>([]);
	const [sort, setSort] = useState<
		{ key: string; direction: "asc" | "desc" } | undefined
	>(undefined);
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

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

	const sortParamKey = sort ? `${sort.key}:${sort.direction}` : null;

	const attributes = useMemo(() => {
		const attrs: SearchAttributeDto[] = [...customAttributes];
		if (!source && query) {
			attrs.push(
				{
					entityType: "track",
					type: "string",
					key: "title",
					partial: true,
					query,
				},
				{
					entityType: "artist",
					type: "string",
					key: "name",
					partial: true,
					query,
				},
				{
					entityType: "album",
					type: "string",
					key: "title",
					partial: true,
					query,
				},
			);
		}
		return attrs;
	}, [query, customAttributes, source]);

	const [options, setOptions] = useState<SearchDto>({
		withAlbums: true,
		withArtists: true,
		withTracks: true,
		attributes,
	});

	const [debouncedOptions] = useDebounce(options, 1_000);

	useEffect(() => {
		setOptions((options) => ({
			...options,
			query: source ? query || undefined : undefined,
			sort: source ? sort : undefined,
			attributes,
		}));
	}, [attributes, query, sort, source]);

	const search = useSearch();

	useEffect(() => {
		search.mutate({
			data: debouncedOptions,
		});
	}, [debouncedOptions]);

	return (
		<>
			<div className={styles.container}>
				<div className={styles.requirementsContainer}>
					{source && hasSortMethods && (
						<Dropdown
							entries={sortEntries}
							selected={sortParamKey}
							open={sortDropdownOpen}
							onToggle={setSortDropdownOpen}
							onChange={(entry) => {
								const colonIdx = entry.key.lastIndexOf(":");
								const key = entry.key.slice(0, colonIdx);
								const direction = entry.key.slice(colonIdx + 1) as
									| "asc"
									| "desc";
								setSort({ key, direction });
								setSortDropdownOpen(false);
							}}
							floating
						/>
					)}
					<div className={styles.existingRequirements}>
						{customAttributes.map((attribute, index) => (
							<div key={index} className={styles.requirement}>
								<div className={styles.requirementMain}>
									<span className={styles.requirementMedia}>
										{attribute.entityType}
									</span>
									<span className={styles.requirementName}>
										{attribute.name}
									</span>
								</div>
								<IconButton
									icon={IconXFilled}
									iconSource="tabler"
									size="sm"
									onClick={() =>
										setCustomAttributes(
											customAttributes.filter((a) => a !== attribute),
										)
									}
								/>
							</div>
						))}
					</div>
					<IconButton
						icon={IconPlusFilled}
						iconSource="tabler"
						onClick={() => setModalOpen(true)}
						disabled={!hasFilterableAttributes}
					/>
				</div>
				{search.data && !search.isPending && search.data.status === 200 ? (
					<SearchResults
						tracks={search.data.data.tracks}
						artists={search.data.data.artists}
						albums={search.data.data.albums}
					/>
				) : (
					<div className={styles.searchLoading}>
						<Spinner position="expand" />
					</div>
				)}
			</div>
			<SearchParamModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSetting={(setting, name) => {
					setCustomAttributes([...customAttributes, { ...setting, name }]);
					setModalOpen(false);
				}}
			/>
		</>
	);
}
