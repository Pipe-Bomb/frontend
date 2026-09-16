"use client";

import { reportPlayback } from "@/api";
import { deserializeTrackKey } from "@/lib/track-batcher.util";
import { usePlayerStore } from "@/store/player.store";
import { useEffect, useRef } from "react";

const CLIENT_NAME = "Pipe Bomb Web";

export function usePlaybackReporter() {
	const currentIndex = usePlayerStore((s) => s.currentIndex);
	const queue = usePlayerStore((s) => s.queue);
	const currentTime = usePlayerStore((s) => s.currentTime);
	const duration = usePlayerStore((s) => s.duration);

	const hasReportedRef = useRef(false);
	const lastTrackKeyRef = useRef<string | null>(null);

	const trackKey = queue[currentIndex] ?? null;

	useEffect(() => {
		if (trackKey === lastTrackKeyRef.current) {
			return;
		}
		hasReportedRef.current = false;
		lastTrackKeyRef.current = trackKey;
	}, [trackKey]);

	useEffect(() => {
		if (hasReportedRef.current) {
			return;
		}
		if (!trackKey) {
			return;
		}
		if (duration <= 0) {
			return;
		}

		const threshold = Math.min(duration * 0.5, 240);
		if (currentTime < threshold) {
			return;
		}

		hasReportedRef.current = true;

		const { pluginId, libraryId, trackId } = deserializeTrackKey(trackKey);
		reportPlayback({
			pluginId,
			libraryId,
			trackId,
			clientName: CLIENT_NAME,
		}).catch(console.error);
	}, [currentTime, duration, trackKey]);
}
