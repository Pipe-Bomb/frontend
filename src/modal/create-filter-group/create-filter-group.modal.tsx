import { Modal } from "@/components/modal/modal.component";
import { useRankedAttributes } from "@/hook/ranked-attributes.hook";
import { AttributeEntity, SmartPlaylistFilterGroup } from "@api";
import { useEffect, useMemo, useState } from "react";
import styles from "./create-filter-group.module.scss";
import { Dropdown } from "@/components/dropdown/dropdown.component";
import { Spinner } from "@/components/spinner/spinner.component";
import {
	BooleanAttributeFilterConfig,
	BufferAttributeFilterConfig,
	DecimalAttributeFilterConfig,
	IntegerAttributeFilterConfig,
	StringAttributeFilterConfig,
} from "@/modal/create-filter-group/attribute-filter-config.component";
import { SmartFilterDto } from "@/interface/smart-filter.dto";
import { useAttributeFilterDescription } from "@/hook/attribute-filter-description.hook";
import { SmartFilterListEntry } from "@/components/smart-filter-list-entry/smart-filter-list-entry.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";

interface PassthroughProps {
	existingGroup?: SmartPlaylistFilterGroup | null;
	onSave: (filters: SmartFilterDto[]) => void;
	onDelete: () => void;
	isSaving: boolean;
	isDeleting: boolean;
}

interface Props extends PassthroughProps {
	open: boolean;
	onClose?: () => void;
}

export function CreateFilterGroupModal({
	open,
	onClose,
	existingGroup,
	onSave,
	isSaving,
	isDeleting,
	onDelete,
}: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const [editingFilter, setEditingFilter] = useState<SmartFilterDto | null>(
		null,
	);

	useEffect(() => {
		setIsEditing(false);
		setEditingFilter(null);
	}, [existingGroup]);

	useEffect(() => {
		if (!isEditing) {
			setEditingFilter(null);
		}
	}, [isEditing]);

	return (
		<Modal
			open={open}
			onClose={onClose}
			onBack={isEditing ? () => setIsEditing(false) : null}
			title="Create Filter Group"
		>
			<Inner
				existingGroup={existingGroup}
				onSave={onSave}
				onDelete={onDelete}
				isSaving={isSaving}
				isDeleting={isDeleting}
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				editingFilter={editingFilter}
				setEditingFilter={setEditingFilter}
			/>
		</Modal>
	);
}

interface InnerProps extends PassthroughProps {
	isEditing: boolean;
	setIsEditing: (editing: boolean) => void;
	editingFilter: SmartFilterDto | null;
	setEditingFilter: (filter: SmartFilterDto | null) => void;
}

function Inner({
	existingGroup,
	onSave,
	isSaving,
	onDelete,
	isEditing,
	setIsEditing,
	editingFilter,
	setEditingFilter,
}: InnerProps) {
	const [filters, setFilters] = useState<SmartFilterDto[]>([]);

	useEffect(() => {
		if (!existingGroup) {
			setFilters([]);
			return;
		}

		setFilters(
			existingGroup.filters.map((filter) => {
				switch (filter.attributeType) {
					case "boolean":
						return {
							...filter,
							value: filter.value ?? undefined,
						};

					case "string":
						return { ...filter, value: filter.value ?? undefined };
					case "decimal":
					case "integer":
						return {
							...filter,
							value: filter.value ?? undefined,
							min: filter.min ?? undefined,
							max: filter.max ?? undefined,
						};
					case "buffer":
						return { ...filter };
					default:
						throw new Error("Not implemented");
				}
			}),
		);
	}, [existingGroup]);

	if (isEditing) {
		return (
			<CreateFilter
				filter={editingFilter}
				onCreate={(dto) => {
					if (editingFilter) {
						setFilters((filters) => {
							const newFilters = [...filters];
							for (const [index, filter] of newFilters.entries()) {
								if (filter == editingFilter) {
									newFilters[index] = dto;
								}
							}
							return newFilters;
						});
					} else {
						setFilters((filters) => [...filters, dto]);
					}
					setIsEditing(false);
				}}
				onRemove={() => {
					if (editingFilter) {
						setFilters((filters) =>
							filters.filter((filter) => filter != editingFilter),
						);
						setIsEditing(false);
					}
				}}
			/>
		);
	}

	return (
		<div className={styles.overviewContainer}>
			<div className={styles.filterList}>
				{filters.map((filter, index) => (
					<SmartFilterListEntry
						filter={filter}
						key={index}
						onEdit={() => {
							setEditingFilter(filter);
							setIsEditing(true);
						}}
					/>
				))}
			</div>
			<div className={styles.buttons}>
				{existingGroup && (
					<IconButton
						icon={IconTrash}
						iconSource="tabler"
						onClick={onDelete}
						disabled={isSaving}
					/>
				)}

				<IconButton
					icon={IconPlus}
					iconSource="tabler"
					onClick={() => setIsEditing(true)}
					disabled={isSaving}
				/>
				<IconButton
					icon={IconDeviceFloppy}
					iconSource="tabler"
					onClick={() => onSave(filters)}
					loading={isSaving}
					style="background"
				/>
			</div>
		</div>
	);
}

interface CreateFilterProps {
	filter: SmartFilterDto | null;
	onCreate: (dto: SmartFilterDto) => void;
	onRemove: () => void;
}

