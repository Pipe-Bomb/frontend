import { Checkbox } from "@/components/checkbox/checkbox.component";
import { Dropdown } from "@/components/dropdown/dropdown.component";
import { Modal } from "@/components/modal/modal.component";
import { SearchAttributeDto } from "@/interface/search-attribute-dto.interface";
import { useSearchSource } from "@/hook/search-source.hook";
import { FilterableAttribute } from "pipe-bomb-tanstack-client";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import styles from "./search-param.module.scss";
import { Button } from "@/components/button/button.component";
import { TextInput } from "@/components/text-input/text-input.component";

interface Props extends InnerProps {
	open: boolean;
	onClose?: () => void;
}

export function SearchParamModal({ open, onClose, ...props }: Props) {
	return (
		<Modal open={open} onClose={onClose}>
			<Inner {...props} />
		</Modal>
	);
}

interface InnerProps {
	onSetting?: (setting: SearchAttributeDto, name: string) => void;
}

function Inner({ onSetting }: InnerProps) {
	const { filterableAttributes } = useSearchSource();
	const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
	const [media, setMedia] = useState<"track" | "artist" | "album">("track");
	useEffect(() => {
		setMediaDropdownOpen(false);
	}, [media]);

	const [attributeDropdownOpen, setAttributeDropdownOpen] = useState(false);
	useEffect(() => {
		if (mediaDropdownOpen) {
			setAttributeDropdownOpen(false);
		}
	}, [mediaDropdownOpen]);
	const [selectedAttributeKey, setSelectedAttributeKey] = useState<
		string | null
	>(null);
	useEffect(() => {
		setAttributeDropdownOpen(false);
	}, [selectedAttributeKey]);

	useEffect(() => {
		if (attributeDropdownOpen) {
			setMediaDropdownOpen(false);
		}
	}, [attributeDropdownOpen]);

	const entityTypes = useMemo<("track" | "artist" | "album")[]>(() => {
		const seen = new Set<string>();
		for (const attr of filterableAttributes) {
			seen.add(attr.entityType);
		}
		const order: ("track" | "artist" | "album")[] = [
			"track",
			"artist",
			"album",
		];
		return order.filter((e) => seen.has(e));
	}, [filterableAttributes]);

	useEffect(() => {
		if (entityTypes.length > 0 && !entityTypes.includes(media)) {
			setMedia(entityTypes[0]);
		}
	}, [entityTypes]);

	const attrsForMedia = useMemo(
		() => filterableAttributes.filter((a) => a.entityType === media),
		[filterableAttributes, media],
	);

	useEffect(() => {
		setSelectedAttributeKey(null);
	}, [media]);

	const selectedAttribute = useMemo(
		() =>
			selectedAttributeKey
				? (attrsForMedia.find(
						(a) => a.attributeKey === selectedAttributeKey,
					) ?? null)
				: null,
		[selectedAttributeKey, attrsForMedia],
	);

	const [attributeSetting, setAttributeSetting] = useState<
		[SearchAttributeDto, string] | null
	>(null);
	useLayoutEffect(() => {
		setAttributeSetting(null);
	}, [selectedAttribute]);

	if (filterableAttributes.length === 0) {
		return (
			<div className={styles.container}>
				<span>No filterable attributes available</span>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.dropdowns}>
				<Dropdown
					open={mediaDropdownOpen}
					onToggle={setMediaDropdownOpen}
					onChange={(entry) => setMedia(entry.key as typeof media)}
					entries={entityTypes.map((e) => ({
						key: e,
						content: e.charAt(0).toUpperCase() + e.slice(1),
					}))}
					selected={media}
				/>
				<Dropdown
					open={attributeDropdownOpen}
					onToggle={setAttributeDropdownOpen}
					onChange={(entry) => setSelectedAttributeKey(entry.key)}
					entries={attrsForMedia.map((attr) => ({
						key: attr.attributeKey,
						content: attr.label ?? attr.attributeKey,
					}))}
					selected={selectedAttributeKey}
				/>
			</div>

			{selectedAttribute ? (
				<div className={styles.optionsSection}>
					{selectedAttribute.attributeType == "string" && (
						<StringOptions
							attribute={selectedAttribute}
							entityType={media}
							onChange={(attribute, name) =>
								setAttributeSetting(
									attribute && name ? [attribute, name] : null,
								)
							}
						/>
					)}
					{selectedAttribute.attributeType == "boolean" && (
						<BooleanOptions
							attribute={selectedAttribute}
							entityType={media}
							onChange={(attribute, name) =>
								setAttributeSetting(
									attribute && name ? [attribute, name] : null,
								)
							}
						/>
					)}
					{selectedAttribute.attributeType == "integer" && (
						<IntegerOptions
							attribute={selectedAttribute}
							entityType={media}
							onChange={(attribute, name) =>
								setAttributeSetting(
									attribute && name ? [attribute, name] : null,
								)
							}
						/>
					)}
					{selectedAttribute.attributeType == "decimal" && (
						<DecimalOptions
							attribute={selectedAttribute}
							entityType={media}
							onChange={(attribute, name) =>
								setAttributeSetting(
									attribute && name ? [attribute, name] : null,
								)
							}
						/>
					)}
					{selectedAttribute.attributeType == "buffer" && (
						<BufferOptions
							attribute={selectedAttribute}
							entityType={media}
							onChange={(attribute, name) =>
								setAttributeSetting(
									attribute && name ? [attribute, name] : null,
								)
							}
						/>
					)}
					<div className={styles.searchButton}>
						<Button
							disabled={!attributeSetting}
							onClick={
								attributeSetting && (() => onSetting?.(...attributeSetting))
							}
						>
							Search
						</Button>
					</div>
				</div>
			) : (
				<div className={styles.optionsSection}>
					<span>Select an Attribute</span>
				</div>
			)}
		</div>
	);
}

