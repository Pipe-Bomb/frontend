import {
	AnySelectedItem,
	ENTITY_NAMES,
	SelectionItemEntity,
	SelectionItemKey,
	SelectionVariant,
	SelectionVariantName,
	selectionVariantInfo,
	useSelectionStore,
} from "@/store/selection.store";
import { DependencyList, useMemo } from "react";

export type SelectionFilter = {
	[K in SelectionItemKey]?: SelectionVariant<K>[] | boolean;
};

type VariantUsage = {
	name: SelectionVariantName<SelectionItemKey>;
	id: string | null;
};

function variantMatches(
	selected: VariantUsage,
	allowed: SelectionVariant<SelectionItemKey>,
) {
	const info = selectionVariantInfo(allowed);

	return (
		selected.name === info.name && (info.id === null || info.id === selected.id)
	);
}

interface Helpers<T> {
	add: (value: T) => void;
	addIf: (condition: boolean, value: T) => void;
	only: (filter: SelectionFilter) => boolean;
	reduce: <T extends SelectionItemKey, V>(
		type: T,
		initialValue: V,
		iterate: (
			entity: SelectionItemEntity<T>,
			variants: {
				type: SelectionVariantName<T>;
				id: string | null;
			}[],
			value: V,
		) => V,
	) => V;
	forEach: (callback: (item: AnySelectedItem) => void) => void;
	some: (filter: SelectionFilter) => boolean;
}

export function useBulkFilters<T>(
	builder: (helpers: Helpers<T>) => void,
	deps?: DependencyList,
) {
	const selected = useSelectionStore((state) => state.selected);

	return useMemo(() => {
		const keys: Partial<Record<SelectionItemKey, VariantUsage[]>> = {};
		for (const list of Object.values(selected)) {
			for (const selection of Object.values(list)) {
				let variantList = keys[selection.type];
				if (!variantList) {
					variantList = [];
					keys[selection.type] = variantList;
				}

				for (const variant of selection.variant) {
					variantList.push(selectionVariantInfo(variant));
				}
			}
		}

		const result: T[] = [];

		builder({
			add: (value) => result.push(value),
			addIf: (condition, value) => {
				if (condition) {
					result.push(value);
				}
			},
			only: (filter) => {
				const types = Object.keys(ENTITY_NAMES) as SelectionItemKey[];

				for (const type of types) {
					const variants = keys[type];

					if (!variants) {
						continue;
					}

					const allowedVariants:
						| SelectionVariant<SelectionItemKey>[]
						| boolean
						| undefined = filter[type as keyof SelectionFilter];

					if (!allowedVariants) {
						return false;
					}

					if (allowedVariants === true) {
						continue;
					}

					if (!variants.length) {
						return false;
					}
					for (const variant of variants) {
						if (
							!allowedVariants.some((allowed) =>
								variantMatches(variant, allowed),
							)
						) {
							return false;
						}
					}
				}
				return true;
			},
			reduce: (type, initialValue, iterate) => {
				let value = initialValue;

				for (const list of Object.values(selected)) {
					for (const item of Object.values(list)) {
						if (type == item.type) {
							value = iterate(
								item.entity,
								item.variant.map((variant) =>
									typeof variant == "object"
										? variant
										: {
												type: variant,
												id: null,
											},
								),
								value,
							);
						}
					}
				}

				return value;
			},
			forEach: (callback) => {
				for (const list of Object.values(selected)) {
					for (const item of Object.values(list)) {
						callback(item);
					}
				}
			},
			some: (filter) => {
				const types = Object.keys(ENTITY_NAMES) as SelectionItemKey[];

				for (const type of types) {
					const variants = keys[type];

					if (!variants) {
						continue;
					}

					const allowedVariants:
						| SelectionVariant<SelectionItemKey>[]
						| boolean
						| undefined = filter[type as keyof SelectionFilter];

					if (!allowedVariants) {
						continue;
					}

					if (allowedVariants === true) {
						return true;
					}

					if (
						variants.some((variant) =>
							allowedVariants.some((allowed) =>
								variantMatches(variant, allowed),
							),
						)
					) {
						return true;
					}
				}
				return false;
			},
		});

		return result;
		// eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
	}, [selected, ...(deps ?? [])]);
}
