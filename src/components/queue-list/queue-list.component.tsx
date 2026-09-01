"use client";

import { QueueTrack } from "@/components/queue-track/queue-track.component";
import { QueueTrackSkeleton } from "@/components/queue-track/queue-track-skeleton.component";
import { useScrollParentContext } from "@/context/scroll-parent.context";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { useTrack } from "@/hook/track.hook";
import { usePlayerStore } from "@/store/player.store";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import styles from "./queue-list.module.scss";

export function QueueList() {
	const queue = usePlayerStore((state) => state.queue);
	const { move } = useQueueActions();
	const { scrollParent } = useScrollParentContext();
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveIndex(parseInt(event.active.id as string));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveIndex(null);
		if (!over || active.id === over.id) {
			return;
		}
		move(parseInt(active.id as string), parseInt(over.id as string));
	};

	const handleDragCancel = () => {
		setActiveIndex(null);
	};

	// All indices as string IDs — stable for the duration of any single drag
	const items = queue.map((_, i) => String(i));

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<SortableContext items={items} strategy={verticalListSortingStrategy}>
				<Virtuoso
					className={styles.container}
					customScrollParent={scrollParent}
					totalCount={queue.length}
					itemContent={(index) => (
						<SortableRow
							key={queue[index]}
							trackKey={queue[index]}
							index={index}
							isDragging={index === activeIndex}
						/>
					)}
				/>
			</SortableContext>
			<DragOverlay modifiers={[restrictToVerticalAxis]} dropAnimation={null}>
				{activeIndex !== null && queue[activeIndex] ? (
					<OverlayRow trackKey={queue[activeIndex]} queueIndex={activeIndex} />
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

interface SortableRowProps {
	trackKey: string;
	index: number;
	isDragging: boolean;
}

function SortableRow({ trackKey, index, isDragging }: SortableRowProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: String(index) });

	const trackResult = useTrack(trackKey);

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			{trackResult.data ? (
				<QueueTrack
					track={trackResult.data}
					queueIndex={index}
					dragHandleProps={{ ...attributes, ...listeners }}
				/>
			) : (
				<QueueTrackSkeleton queueIndex={index} />
			)}
		</div>
	);
}

interface OverlayRowProps {
	trackKey: string;
	queueIndex: number;
}

function OverlayRow({ trackKey, queueIndex }: OverlayRowProps) {
	const trackResult = useTrack(trackKey);
	if (!trackResult.data) {
		return null;
	}
	return (
		<div className={styles.dragOverlay}>
			<QueueTrack track={trackResult.data} queueIndex={queueIndex} />
		</div>
	);
}
