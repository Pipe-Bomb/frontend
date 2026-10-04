"use client";

import { AttributeUnion } from "@/lib/attribute.util";
import {
	createContext,
	Dispatch,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export interface BasicAttributeColumn<
	T extends AttributeUnion["type"] = AttributeUnion["type"],
> {
	type: "basic";
	attribute: string;
	attributeType: T;
	width: number;
}

export interface SpecialAttributeColumn {
	type: "special";
	id: string;
	width: number;
}

export interface SpecialAttributeColumnFormatter<
	T,
> extends SpecialAttributeColumn {
	formatter: (entry: T, index: number) => string | ReactNode;
	url?: (entry: T, index: number) => string | null;
}

export interface SpecialAttributeColumnValue extends SpecialAttributeColumn {
	formatted: ReactNode;
	url: string | null;
}

export type AttributeColumn = BasicAttributeColumn | SpecialAttributeColumn;

interface Props {
	children: ReactNode;
	initialColumns: AttributeColumn[];
}

interface TrackColumnsPayload {
	columns: AttributeColumn[];
	setColumns: Dispatch<SetStateAction<AttributeColumn[]>>;
}

const MIN_COLUMN_WIDTH = 50;

const TrackColumnsContext = createContext<TrackColumnsPayload | null>(null);

export function TrackColumnsProvider({ children, initialColumns }: Props) {
	const [columns, setRawColumns] = useState(initialColumns);

	const setColumns = useCallback<Dispatch<SetStateAction<AttributeColumn[]>>>(
		(action) => {
			function transform(column: AttributeColumn): AttributeColumn {
				return {
					...column,
					width: Math.max(MIN_COLUMN_WIDTH, column.width),
				};
			}

			if (typeof action == "function") {
				setRawColumns((previous) => action(previous).map(transform));
			} else {
				setRawColumns(action.map(transform));
			}
		},
		[],
	);

	useEffect(() => {
		document.cookie = `track_columns=${JSON.stringify(columns)}; path=/; max-age=31536000; SameSite=Lax`;
	}, [columns]);

	return (
		<TrackColumnsContext.Provider value={{ columns, setColumns }}>
			{children}
		</TrackColumnsContext.Provider>
	);
}

export function useTrackColumns() {
	const context = useContext(TrackColumnsContext);
	if (!context)
		throw new Error("useTrackColumns must be used within TrackColumnsProvider");

	return context;
}
