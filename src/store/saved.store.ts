import { create } from "zustand";

interface SavedStore {
	overrides: Record<string, boolean>;

	set: (key: string, value: boolean) => void;
	clear: (key: string) => void;
}

export const useSavedStore = create<SavedStore>((set) => ({
	overrides: {},

	set: (key, value) =>
		set((state) => ({ overrides: { ...state.overrides, [key]: value } })),

	clear: (key) =>
		set((state) => {
			if (!(key in state.overrides)) {
				return state;
			}
			const overrides = { ...state.overrides };
			delete overrides[key];
			return { overrides };
		}),
}));

export function useBookmarked(key: string | null, fallback: boolean): boolean {
	const override = useSavedStore((state) =>
		key ? state.overrides[key] : undefined,
	);

	return override ?? fallback;
}
