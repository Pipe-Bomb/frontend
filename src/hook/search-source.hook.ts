import { useGetSearchSource } from "@/api";

interface EntityContext {
	tracks?: boolean;
	albums?: boolean;
	artists?: boolean;
}

export function useSearchSource(entities?: EntityContext) {
	const { data } = useGetSearchSource(entities, {
		query: { staleTime: 30_000 },
	});

	const source = data?.status === 200 ? data.data : null;

	return {
		source,
		pluginId: source?.pluginId ?? null,
		sourceId: source?.sourceId ?? null,
		hasSortMethods: (source?.sortMethods?.length ?? 0) > 0,
		hasFilterableAttributes: (source?.filterableAttributes?.length ?? 0) > 0,
		sortMethods: source?.sortMethods ?? [],
		filterableAttributes: source?.filterableAttributes ?? [],
	};
}
