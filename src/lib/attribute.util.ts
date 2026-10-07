import {
	BooleanAttribute,
	DecimalAttribute,
	IntegerAttribute,
	StringAttribute,
	AttributeMap,
	BufferAttribute,
	Resource,
} from "@api";

export type AttributeUnion =
	| BooleanAttribute
	| IntegerAttribute
	| DecimalAttribute
	| StringAttribute
	| BufferAttribute;

type AttributeByType<T extends AttributeUnion["type"]> = Extract<
	AttributeUnion,
	{ type: T }
>;
export type SinglePersistentAttribute<T extends AttributeUnion["type"]> = {
	type: T;
	value: AttributeByType<T>["values"][number];
};

export type AttributeValueByType<T extends AttributeUnion["type"]> =
	AttributeByType<T>["values"][number];

// 1. Formatted + Multiple -> string[]
export function getAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	formattedValue: true,
	multiple: true,
): (T extends "buffer" ? Resource : string)[] | null;

// 2. Formatted + Single -> string
export function getAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	formattedValue: true,
	multiple?: false,
): (T extends "buffer" ? Resource : string) | null;

// 3. Raw + Multiple -> T[]
export function getAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	formattedValue: false,
	multiple: true,
): AttributeValueByType<T>[] | null;

// 4. Raw + Single -> T
export function getAttribute<T extends AttributeUnion["type"]>(
	attributes: AttributeMap | null,
	key: string,
	type: T,
	formattedValue: false,
	multiple?: false,
): AttributeValueByType<T> | null;

// 7. No Type (or null) -> Returns full AttributeUnion object
export function getAttribute(
	attributes: AttributeMap | null,
	key: string,
	type?: null,
	formattedValue?: boolean,
	multiple?: boolean,
): AttributeUnion | null;

export function getAttribute(
	attributes: AttributeMap | null,
	key: string,
	type?: AttributeUnion["type"] | null,
	formattedValue?: boolean,
	multiple?: boolean,
): any {
	if (!attributes) {
		return null;
	}

	const attribute = attributes[key] as AttributeUnion | undefined;
	if (!attribute || !attribute.values.length) {
		return null;
	}

	if (type) {
		if (attribute.type !== type) {
			return null;
		}

		// Dynamically assign what the arguments mean based on the type
		// const isBuffer = type === "buffer";
		// const formattedValue = isBuffer ? false : !!arg4;

		// Formatted logic (safely bypassed if it's a buffer)
		if (formattedValue) {
			// @ts-ignore - Buffer union won't have .formatted, which is expected
			const hasFormatted =
				attribute.formatted && attribute.formatted.length > 0;

			if (multiple) {
				return hasFormatted
					? (attribute as any).formatted
					: attribute.values.map(String);
			}

			return hasFormatted
				? (attribute as any).formatted![0]
				: String(attribute.values[0]);
		}

		// Raw value logic
		if (multiple) {
			return attribute.values;
		}

		return attribute.values[0];
	}

	// If no type is provided, return the whole attribute object
	return attribute;
}