interface OptionsProps {
	attribute: FilterableAttribute;
	entityType: "track" | "artist" | "album";
	onChange?: (
		attribute: SearchAttributeDto | null,
		name: string | null,
	) => void;
}

function StringOptions({ attribute, onChange, entityType }: OptionsProps) {
	const label = attribute.label ?? attribute.attributeKey;
	const [value, setValue] = useState("");
	const [partial, setPartial] = useState(false);
	const [exists, setExists] = useState(true);

	useEffect(() => {
		setValue("");
		setPartial(false);
		setExists(true);
	}, [attribute]);

	useEffect(() => {
		const setting: SearchAttributeDto = {
			type: "string",
			key: attribute.attributeKey,
			entityType,
		};

		if (!value) {
			setting.exists = exists;
			return onChange?.(
				setting,
				`${exists ? "Has" : "Doesn't have"} ${label}`,
			);
		}

		setting.query = value;
		setting.partial = partial;
		let name: string;
		if (partial) {
			name = `${label} contains "${value}"`;
		} else {
			name = `${label} is "${value}"`;
		}
		onChange?.(setting, name);
	}, [attribute, label, value, partial, exists]);

	return (
		<>
			<div className={styles.option}>
				<span className={styles.optionName}>Query</span>
				<TextInput
					value={value}
					onChange={setValue}
					placeholder={partial ? "Partial query" : "Exact query"}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Partial</span>
				<Checkbox checked={partial} onChange={setPartial} />
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Exists</span>
				<Checkbox checked={!!value || exists} onChange={setExists} />
			</div>
		</>
	);
}

function BooleanOptions({ attribute, onChange, entityType }: OptionsProps) {
	const label = attribute.label ?? attribute.attributeKey;
	const [value, setValue] = useState<"any" | "true" | "false">("any");
	const [exists, setExists] = useState(true);

	useEffect(() => {
		setValue("any");
		setExists(true);
	}, [attribute]);

	useEffect(() => {
		const setting: SearchAttributeDto = {
			type: "boolean",
			key: attribute.attributeKey,
			entityType,
		};

		let name: string;

		if (value == "any") {
			setting.exists = exists;
			name = `${label} ${exists ? "exists" : "doesn't exist"}`;
		} else {
			setting.boolean = value == "true";
			name = `${label} is ${setting.boolean ? "True" : "False"}`;
		}

		onChange?.(setting, name);
	}, [value, exists, entityType, label]);

	return (
		<>
			<div className={styles.option}>
				<span className={styles.optionName}>Value</span>
				<Dropdown
					entries={[
						{ content: "Any", key: "any" },
						{ content: "True", key: "true" },
						{ content: "False", key: "false" },
					]}
					selected={value}
					onChange={(entry) => setValue(entry.key as typeof value)}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Exists</span>
				<Checkbox checked={value != "any" || exists} onChange={setExists} />
			</div>
		</>
	);
}

