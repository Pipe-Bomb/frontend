import {
	AttributeUnion,
	AttributeValueByType,
	getAttribute,
} from "@/lib/attribute.util";
import { AttributeMap } from "@api";
import { useMemo } from "react";

export function useAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	multiple?: false,
): AttributeValueByType<T> | null;

export function useAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	multiple: true,
): AttributeValueByType<T>[] | null;

export function useAttribute(
	attributes: AttributeMap | null,
	key: string,
	type?: null,
	multiple?: boolean,
): AttributeUnion | null;

export function useAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type?: T | null,
	multiple?: boolean,
): any {
	return useMemo(
		() => getAttribute(attributes, key, type as any, false, multiple as any),
		[attributes, key, type, multiple],
	);
}
