"use client";

import { HorizontalScroller } from "@/components/horizontal-scroller/horizontal-scroller.component";
import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import {
	SelectionItemEntity,
	SelectionItemKey,
	SelectionVariant,
	useListSelection,
	useSelectionStore,
} from "@/store/selection.store";
import { ReactNode, useEffect, useId } from "react";

interface Props<T extends SelectionItemKey> {
	entities: SelectionItemEntity<T>[];
	horizontalScrollerId: HorizontalScrollerId;
	heading: string;
	variant?: SelectionVariant<T>[];
	itemCreate: (
		entity: SelectionItemEntity<T>,
		index: number,
		selected: boolean,
		onToggleSelected: (bulk: boolean) => void,
	) => ReactNode;
}

export function SelectableHorizontalScroller<T extends SelectionItemKey>({
	entities,
	heading,
	horizontalScrollerId,
	variant,
	itemCreate,
}: Props<T>) {
	const listId = useId();
	const selection = useListSelection<T>(
		listId,
		variant ?? [],
		(entity1, entity2) => {
			let index1 = entities.indexOf(entity1);
			let index2 = entities.indexOf(entity2);
			if (index1 < 0 || index2 < 0) {
				return [];
			}

			if (index2 < index1) {
				[index1, index2] = [index2, index1];
			}

			return entities.slice(index1, index2 + 1);
		},
	);
	const clearList = useSelectionStore((state) => state.clearList);

	useEffect(() => {
		return () => clearList(listId);
	}, [clearList, listId]);

	return (
		<HorizontalScroller heading={heading} id={horizontalScrollerId}>
			{entities.map((entity, index) =>
				itemCreate(entity, index, selection.isSelected(entity), (bulk) =>
					selection.toggle(entity, bulk),
				),
			)}
		</HorizontalScroller>
	);
}
