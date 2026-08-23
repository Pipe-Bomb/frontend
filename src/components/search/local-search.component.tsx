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

interface Props {
	query: string;
}

export function LocalSearch({ query }: Props) {
	const [modalOpen, setModalOpen] = useState(false);
	const [customAttributes, setCustomAttributes] = useState<
		(SearchAttributeDto & { name: string })[]
	>([]);
	const attributes = useMemo(() => {
		const attributes: SearchAttributeDto[] = [...customAttributes];
		if (query) {
			attributes.push(
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
		return attributes;
	}, [query, customAttributes]);

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
			attributes,
		}));
	}, [attributes]);

	const search = useSearch();

	useEffect(() => {
		search.mutate({
			data: debouncedOptions,
		});
	}, [debouncedOptions]);

	return (
		<>
			<div className={styles.container}>
				<Requirements
					attributes={customAttributes}
					onChange={setCustomAttributes}
					openModal={() => setModalOpen(true)}
				/>
				{search.data && !search.isPending && search.data.status >= 200 && search.data.status < 300 ? (
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

interface RequirementsProps {
	attributes: (SearchAttributeDto & { name: string })[];
	onChange: (attributes: (SearchAttributeDto & { name: string })[]) => void;
	openModal: () => void;
}

function Requirements({ attributes, onChange, openModal }: RequirementsProps) {
	return (
		<div className={styles.requirementsContainer}>
			<div className={styles.existingRequirements}>
				{attributes.map((attribute, index) => (
					<div key={index} className={styles.requirement}>
						<div className={styles.requirementMain}>
							<span className={styles.requirementMedia}>
								{attribute.entityType}
							</span>
							<span className={styles.requirementName}>{attribute.name}</span>
						</div>
						<IconButton
							icon={IconXFilled}
							iconSource="tabler"
							size="sm"
							onClick={() => onChange(attributes.filter((a) => a != attribute))}
						/>
					</div>
				))}
			</div>
			<IconButton
				icon={IconPlusFilled}
				iconSource="tabler"
				onClick={openModal}
			/>
		</div>
	);
}
