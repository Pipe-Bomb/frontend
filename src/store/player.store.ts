import { create } from "zustand";
import { shuffle } from "@/lib/util";

export type RepeatMode = "off" | "all" | "one";

const getInitialVolume = (): number => {
	if (typeof window === "undefined") {
		return 1;
	}
	const stored = localStorage.getItem("pb-volume");
	if (stored !== null) {
		const parsed = parseFloat(stored);
		if (!isNaN(parsed)) {
			return Math.min(1, Math.max(0, parsed));
		}
	}
	return 1;
};

interface PlayerStore {
	queue: string[];
	currentIndex: number;
	isPlaying: boolean;

	currentTime: number;
	duration: number;
	seekTo: number | null;

	isBuffering: boolean;
	setIsBuffering: (isBuffering: boolean) => void;

	volume: number;
	muted: boolean;
	setVolume: (volume: number) => void;
	toggleMute: () => void;

	shuffle: boolean;
	originalQueue: string[];
	toggleShuffle: () => void;

	repeat: RepeatMode;
	cycleRepeat: () => void;

	updateProgress: (time: number, duration: number) => void;
	seek: (
		time: number | ((currentTime: number, duration: number) => number),
	) => void;

	playTrack: (
		trackId: string,
		indexInList?: number,
		entireList?: string[],
	) => void;
	addToEnd: (tracks: string[]) => void;
	playNext: (track: string) => void;
	playNow: (track: string) => void;
	remove: (index: number) => void;
	insert: (tracks: string[], index: number) => void;
	moveTrack: (fromIndex: number, toIndex: number) => void;
	clearQueue: () => void;

	next: () => void;
	prev: () => void;
	toggle: () => void;
	setIsPlaying: (playing: boolean) => void;
	playIndex: (index: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	queue: [],
	currentIndex: 0,
	isPlaying: false,

	currentTime: 0,
	duration: 0,
	seekTo: null,

	isBuffering: false,
	setIsBuffering: (isBuffering) => set({ isBuffering }),

	volume: getInitialVolume(),
	muted: false,
	setVolume: (volume) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("pb-volume", String(volume));
		}
		set({ volume });
	},
	toggleMute: () => set((state) => ({ muted: !state.muted })),

	shuffle: false,
	originalQueue: [],
	toggleShuffle: () => {
		set((state) => {
			if (state.shuffle) {
				// Restore original order, keeping current track at its original position
				const currentKey = state.queue[state.currentIndex];
				const restored = state.originalQueue.length
					? state.originalQueue
					: state.queue;
				const newCurrentIndex = restored.indexOf(currentKey);
				return {
					shuffle: false,
					originalQueue: [],
					queue: restored,
					currentIndex:
						newCurrentIndex >= 0 ? newCurrentIndex : state.currentIndex,
				};
			}
			const before = state.queue.slice(0, state.currentIndex + 1);
			const after = shuffle(state.queue.slice(state.currentIndex + 1));
			return {
				shuffle: true,
				originalQueue: [...state.queue],
				queue: [...before, ...after],
			};
		});
	},

	repeat: "off",
	cycleRepeat: () => {
		set((state) => {
			const order: RepeatMode[] = ["off", "all", "one"];
			const next = (order.indexOf(state.repeat) + 1) % 3;
			return { repeat: order[next] };
		});
	},

	updateProgress: (currentTime, duration) => set({ currentTime, duration }),
	seek: (time) => {
		if (typeof time == "function") {
			set(({ currentTime, duration }) => ({
				seekTo: Math.min(Math.max(time(currentTime, duration), 0), duration),
			}));
		} else {
			set({ seekTo: time });
		}
	},

	playTrack: (track, indexInList, entireList) => {
		if (entireList) {
			set({
				queue: entireList,
				currentIndex: indexInList ?? 0,
				isPlaying: true,
			});
		} else {
			set((state) => ({
				queue: [...state.queue, track],
				currentIndex: state.queue.length,
				isPlaying: true,
			}));
		}
	},

	addToEnd: (tracks: string[]) => {
		set((state) => ({
			queue: [...state.queue, ...tracks],
		}));
	},

	playNext: (track: string) => {
		set((state) => {
			const newQueue = [...state.queue];
			newQueue.splice(state.currentIndex + 1, 0, track);
			return { queue: newQueue };
		});
	},

	playNow: (track: string) => {
		set({
			queue: [track],
			currentIndex: 0,
			isPlaying: true,
		});
	},

	insert: (tracks, index) => {
		set((state) => {
			const newQueue = [
				...state.queue.slice(0, index + 1),
				...tracks,
				...state.queue.slice(index + 1),
			];
			let newCurrentIndex = state.currentIndex;
			if (index < state.currentIndex) {
				newCurrentIndex = state.currentIndex + tracks.length;
			}
			return { queue: newQueue, currentIndex: newCurrentIndex };
		});
	},

	remove: (index: number) => {
		set((state) => {
			const newQueue = state.queue.filter((_, i) => i !== index);
			let newCurrentIndex = state.currentIndex;
			if (index < state.currentIndex) {
				newCurrentIndex = state.currentIndex - 1;
			} else if (index === state.currentIndex) {
				newCurrentIndex = Math.min(state.currentIndex, newQueue.length - 1);
			}
			return {
				queue: newQueue,
				currentIndex: Math.max(0, newCurrentIndex),
				isPlaying: newQueue.length > 0 ? state.isPlaying : false,
			};
		});
	},

	moveTrack: (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) {
			return;
		}
		set((state) => {
			const newQueue = [...state.queue];
			const [entry] = newQueue.splice(fromIndex, 1);
			newQueue.splice(toIndex, 0, entry);

			const ci = state.currentIndex;
			let newCurrentIndex = ci;
			if (fromIndex === ci) {
				newCurrentIndex = toIndex;
			} else if (fromIndex < ci && toIndex >= ci) {
				newCurrentIndex = ci - 1;
			} else if (fromIndex > ci && toIndex <= ci) {
				newCurrentIndex = ci + 1;
			}

			return { queue: newQueue, currentIndex: newCurrentIndex };
		});
	},

	clearQueue: () => {
		set({
			queue: [],
			currentIndex: 0,
			isPlaying: false,
			currentTime: 0,
			duration: 0,
			seekTo: null,
			isBuffering: false,
			shuffle: false,
			originalQueue: [],
		});
	},

	next: () => {
		const { currentIndex, queue, repeat } = get();
		if (currentIndex < queue.length - 1) {
			set({ currentIndex: currentIndex + 1 });
		} else if (repeat === "all" && queue.length > 0) {
			set({ currentIndex: 0 });
		}
	},

	prev: () => {
		const { currentIndex } = get();
		if (currentIndex > 0) {
			set({ currentIndex: currentIndex - 1 });
		}
	},

	playIndex: (index) => set({ currentIndex: index }),

	setIsPlaying: (isPlaying) => set({ isPlaying }),

	toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
