"use client";

import { useTranslation } from "@/context/language.context";
import { useScrollParentContext } from "@/context/scroll-parent.context";
import {
	BasicAttributeColumn,
	SpecialAttributeColumnFormatter,
	useTrackColumns,
} from "@/context/track-columns.context";
import { useRankedAttributes } from "@/hook/ranked-attributes.hook";
import { useRightClick } from "@/hook/right-click.hook";
import { ReactNode, useMemo, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import styles from "./track-list.module.scss";
import { Virtuoso } from "react-virtuoso";
import { TrackListModal } from "@/modal/track-list/track-list.modal";
import { EphemeralTrack, Track, useGetAllLibraries } from "@api";
import { formatDate } from "@/lib/util";
import { getAttribute } from "@/lib/attribute.util";

export interface BaseTrackListSpecialColumn<T> {
	id: string;
	formatter: (entry: T, index: number) => string;
	url?: (entry: T, index: number) => string | null;
}

interface BaseTrackListProps<T = Track | EphemeralTrack> {
	totalCount: number;
	itemContent: (
		index: number,
		columns: (BasicAttributeColumn | SpecialAttributeColumnFormatter<T>)[],
	) => ReactNode;
	toTrack: (index: number) => Track | EphemeralTrack | null;
	specialColumns?: BaseTrackListSpecialColumn<T>[];
}

const MAIN_MIN_WIDTH = 200;
const COLUMN_MIN_WIDTH = 50;

export function BaseTrackList<T>({
	totalCount,
	itemContent,
	specialColumns,
	toTrack,
}: BaseTrackListProps<T>) {
	const { t } = useTranslation();
	const { columns, setColumns } = useTrackColumns();
	const { ref, width } = useResizeDetector();
	const { scrollParent } = useScrollParentContext();
	const [columnModalOpen, setColumnModalOpen] = useState(false);
	const rankedAttributes = useRankedAttributes("track");
	const librariesResponse = useGetAllLibraries({
		query: {
			enabled: true,
		},
	});
	const libraries =
		(librariesResponse.isFetched &&
			librariesResponse.data?.status == 200 &&
			librariesResponse.data.data) ||
		[];

	const allSpecialColumns = useMemo(() => {
		const columns = [...(specialColumns ?? [])];

		columns.push({
			id: "track_plugin_id",
			formatter: (_entry, index) => {
				const track = toTrack(index);
				if (track) {
					return t(`plugin.${track.pluginId}.name`, track.pluginId);
				}
				return "";
			},
		});

		columns.push({
			id: "track_library_id",
			formatter: (_entry, index) => {
				const track = toTrack(index);
				if (track) {
					const library = libraries.find(
						(library) =>
							library.pluginId == track.pluginId &&
							library.id == track.libraryId,
					);
					if (library) {
						return library.name;
					}

					return track.libraryId;
				}
				return "";
			},
			url: (_entry, index) => {
				const track = toTrack(index);
				if (track) {
					return `/library/${track.pluginId}/${track.libraryId}`;
				}
				return null;
			},
		});

		columns.push({
			id: "track_date_added",
			formatter: (_entry, index) => {
				const track = toTrack(index);
				if (track && "dateAdded" in track) {
					return formatDate(new Date(track.dateAdded));
				}
				return "";
			},
		});

		columns.push({
			id: "track_album",
			formatter: (_entry, index) => {
				const track = toTrack(index);
				if (track) {
					if ("albums" in track) {
						const album = track.albums?.[0];
						if (album) {
							const title = getAttribute(
								album.attributes,
								"title",
								"string",
								true,
							);
							if (title) {
								return title;
							}
						}
					}

					const albumTitle = getAttribute(
						track.attributes,
						"album",
						"string",
						true,
					);
					if (albumTitle) {
						return albumTitle;
					}
				}

				return "";
			},
			url: (_entry, index) => {
				const track = toTrack(index);
				if (track && "albums" in track) {
					const album = track.albums?.[0];
					if (album) {
						return `/album/${album.uuid}`;
					}
				}
				return null;
			},
		});

		return columns;
	}, [specialColumns, libraries]);

	const rightClick = useRightClick(() => [
		{
			key: "options",
			languageKey: "contextmenu.tracklist.change-columns",
			onClick: () => setColumnModalOpen(true),
		},
	]);

	const boundColumns = useMemo<
		(BasicAttributeColumn | SpecialAttributeColumnFormatter<T>)[]
	>(() => {
		if (!width) return [];

		const newColumns: (
			| BasicAttributeColumn
			| SpecialAttributeColumnFormatter<T>
		)[] = columns
			.filter((column) => column.type != "basic" || column.attribute != "album")
			.map((column) => {
				if (column.type == "special") {
					const formatter = allSpecialColumns?.find((c) => c.id == column.id);
					if (formatter) {
						const special: SpecialAttributeColumnFormatter<T> = {
							type: "special",
							id: column.id,
							width: column.width,
							formatter: formatter.formatter,
							url: formatter.url,
						};
						return special;
					}
					return null;
				}

				return column;
			})
			.filter((c) => !!c);

		const totalMinColumnsWidth = newColumns.length * COLUMN_MIN_WIDTH;
		const maxAvailableColumnSpace = width - MAIN_MIN_WIDTH;

		if (maxAvailableColumnSpace < totalMinColumnsWidth) {
			return newColumns.map((col) => ({ ...col, width: COLUMN_MIN_WIDTH }));
		}

		const totalRequestedWidth = newColumns.reduce(
			(sum, col) => sum + col.width,
			0,
		);

		if (totalRequestedWidth <= maxAvailableColumnSpace) {
			return newColumns;
		}

		const flexibleSpaceAvailable =
			maxAvailableColumnSpace - totalMinColumnsWidth;
		const totalFlexibleSpaceRequested =
			totalRequestedWidth - totalMinColumnsWidth;

		if (totalFlexibleSpaceRequested <= 0) {
			return newColumns.map((col) => ({ ...col, width: COLUMN_MIN_WIDTH }));
		}

		return newColumns.map((column) => {
			const columnFlexibleRequested = column.width - COLUMN_MIN_WIDTH;
			const scaledFlexibleSpace =
				columnFlexibleRequested *
				(flexibleSpaceAvailable / totalFlexibleSpaceRequested);

			return {
				...column,
				width: COLUMN_MIN_WIDTH + scaledFlexibleSpace,
			};
		});
	}, [columns, width, allSpecialColumns]);

	const namedColumns = useMemo(() => {
		return boundColumns.map((column) => {
			if (column.type == "basic") {
				return {
					column,
					attribute: (rankedAttributes ?? []).find(
						(attribute) =>
							attribute.key == column.attribute &&
							attribute.type == column.attributeType,
					),
				};
			}

			return {
				column,
			};
		});
	}, [boundColumns, rankedAttributes]);

	const startDrag = (e: MouseEvent, index: number) => {
		const mover = e.currentTarget as HTMLSpanElement | null;
		if (!mover || !width) return;

		const startX = e.clientX;
		const currentVisibleWidths = boundColumns.map((c) => c.width);
		const initialWidth = currentVisibleWidths[index];
		const maxAvailableColumnSpace = width - MAIN_MIN_WIDTH;

		const otherColumnsWidth = currentVisibleWidths.reduce(
			(sum, w, idx) => sum + (idx === index ? 0 : w),
			0,
		);

		const maxPossibleWidth = maxAvailableColumnSpace - otherColumnsWidth;

		const moveListener = (e: MouseEvent) => {
			const offset = e.clientX - startX;
			let newWidth = initialWidth - offset;
			newWidth = Math.max(
				COLUMN_MIN_WIDTH,
				Math.min(newWidth, maxPossibleWidth),
			);

			setColumns((prevColumns) =>
				prevColumns.map((column, columnIndex) => {
					if (columnIndex === index) {
						return { ...column, width: newWidth };
					}
					return { ...column, width: currentVisibleWidths[columnIndex] };
				}),
			);
		};

		window.addEventListener("mousemove", moveListener);
		window.addEventListener(
			"mouseup",
			() => window.removeEventListener("mousemove", moveListener),
			{ once: true },
		);
	};

	return (
		<>
			<div ref={ref}>
				<div className={styles.columnHeadingContainer} {...rightClick}>
					<div className={styles.columnHeadingExpander} />
					{namedColumns.map(({ column, attribute }, index) => (
						<div
							key={index}
							style={{ width: `${column.width}px` }}
							className={styles.columnHeading}
						>
							<span className={styles.columnName}>
								{column.type == "special"
									? t(`attribute.${column.id}.name`, column.id)
									: attribute
										? t(
												`plugin.${attribute.pluginId}.attribute.track.${attribute.sourceId}.${attribute.key}.name`,
												attribute.key,
											)
										: column.attribute}
							</span>
							<span
								className={styles.mover}
								onMouseDown={(e) => startDrag(e as any, index)}
							/>
						</div>
					))}
				</div>
				<Virtuoso
					className={styles.trackList}
					customScrollParent={scrollParent}
					totalCount={totalCount}
					itemContent={(index) => itemContent(index, boundColumns)}
				/>
			</div>
			<TrackListModal
				open={columnModalOpen}
				onClose={() => setColumnModalOpen(false)}
				specialColumns={allSpecialColumns}
			/>
		</>
	);
}
