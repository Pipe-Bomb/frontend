"use client";

import { useGetAllAttributeSources } from "@/api";
import { Modal } from "@/components/modal/modal.component";
import styles from "./track-list.module.scss";
import { Spinner } from "@/components/spinner/spinner.component";
import { useMemo } from "react";
import { cc, compare } from "@/lib/util";
import { useTranslation } from "@/context/language.context";
import { useTrackColumns } from "@/context/track-columns.context";
import { useRankedAttributes } from "@/hook/ranked-attributes.hook";
import { Checkbox } from "@/components/checkbox/checkbox.component";

interface Props extends InnerProps {
	open: boolean;
	onClose?: () => void;
}

export function TrackListModal({ open, onClose, specialColumns }: Props) {
	return (
		<Modal open={open} onClose={onClose} title="Select Track Columns">
			<Inner specialColumns={specialColumns} />
		</Modal>
	);
}

export interface TrackListSpecialColumn {
	id: string;
}

interface InnerProps {
	specialColumns?: TrackListSpecialColumn[];
}

function Inner({ specialColumns }: InnerProps) {
	const { t } = useTranslation();
	const { columns, setColumns } = useTrackColumns();

	const unorderedAttributes = useRankedAttributes("track");
	const rankedAttributes = useMemo(() => {
		return (unorderedAttributes ?? [])
			.filter((attribute) => attribute.key != "album")
			.map((attribute) => ({
				attribute,
				name: t(
					`plugin.${attribute.pluginId}.attribute.track.${attribute.sourceId}.${attribute.key}.name`,
					attribute.key,
				),
			}))
			.sort((a, b) => compare(a.name, b.name));
	}, [unorderedAttributes, t]);

	const sourcesQuery = useGetAllAttributeSources({
		query: {
			enabled: true,
		},
	});

	if (sourcesQuery.isPending || !sourcesQuery.data) {
		return (
			<div className={styles.loading}>
				<Spinner position="expand" />
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{!!specialColumns?.length && (
				<div className={styles.list}>
					{specialColumns.map((column) => {
						const active = columns.some(
							(c) => c.type == "special" && c.id == column.id,
						);

						return (
							<button
								key={column.id}
								className={styles.attributeContainer}
								onClick={() => {
									if (active) {
										setColumns(
											columns.filter(
												(c) => c.type != "special" || c.id != column.id,
											),
										);
									} else {
										setColumns([
											{
												type: "special",
												id: column.id,
												width: 150,
											},
											...columns,
										]);
									}
								}}
							>
								<span className={styles.attributeName}>
									{t(`attribute.${column.id}.name`)}
								</span>
								<Checkbox
									checked={active}
									onChange={() => {
										if (active) {
											setColumns(
												columns.filter(
													(c) => c.type != "special" || c.id != column.id,
												),
											);
										} else {
											setColumns([
												{
													type: "special",
													id: column.id,
													width: 150,
												},
												...columns,
											]);
										}
									}}
								/>
							</button>
						);
					})}
				</div>
			)}
			<div className={styles.list}>
				{rankedAttributes.map(({ attribute, name }) => {
					const active = columns.some(
						(column) =>
							column.type == "basic" &&
							column.attribute == attribute.key &&
							column.attributeType == attribute.type,
					);

					return (
						<button
							key={attribute.key}
							className={styles.attributeContainer}
							onClick={() => {
								if (active) {
									setColumns(
										columns.filter(
											(column) =>
												column.type != "basic" ||
												column.attribute != attribute.key ||
												column.attributeType != attribute.type,
										),
									);
								} else {
									setColumns([
										{
											type: "basic",
											attribute: attribute.key,
											attributeType: attribute.type,
											width: 150,
										},
										...columns,
									]);
								}
							}}
						>
							<span className={styles.attributeName}>{name}</span>
							<Checkbox
								checked={active}
								onChange={() => {
									if (active) {
										setColumns(
											columns.filter(
												(column) =>
													column.type != "basic" ||
													column.attribute != attribute.key ||
													column.attributeType != attribute.type,
											),
										);
									} else {
										setColumns([
											{
												type: "basic",
												attribute: attribute.key,
												attributeType: attribute.type,
												width: 150,
											},
											...columns,
										]);
									}
								}}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
