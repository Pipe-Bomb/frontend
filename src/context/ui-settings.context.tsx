"use client";

import { HorizontalScrollerId } from "@/enum/horizontal-scroller-id.enum";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

export interface UISettings {
	horizontalScrollerState: Record<Partial<HorizontalScrollerId>, boolean>;
}

const UISettingsContext = createContext<
	[Partial<UISettings>, (value: Partial<UISettings>) => void] | null
>(null);

export function UISettingsProvider({
	children,
	data,
}: {
	children: ReactNode;
	data: Partial<UISettings>;
}) {
	const [settings, setSettings] = useState(data);

	useEffect(() => {
		document.cookie = `ui_settings=${JSON.stringify(settings)}; path=/; max-age=31536000; SameSite=Lax`;
	}, [settings]);

	return (
		<UISettingsContext.Provider value={[settings, setSettings]}>
			{children}
		</UISettingsContext.Provider>
	);
}

export function useUISettings<T extends keyof UISettings>(
	key: T,
	defaultValue: UISettings[T],
): [UISettings[T], (value: UISettings[T]) => void] {
	const context = useContext(UISettingsContext);
	if (!context) {
		throw new Error("useUISettings must be used within UISettingsProvider");
	}
	const [settings, setSettings] = context;

	const update = (value: UISettings[T]) => {
		setSettings({
			...settings,
			[key]: value,
		});
	};

	return [settings[key] ?? defaultValue, update];
}
