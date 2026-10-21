import { albumSavedKey, artistSavedKey } from "@/lib/saved.util";
import { serializeTrackKey } from "@/lib/track-batcher.util";
import { Album, Artist, EphemeralTrack, Playlist, Track } from "@api";
import { useMemo, useRef } from "react";
import { create } from "zustand";

export type SelectionItemMap = {
	track: [Track, ["playlist", "history", "saved", "queue"]];
	ephemeralTrack: [EphemeralTrack, ["queue"]];
	playlist: [Playlist, ["owned"]];
	album: [Album, ["saved"]];
	artist: [Artist, ["saved"]];
};

export const ENTITY_NAMES: Record<SelectionItemKey, [string, string]> = {
	track: ["track", "tracks"],
	ephemeralTrack: ["ephemeral track", "ephemeral tracks"],
	playlist: ["playlist", "playlists"],
	album: ["album", "albums"],
	artist: ["artist", "artists"],
};

export function getSelectionMessage(counts: SelectionCounts) {
	if (!counts.total) {
		return "Nothing selected";
	}

	const parts: string[] = [];
	for (const [key, value] of Object.entries(counts) as [
		keyof SelectionCounts,
		number,
	][]) {
		if (key == "total" || !value) {
			continue;
		}
		parts.push(`${value} ${ENTITY_NAMES[key][value == 1 ? 0 : 1]}`);
	}

	if (!parts.length) {
		return "Nothing selected";
	}

	if (parts.length == 1) {
		return `Selected ${parts[0]}`;
	}

	let message = "Selected ";
	for (let i = 0; i < parts.length - 1; i++) {
		if (i) {
			message += ", ";
		}
		message += parts[i];
	}
	message += ` & ${parts[parts.length - 1]}`;
	return message;
}

export type SelectionItemKey = keyof SelectionItemMap;

export type SelectionItemEntity<T extends SelectionItemKey> =
	SelectionItemMap[T][0];

export type SelectionVariantName<T extends SelectionItemKey> =
	SelectionItemMap[T][1][number];

export type SelectionVariant<T extends SelectionItemKey> =
	| SelectionVariantName<T>
	| { type: SelectionVariantName<T>; id: string };

export interface SelectedItem<T extends SelectionItemKey> {
	type: T;
	key: string;
	entity: SelectionItemMap[T][0];
	variant: SelectionVariant<T>[];
}

export type AnySelectedItem = {
	[K in keyof SelectionItemMap]: SelectedItem<K>;
}[keyof SelectionItemMap];

export type TrackEntity = Track | EphemeralTrack;

export type SelectionEntity<T extends keyof SelectionItemMap> =
	SelectionItemMap[T][0];

export type AnySelectionEntity = {
	[K in keyof SelectionItemMap]: SelectionEntity<K>;
}[keyof SelectionItemMap];

export interface ListSelectionApi<
	T extends keyof SelectionItemMap = keyof SelectionItemMap,
> {
	isSelected: (entity: SelectionEntity<T>) => boolean;
	toggle: (entity: SelectionEntity<T>, bulk: boolean) => void;
}

type ListSelection = Record<string, AnySelectedItem>;

type SelectionCounts = Record<keyof SelectionItemMap, number> & {
	total: number;
};

interface LastSelection {
	listId: string;
	entity: SelectionEntity<keyof SelectionItemMap>;
	selected: boolean;
}

function countSelection(
	selected: Record<string, ListSelection>,
): SelectionCounts {
	const output: SelectionCounts = {
		album: 0,
		artist: 0,
		ephemeralTrack: 0,
		playlist: 0,
		track: 0,
		total: 0,
	};

	for (const list of Object.values(selected)) {
		for (const item of Object.values(list)) {
			output[item.type]++;
			output.total++;
		}
	}

	return output;
}

interface SelectionStore {
	selected: Record<string, ListSelection>;
	lastSelection: LastSelection | null;
	isSelected: (listId: string, key: string) => boolean;
	setSelected: (
		listId: string,
		items: AnySelectedItem[],
		isSelected: boolean,
	) => void;
	toggleSelection: (listId: string, item: AnySelectedItem) => void;
	setListSelection: (listId: string, items: AnySelectedItem[]) => void;
	clearList: (listId: string) => void;
	count: () => number;
	countSorted: () => SelectionCounts;
	clearAll: () => void;
	isInSelectionMode: () => boolean;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
	selected: {},
	lastSelection: null,
	isSelected: (listId, key) => !!get().selected[listId]?.[key],
	setSelected: (listId, items, isSelected) => {
		set(({ selected }) => {
			if (!items.length) {
				return {};
			}
			const record: ListSelection = { ...(selected[listId] ?? {}) };

			for (const item of items) {
				if (isSelected) {
					record[item.key] = item;
				} else {
					delete record[item.key];
				}
			}

			return {
				selected: { ...selected, [listId]: record },
				lastSelection: {
					listId,
					entity: items[items.length - 1].entity,
					selected: isSelected,
				},
			};
		});
	},
	toggleSelection: (listId, item) => {
		set(({ selected }) => {
			const record: ListSelection = { ...(selected[listId] ?? {}) };
			let add: boolean;

			if (item.key in record) {
				delete record[item.key];
				add = false;
			} else {
				record[item.key] = item;
				add = true;
			}

			return {
				selected: { ...selected, [listId]: record },
				lastSelection: {
					listId,
					entity: item.entity,
					selected: add,
				},
			};
		});
	},
	setListSelection: (listId, items) => {
		set(({ selected }) => {
			const record: ListSelection = {};
			for (const item of items) {
				record[item.key] = item;
			}
			return { selected: { ...selected, [listId]: record } };
		});
	},
	clearList: (listId) => {
		set(({ selected }) => {
			const record = { ...selected };
			delete record[listId];
			return { selected: record, lastSelection: null };
		});
	},
	count: () => {
		let total = 0;
		const lists = Object.values(get().selected);
		for (const list of lists) {
			total += Object.keys(list).length;
		}
		return total;
	},
	countSorted: () => countSelection(get().selected),
	clearAll: () => set({ selected: {} }),
	isInSelectionMode: () =>
		Object.values(get().selected).some((list) => Object.keys(list).length > 0),
}));

