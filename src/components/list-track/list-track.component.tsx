"use client";

import {
	AttributeMap,
	BooleanAttribute,
	DecimalAttribute,
	EphemeralTrack,
	IntegerAttribute,
	StringAttribute,
	Track,
} from "@api";
import styles from "./list-track.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import {
	IconExternalLinkFilled,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
} from "@tabler/icons-react";
import { useRightClick } from "@/hook/right-click.hook";
import { TrackInfoModal } from "@/components/track-info-modal/track-info-modal";
import { useMemo, useState } from "react";
import { useAttribute } from "@/hook/attribute.hook";
import Link from "next/link";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { usePlayerStore } from "@/store/player.store";
import { TrackArtists } from "@/components/track-artists/track-artists.component";
import { cc } from "@/lib/util";
import {
	BasicAttributeColumn,
	SpecialAttributeColumnValue,
} from "@/context/track-columns.context";
import { useRawAttribute } from "@/hook/raw-attribute.hook";
import { AttributeUnion } from "@/lib/attribute.util";
import { serializeTrackKey } from "@/lib/track-batcher.util";
import { useQueueActions } from "@/hook/queue-actions.hook";
import { OptionalLink } from "@/components/optional-link/optional-link.component";
import { useTrackContextMenu } from "@/hook/track-context-menu.hook";
import { useIsTruncated } from "@/hook/is-truncated.hook";
import { SingleAttributeModal } from "@/modal/single-attribute/single-attribute.modal";

interface Props {
	track: Track | EphemeralTrack;
	columns?: (BasicAttributeColumn | SpecialAttributeColumnValue)[];
	number?: number;
	noArt?: boolean;
	inPlaylist?: string;
}

export function ListTrack({
	track,
	number,
	columns,
	noArt,
	inPlaylist,
}: Props) {
	const [infoOpen, setInfoOpen] = useState(false);

	const { queue, currentIndex, isPlaying, toggle } = usePlayerStore();
	const { playNow } = useQueueActions();
	const nowPlaying = queue[currentIndex];
	const [openAttribute, setOpenAttribute] = useState<
		| [
				(
					| StringAttribute
					| BooleanAttribute
					| IntegerAttribute
					| DecimalAttribute
				),
				string,
		  ]
		| null
	>(null);

	const isPlayingThis = useMemo(
		() => nowPlaying == serializeTrackKey(track),
		[nowPlaying, track],
	);

	const title =
		useAttribute(track.attributes, "title", "string") ?? track.title;
	const image = useRawAttribute(track.attributes, "front", "buffer");

	const { menuEntries, modal } = useTrackContextMenu(track, { inPlaylist });
	const rightClick = useRightClick(menuEntries);

	return (
		<>
			<div
				className={cc(styles.container, isPlayingThis && styles.active)}
				{...rightClick}
			>
				<div className={styles.main}>
					<div className={styles.trackNumberContainer}>
						<span className={styles.trackNumber}>{number}</span>
						<div className={styles.playButton}>
							<IconButton
								icon={
									isPlayingThis && isPlaying
										? IconPlayerPauseFilled
										: IconPlayerPlayFilled
								}
								iconSource="tabler"
								style={isPlayingThis ? "simple" : "background"}
								onClick={() => {
									if (isPlayingThis) {
										toggle();
									} else {
										playNow(track);
									}
								}}
							/>
						</div>
					</div>
					{!noArt && (
						<Link
							className={styles.imageContainer}
							href={`/track/${track.pluginId}/${track.libraryId}/${track.trackId}`}
						>
							<ResourceImage
								resource={image}
								className={styles.cover}
								fallbackSrc="/no_album_art.jpg"
								width={42}
								height={42}
							/>
						</Link>
					)}

					<div className={styles.info}>
						<Link
							className={styles.title}
							href={`/track/${track.pluginId}/${track.libraryId}/${track.trackId}`}
						>
							{title}
						</Link>

						{"artists" in track && !!track.artists && (
							<span className={styles.artist}>
								<TrackArtists track={track} />
							</span>
						)}
						{/* {"albums" in track && !!track.albums && (
							<span className={styles.album}>
								<TrackAlbum
									album={track.albums?.[0] ?? null}
									fallback={album}
								/>
							</span>
						)} */}
					</div>
				</div>
				{columns?.map((column, index) => (
					<div
						className={styles.column}
						style={{
							width: `${column.width}px`,
						}}
						key={index}
					>
						{column.type == "special" ? (
							<OptionalLink
								href={column.url}
								className={cc(!!column.url && styles.columnLink)}
							>
								{column.formatted}
							</OptionalLink>
						) : column.attributeType == "buffer" ? (
							<BufferColumn
								column={column as BasicAttributeColumn<"buffer">}
								attributes={track.attributes}
							/>
						) : (
							<ValueColumn
								column={
									column as BasicAttributeColumn<
										Exclude<AttributeUnion["type"], "buffer">
									>
								}
								attributes={track.attributes}
								openAttribute={(key) => {
									const attribute = track.attributes?.[key];
									if (attribute && attribute.type != "buffer") {
										setOpenAttribute([attribute, key]);
									}
								}}
							/>
						)}
					</div>
				))}
			</div>
			{"identities" in track && (
				<TrackInfoModal
					track={track}
					open={infoOpen}
					onClose={() => setInfoOpen(false)}
				/>
			)}
			<SingleAttributeModal
				attribute={openAttribute?.[0] ?? null}
				attributeKey={openAttribute?.[1] ?? null}
				entityType="track"
				onClose={() => setOpenAttribute(null)}
			/>
			{modal}
		</>
	);
}

interface BufferColumnProps {
	column: BasicAttributeColumn<"buffer">;
	attributes: AttributeMap | null;
}

function BufferColumn({ column, attributes }: BufferColumnProps) {
	const attribute = useRawAttribute(
		attributes,
		column.attribute,
		column.attributeType,
	);

	if (!attribute) {
		return null;
	}

	return (
		<IconButton
			icon={IconExternalLinkFilled}
			iconSource="tabler"
			size="sm"
			style="ghost"
			href={attribute.url}
			target="_blank"
			className={styles.bufferLink}
			iconClassName={styles.bufferLinkIcon}
		/>
	);
}

interface ValueColumnProps {
	column: BasicAttributeColumn<Exclude<AttributeUnion["type"], "buffer">>;
	attributes: AttributeMap | null;
	openAttribute: (key: string) => void;
}

function ValueColumn({ column, attributes, openAttribute }: ValueColumnProps) {
	const attribute = useAttribute(
		attributes,
		column.attribute,
		column.attributeType,
	);

	return (
		<span
			className={cc(styles.columnValue)}
			onClick={() => openAttribute(column.attribute)}
		>
			{attribute}
		</span>
	);
}
