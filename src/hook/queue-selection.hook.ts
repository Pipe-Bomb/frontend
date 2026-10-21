"use client";

import { fetchTrackBatched } from "@/lib/track-batcher.util";
import { useNotificationStore } from "@/store/notification.store";
import {
	AnySelectedItem,
	createSelectionItem,
	selectionVariantInfo,
	useSelectionStore,
} from "@/store/selection.store";
import { EphemeralTrack, Track } from "@api";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type QueueTrack = Track | EphemeralTrack;

function mapQueueIndices(previous: string[], next: string[]) {
	const positions = new Map<string, number[]>();
	next.forEach((key, index) => {
		const list = positions.get(key);
		if (list) {
			list.push(index);
		} else {
			positions.set(key, [index]);
		}
	});

	const occurrences = new Map<string, number>();
	const mapping = new Map<number, number>();

	previous.forEach((key, index) => {
		const occurrence = occurrences.get(key) ?? 0;
		occurrences.set(key, occurrence + 1);

		const newIndex = positions.get(key)?.[occurrence];
		if (newIndex !== undefined) {
			mapping.set(index, newIndex);
		}
	});

	return mapping;
}

export function useQueueSelection(listId: string, queue: string[]) {
	const queryClient = useQueryClient();
	const listSelection = useSelectionStore((state) => state.selected[listId]);
	const toggleSelection = useSelectionStore((state) => state.toggleSelection);
	const setSelected = useSelectionStore((state) => state.setSelected);
	const setListSelection = useSelectionStore((state) => state.setListSelection);
	const clearList = useSelectionStore((state) => state.clearList);

	const lastIndex = useRef<number | null>(null);
	const lastSelected = useRef(false);
	const pending = useRef(false);
	const mounted = useRef(true);
	const queueRef = useRef(queue);
	const previousQueue = useRef(queue);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		return () => clearList(listId);
	}, [clearList, listId]);

	useEffect(() => {
		queueRef.current = queue;
		const previous = previousQueue.current;
		previousQueue.current = queue;

		if (previous === queue) {
			return;
		}

		const mapping = mapQueueIndices(previous, queue);
		const items = Object.values(listSelection ?? {});

		if (items.length) {
			const next = items.flatMap((item) => {
				const newIndex = mapping.get(Number(item.key));
				if (newIndex === undefined) {
					return [];
				}

				const key = String(newIndex);
				const variant = item.variant.map((value) =>
					selectionVariantInfo(value).name === "queue"
						? { type: "queue" as const, id: key }
						: value,
				);

				return [{ ...item, key, variant } as AnySelectedItem];
			});

			setListSelection(listId, next);
		}

		lastIndex.current =
			lastIndex.current === null
				? null
				: (mapping.get(lastIndex.current) ?? null);

		if (lastIndex.current === null) {
			lastSelected.current = false;
		}
	}, [queue, listId, listSelection, setListSelection]);

	const isSelected = (index: number) => !!listSelection?.[String(index)];

	const buildItems = (start: number, end: number) => {
		const items: AnySelectedItem[] = [];

		for (let index = start; index <= end; index++) {
			const trackKey = queue[index];
			if (!trackKey) {
				return null;
			}

			const track = queryClient.getQueryData<QueueTrack | null>([
				"track",
				trackKey,
			]);

			if (!track) {
				return null;
			}

			const key = String(index);
			const item = createSelectionItem(
				track,
				[{ type: "queue", id: key }],
				key,
			);

			if (!item) {
				return null;
			}

			items.push(item);
		}

		return items;
	};

	const loadRange = (start: number, end: number) => {
		const missingKeys = new Set<string>();

		for (let index = start; index <= end; index++) {
			const trackKey = queue[index];
			if (!trackKey) {
				return null;
			}
			if (queryClient.getQueryData(["track", trackKey]) === undefined) {
				missingKeys.add(trackKey);
			}
		}

		if (!missingKeys.size) {
			return buildItems(start, end);
		}

		const snapshot = queue;

		return (async () => {
			const store = useNotificationStore.getState();
			const notificationId = store.createNotification(
				"Loading tracks for selection…",
				{ timeout: null, isLoading: true },
			);

			try {
				await Promise.all(
					[...missingKeys].map((trackKey) =>
						queryClient.fetchQuery({
							queryKey: ["track", trackKey],
							queryFn: () => fetchTrackBatched(trackKey),
							staleTime: 10 * 60 * 1000,
							gcTime: 30 * 60 * 1000,
						}),
					),
				);

				if (!mounted.current || queueRef.current !== snapshot) {
					store.updateNotification(notificationId, {
						message: "Bulk selection cancelled",
						isLoading: false,
					});
					store.resetNotificationTimeout(notificationId);
					return null;
				}

				const items = buildItems(start, end);
				if (!items) {
					store.updateNotification(notificationId, {
						message: "Failed to load tracks for selection",
						isLoading: false,
					});
					store.resetNotificationTimeout(notificationId);
					return null;
				}

				store.updateNotification(notificationId, {
					message: `Selected ${items.length} tracks`,
					isLoading: false,
				});
				store.resetNotificationTimeout(notificationId);
				return items;
			} catch (error) {
				console.error("Failed to load tracks for queue selection", error);
				store.updateNotification(notificationId, {
					message: "Failed to load tracks for selection",
					isLoading: false,
				});
				store.resetNotificationTimeout(notificationId);
				return null;
			}
		})();
	};

	const toggle = (index: number, track: QueueTrack, bulk: boolean) => {
		if (pending.current) {
			return;
		}

		const key = String(index);
		const wasSelected = !!listSelection?.[key];

		if (
			bulk &&
			lastIndex.current !== null &&
			wasSelected !== lastSelected.current
		) {
			const start = Math.min(lastIndex.current, index);
			const end = Math.max(lastIndex.current, index);
			const nextSelected = !wasSelected;

			const apply = (items: AnySelectedItem[] | null) => {
				if (!items) {
					return;
				}

				setSelected(listId, items, nextSelected);
				lastIndex.current = index;
				lastSelected.current = nextSelected;
			};

			const items = loadRange(start, end);

			if (items instanceof Promise) {
				pending.current = true;
				items
					.then(apply)
					.catch((error) => {
						console.error("Failed to bulk select queue tracks", error);
					})
					.finally(() => {
						pending.current = false;
					});
			} else {
				apply(items);
			}
			return;
		}

		const item = createSelectionItem(track, [{ type: "queue", id: key }], key);

		if (!item) {
			return;
		}

		toggleSelection(listId, item);
		lastIndex.current = index;
		lastSelected.current = !wasSelected;
	};

	const clear = () => {
		clearList(listId);
		lastIndex.current = null;
		lastSelected.current = false;
	};

	return { isSelected, toggle, clear };
}
