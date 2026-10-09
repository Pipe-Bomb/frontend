"use client";

import { DependencyList, useCallback, useEffect } from "react";

type ShortcutCallback = (
	key: string,
	shiftKey: boolean,
	ctrlKey: boolean,
) => boolean;

export function useKeyboardShortcuts(
	callback: ShortcutCallback,
	deps: DependencyList,
) {
	const memoCallback = useCallback(callback, deps);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;

			if (
				target?.closest("input, textarea, select, [contenteditable='true']") &&
				!target.closest("[data-global-shortcuts]")
			) {
				return;
			}

			if (memoCallback(event.key, event.shiftKey, event.ctrlKey)) {
				event.preventDefault();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [memoCallback]);
}
