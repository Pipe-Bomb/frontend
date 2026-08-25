import { usePlayerStore } from "@/store/player.store";
import { useQueryClient } from "@tanstack/react-query";
import { EphemeralTrack, Track, TrackIdDto } from "@api";
import { serializeTrackKey } from "@/lib/track-batcher.util";

type QueueActionInput = Track | EphemeralTrack | TrackIdDto;

export function useQueueActions() {
	const queryClient = useQueryClient();
	const store = usePlayerStore();

	const processTrackInput = (item: QueueActionInput): string => {
		const key = serializeTrackKey(item);

		if ("title" in item && item.attributes) {
			queryClient.setQueryData(["track", key], item);
		}

		return key;
	};

	return {
		playNow: (track: QueueActionInput) => {
			const key = processTrackInput(track);
			store.playNow(key);
		},

		playNext: (track: QueueActionInput) => {
			const key = processTrackInput(track);
			store.playNext(key);
		},

		playListNext: (tracks: QueueActionInput[]) => {
			if (!tracks.length) {
				return;
			}
			const keys = tracks.map(processTrackInput);

			if (!store.queue.length) {
				store.playTrack(keys[0], 0, keys);
			} else {
				store.insert(keys, store.currentIndex);
			}
		},

		addToEnd: (tracks: QueueActionInput[]) => {
			const keys = tracks.map(processTrackInput);
			store.addToEnd(keys);
		},

		playEntireList: (tracks: QueueActionInput[], startIndex: number) => {
			const keys = tracks.map(processTrackInput);
			store.playTrack(keys[startIndex], startIndex, keys);
		},
		move: (currentIndex: number, newIndex: number) => {
			if (newIndex == currentIndex) {
				return;
			}

			const entry = store.queue[currentIndex];

			store.remove(currentIndex);
			store.insert([entry], newIndex - 1);
		},
	};
}