function IntegerOptions({ attribute, onChange, entityType }: OptionsProps) {
	const label = attribute.label ?? attribute.attributeKey;
	const [rawValue, setRawValue] = useState<string>("");
	const [rawMin, setRawMin] = useState<string>("");
	const [rawMax, setRawMax] = useState<string>("");
	const [exists, setExists] = useState(true);

	const [value, min, max] = useMemo(() => {
		const parse = (v: string) => {
			if (!v.trim()) {
				return null;
			}
			const number = parseInt(v.trim());
			if (isNaN(number)) {
				return null;
			}
			return number;
		};

		if (rawValue.trim()) {
			return [parse(rawValue), null, null];
		}
		const parsedMin = parse(rawMin);
		const parsedMax = parse(rawMax);

		if (parsedMax && parsedMin) {
			if (parsedMax == parsedMin) {
				return [parsedMax, null, null];
			}
			if (parsedMax < parsedMin) {
				return [null, null, null];
			}
		}
		return [null, parsedMin, parsedMax];
	}, [rawValue, rawMin, rawMax]);

	useEffect(() => {
		const setting: SearchAttributeDto = {
			type: "integer",
			entityType,
			key: attribute.attributeKey,
		};

		if (value === null && min === null && max === null) {
			setting.exists = exists;
			return onChange?.(
				setting,
				`${exists ? "Has" : "Doesn't have"} ${label}`,
			);
		}

		let name: string;
		if (value !== null) {
			setting.integer = value;
			name = `${label} is ${value}`;
		} else {
			if (min !== null) {
				setting.min = min;
				name = `${label} >= ${min}`;
			}
			if (max !== null) {
				setting.max = max;
				if (min !== null) {
					name! += ` and <= ${max}`;
				} else {
					name = `${label} <= ${max}`;
				}
			}
		}
		onChange?.(setting, name!);
	}, [value, min, max, exists, entityType, label]);

	useEffect(() => {
		setRawValue("");
		setRawMin("");
		setRawMax("");
		setExists(true);
	}, [attribute]);

	return (
		<>
			<div className={styles.option}>
				<span className={styles.optionName}>Value</span>
				<TextInput
					value={rawValue}
					onChange={setRawValue}
					placeholder="Exact value"
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Min</span>
				<TextInput
					value={rawMin}
					onChange={setRawMin}
					placeholder="Minimum value"
					disabled={!!rawValue}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Max</span>
				<TextInput
					value={rawMax}
					onChange={setRawMax}
					placeholder="Maximum value"
					disabled={!!rawValue}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Exists</span>
				<Checkbox
					checked={value !== null || min !== null || max !== null || exists}
					onChange={setExists}
				/>
			</div>
		</>
	);
}

function DecimalOptions({ attribute, onChange, entityType }: OptionsProps) {
	const label = attribute.label ?? attribute.attributeKey;
	const [rawValue, setRawValue] = useState<string>("");
	const [rawMin, setRawMin] = useState<string>("");
	const [rawMax, setRawMax] = useState<string>("");
	const [exists, setExists] = useState(true);

	const [value, min, max] = useMemo(() => {
		const parse = (v: string) => {
			if (!v.trim()) {
				return null;
			}
			const number = parseFloat(v.trim());
			if (isNaN(number)) {
				return null;
			}
			return number;
		};

		if (rawValue.trim()) {
			return [parse(rawValue), null, null];
		}
		const parsedMin = parse(rawMin);
		const parsedMax = parse(rawMax);

		if (parsedMax && parsedMin) {
			if (parsedMax == parsedMin) {
				return [parsedMax, null, null];
			}
			if (parsedMax < parsedMin) {
				return [null, null, null];
			}
		}
		return [null, parsedMin, parsedMax];
	}, [rawValue, rawMin, rawMax]);

	useEffect(() => {
		const setting: SearchAttributeDto = {
			type: "decimal",
			entityType,
			key: attribute.attributeKey,
		};

		if (value === null && min === null && max === null) {
			setting.exists = exists;
			return onChange?.(
				setting,
				`${exists ? "Has" : "Doesn't have"} ${label}`,
			);
		}

		let name: string;
		if (value !== null) {
			setting.decimal = value;
			name = `${label} is ${value}`;
		} else {
			if (min !== null) {
				setting.min = min;
				name = `${label} >= ${min}`;
			}
			if (max !== null) {
				setting.max = max;
				if (min !== null) {
					name! += ` and <= ${max}`;
				} else {
					name = `${label} <= ${max}`;
				}
			}
		}
		onChange?.(setting, name!);
	}, [value, min, max, exists, entityType, label]);

	useEffect(() => {
		setRawValue("");
		setRawMin("");
		setRawMax("");
		setExists(true);
	}, [attribute]);

	return (
		<>
			<div className={styles.option}>
				<span className={styles.optionName}>Value</span>
				<TextInput
					value={rawValue}
					onChange={setRawValue}
					placeholder="Exact value"
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Min</span>
				<TextInput
					value={rawMin}
					onChange={setRawMin}
					placeholder="Minimum value"
					disabled={!!rawValue}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Max</span>
				<TextInput
					value={rawMax}
					onChange={setRawMax}
					placeholder="Maximum value"
					disabled={!!rawValue}
				/>
			</div>
			<div className={styles.option}>
				<span className={styles.optionName}>Exists</span>
				<Checkbox
					checked={value !== null || min !== null || max !== null || exists}
					onChange={setExists}
				/>
			</div>
		</>
	);
}

function BufferOptions({ attribute, onChange, entityType }: OptionsProps) {
	const label = attribute.label ?? attribute.attributeKey;
	const [checked, setChecked] = useState(false);
	useEffect(() => {
		setChecked(false);
	}, [attribute]);
	useEffect(() => {
		onChange?.(
			{
				type: "buffer",
				key: attribute.attributeKey,
				exists: checked,
				entityType,
			},
			`${checked ? "Has" : "Doesn't have"} ${label}`,
		);
	}, [checked, entityType, label]);

	return (
		<>
			<div className={styles.option}>
				<span className={styles.optionName}>Exists</span>
				<Checkbox checked={checked} onChange={setChecked} />
			</div>
		</>
	);
}