function CreateFilter({ onCreate, filter, onRemove }: CreateFilterProps) {
	const [entityTypeDropdownOpen, setEntityTypeDropdownOpen] = useState(false);
	const [attributeDropdownOpen, setAttributeDropdownOpen] = useState(false);
	useEffect(() => {
		if (entityTypeDropdownOpen) {
			setAttributeDropdownOpen(false);
		}
	}, [entityTypeDropdownOpen]);
	useEffect(() => {
		if (attributeDropdownOpen) {
			setEntityTypeDropdownOpen(false);
		}
	}, [attributeDropdownOpen]);

	const [selectedAttributeKey, setSelectedAttributeKey] = useState<
		string | null
	>(filter?.attributeKey ?? null);

	const [entityType, setEntityType] = useState<AttributeEntity>(
		filter?.entityType ?? "track",
	);

	useEffect(() => {
		if (filter) {
			setEntityType(filter.entityType);
			setSelectedAttributeKey(filter.attributeKey);
		} else {
			setEntityType("track");
			setSelectedAttributeKey(null);
		}
		setEntityTypeDropdownOpen(false);
		setAttributeDropdownOpen(false);
	}, [filter]);

	const rankedAttributes = useRankedAttributes(entityType);
	const selectedAttribute = useMemo(() => {
		if (!selectedAttributeKey || !rankedAttributes) {
			return null;
		}
		const attribute = rankedAttributes.find(
			(attribute) => attribute.key == selectedAttributeKey,
		);
		if (attribute) {
			return attribute;
		}
		return null;
	}, [selectedAttributeKey, rankedAttributes, entityType]);

	const [filterDto, setFilterDto] = useState<SmartFilterDto | null>(null);
	const description = useAttributeFilterDescription(filterDto);

	useEffect(() => {
		if (
			selectedAttribute &&
			filter &&
			selectedAttribute.key == filter.attributeKey &&
			selectedAttribute.type == filter.attributeType
		) {
			setFilterDto(filter);
		} else {
			setFilterDto(null);
		}
	}, [selectedAttribute, filter]);

	useEffect(() => {
		setEntityTypeDropdownOpen(false);
		setAttributeDropdownOpen(false);
	}, [entityType, selectedAttributeKey]);

	if (!rankedAttributes) {
		return <Spinner position="expand" />;
	}

	return (
		<div className={styles.filterEditContainer}>
			<div className={styles.filterEditSplit}>
				<div className={styles.attributeDropdowns}>
					<Dropdown
						open={entityTypeDropdownOpen}
						onToggle={setEntityTypeDropdownOpen}
						className={styles.dropdown}
						onChange={(entry) => setEntityType(entry.key as AttributeEntity)}
						entries={[
							{
								key: "track",
								content: "Track",
							},
							{
								key: "artist",
								content: "Artist",
							},
							{
								key: "album",
								content: "Album",
							},
						]}
						selected={entityType}
					/>
					<Dropdown
						open={attributeDropdownOpen}
						onToggle={setAttributeDropdownOpen}
						className={styles.dropdown}
						onChange={(entry) => setSelectedAttributeKey(entry.key)}
						entries={rankedAttributes.map((attribute) => ({
							t: `plugin.${attribute.pluginId}.attribute.${entityType}.${attribute.sourceId}.${attribute.key}.name`,
							key: `${attribute.key}`,
							content: attribute.key,
						}))}
						selected={selectedAttributeKey}
					/>
				</div>

				{selectedAttribute ? (
					<div className={styles.optionsSection}>
						{selectedAttribute.type == "string" && (
							<StringAttributeFilterConfig
								attribute={selectedAttribute}
								entityType={entityType}
								onChange={setFilterDto}
								initialFilter={filter}
							/>
						)}
						{selectedAttribute.type == "boolean" && (
							<BooleanAttributeFilterConfig
								attribute={selectedAttribute}
								entityType={entityType}
								onChange={setFilterDto}
								initialFilter={filter}
							/>
						)}
						{selectedAttribute.type == "integer" && (
							<IntegerAttributeFilterConfig
								attribute={selectedAttribute}
								entityType={entityType}
								onChange={setFilterDto}
								initialFilter={filter}
							/>
						)}
						{selectedAttribute.type == "decimal" && (
							<DecimalAttributeFilterConfig
								attribute={selectedAttribute}
								entityType={entityType}
								onChange={setFilterDto}
								initialFilter={filter}
							/>
						)}
						{selectedAttribute.type == "buffer" && (
							<BufferAttributeFilterConfig
								attribute={selectedAttribute}
								entityType={entityType}
								onChange={setFilterDto}
								initialFilter={filter}
							/>
						)}
					</div>
				) : (
					<div className={styles.optionsSection}>
						<span>Select an Attribute</span>
					</div>
				)}
			</div>
			<div className={styles.bottom}>
				<span className={styles.description}>{description}</span>
				<div className={styles.buttons}>
					{filter && (
						<IconButton
							icon={IconTrash}
							iconSource="tabler"
							onClick={onRemove}
						/>
					)}
					<IconButton
						icon={IconPlus}
						iconSource="tabler"
						style="background"
						disabled={!filterDto}
						onClick={filterDto && (() => onCreate(filterDto))}
					/>
				</div>
			</div>
		</div>
	);
}