function selectionType(entity: AnySelectionEntity): keyof SelectionItemMap {
	if ("trackId" in entity) {
		return "dateAdded" in entity ? "track" : "ephemeralTrack";
	}

	if ("owner" in entity) {
		return "playlist";
	}

	if ("albums" in entity) {
		return "artist";
	}

	return "album";
}

export function selectionKey(entity: AnySelectionEntity): string | null {
	const type = selectionType(entity);

	switch (type) {
		case "track":
		case "ephemeralTrack":
			return `track:${serializeTrackKey(entity as TrackEntity)}`;
		case "playlist":
			return `playlist:${(entity as Playlist).uuid}`;
		case "album":
			return albumSavedKey(entity as Album);
		case "artist":
			return artistSavedKey(entity as Artist);
	}
}

export function selectionVariantInfo<T extends SelectionItemKey>(
	variant: SelectionVariant<T>,
): { name: SelectionVariantName<T>; id: string | null } {
	return typeof variant === "string"
		? { name: variant, id: null }
		: { name: variant.type, id: variant.id };
}

export function createSelectionItem(
	entity: AnySelectionEntity,
	variant: SelectionVariant<SelectionItemKey>[],
	keyOverride?: string,
): AnySelectedItem | null {
	const type = selectionType(entity);
	const key = keyOverride ?? selectionKey(entity);

	if (!key) {
		return null;
	}

	switch (type) {
		case "track":
			return {
				type,
				key,
				entity: entity as Track,
				variant: variant as SelectionVariant<"track">[],
			};
		case "ephemeralTrack":
			return {
				type,
				key,
				entity: entity as EphemeralTrack,
				variant: (variant as SelectionVariant<"ephemeralTrack">[]).filter(
					(value) => selectionVariantInfo(value).name === "queue",
				),
			};
		case "playlist":
			return {
				type,
				key,
				entity: entity as Playlist,
				variant: variant as SelectionVariant<"playlist">[],
			};
		case "album":
			return {
				type,
				key,
				entity: entity as Album,
				variant: variant as SelectionVariant<"album">[],
			};
		case "artist":
			return {
				type,
				key,
				entity: entity as Artist,
				variant: variant as SelectionVariant<"artist">[],
			};
	}
}

export function useListSelection<
	T extends keyof SelectionItemMap = keyof SelectionItemMap,
>(
	listId: string,
	variant: SelectionVariant<T>[],
	getBetweenEntities: (
		entity1: SelectionEntity<T>,
		entity2: SelectionEntity<T>,
	) =>
		| SelectionItemEntity<T>[]
		| Promise<SelectionItemEntity<T>[] | null>
		| null,
): ListSelectionApi<T> {
	const listSelection = useSelectionStore((state) => state.selected[listId]);
	const lastSelection = useSelectionStore((state) => state.lastSelection);
	const toggleSelection = useSelectionStore((state) => state.toggleSelection);
	const isSelected = useSelectionStore((state) => state.isSelected);
	const setSelected = useSelectionStore((state) => state.setSelected);
	const bulkPending = useRef(false);

	return useMemo(
		() => ({
			isSelected: (entity: SelectionEntity<T>) => {
				const key = selectionKey(entity as AnySelectionEntity);
				return !!key && !!listSelection?.[key];
			},
			toggle: (entity: SelectionEntity<T>, bulk) => {
				if (bulkPending.current) {
					return;
				}

				const item = createSelectionItem(entity, variant);
				if (!item) {
					return;
				}

				if (bulk && lastSelection?.listId == listId) {
					const key = selectionKey(entity);
					if (key) {
						const isSelecting = isSelected(listId, key);
						if (isSelecting != lastSelection.selected) {
							const applyRange = (
								betweenEntities: SelectionItemEntity<T>[] | null,
							) => {
								if (!betweenEntities) {
									return;
								}

								const items = betweenEntities.map((entity) =>
									createSelectionItem(entity, variant),
								);

								setSelected(
									listId,
									[
										...items.filter((v) => v && v.entity != entity),
										item,
									] as AnySelectedItem[],
									!isSelecting,
								);
							};

							const result = getBetweenEntities(lastSelection.entity, entity);

							if (result instanceof Promise) {
								bulkPending.current = true;
								result
									.then(applyRange)
									.catch((error) => {
										console.error("Failed to bulk select entities", error);
									})
									.finally(() => {
										bulkPending.current = false;
									});
							} else {
								applyRange(result);
							}
							return;
						}
					} else {
						console.error(
							"Unable to bulk select because unable to derive key",
							entity,
						);
					}
				}

				toggleSelection(listId, item);
			},
		}),
		[
			listId,
			listSelection,
			toggleSelection,
			variant,
			lastSelection,
			getBetweenEntities,
			isSelected,
			setSelected,
		],
	);
}

export function useSelectionCount() {
	const selected = useSelectionStore((state) => state.selected);
	return useMemo(() => countSelection(selected), [selected]);
}

export function useSelectionMode() {
	return useSelectionStore((state) =>
		Object.values(state.selected).some((list) => Object.keys(list).length > 0),
	);
}
