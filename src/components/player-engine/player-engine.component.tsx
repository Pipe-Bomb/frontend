"use client";

import { usePlayerStore } from "@/store/player.store";
import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { createTrackAudioSession } from "@api";
import { useNotificationStore } from "@/store/notification.store";
import { useKeyboardShortcuts } from "@/hook/keyboard-shortcuts.hook";
import { useTrack } from "@/hook/track.hook";
import { getAttribute } from "@/lib/attribute.util";

const PRELOAD_THRESHOLD = 10; // seconds before end to start buffering next track

export default function AudioEngine() {
	// Two audio slots for gapless playback — ping-pong between them
	const audio0Ref = useRef<HTMLAudioElement | null>(null);
	const audio1Ref = useRef<HTMLAudioElement | null>(null);
	const hls0Ref = useRef<Hls | null>(null);
	const hls1Ref = useRef<Hls | null>(null);

	// Which slot (0|1) is currently active (playing)
	const activeSlotRef = useRef<0 | 1>(0);

	// What track key is loaded in each slot (null = empty)
	const slotKeyRef = useRef<[string | null, string | null]>([null, null]);

	// Track key currently being preloaded into the standby slot
	const preloadingKeyRef = useRef<string | null>(null);

	// Whether preload has been triggered for the current track's window
	const preloadTriggeredRef = useRef(false);

	const failedNotificationRef = useRef<string | null>(null);

	const { createNotification, removeNotification } = useNotificationStore();

	const {
		queue,
		currentIndex,
		isPlaying,
		next,
		prev,
		seek,
		seekTo,
		updateProgress,
		setIsPlaying,
		toggle,
		setIsBuffering,
		volume,
		muted,
	} = usePlayerStore();

	const currentTrack = queue[currentIndex];
	const trackResult = useTrack(currentTrack);

	const getActiveAudio = () =>
		activeSlotRef.current === 0 ? audio0Ref.current : audio1Ref.current;
	const getStandbyAudio = () =>
		activeSlotRef.current === 0 ? audio1Ref.current : audio0Ref.current;
	const getStandbyHlsRef = () =>
		activeSlotRef.current === 0 ? hls1Ref : hls0Ref;
	const getStandbySlot = (): 0 | 1 => (activeSlotRef.current === 0 ? 1 : 0);

	// Destroy HLS instance and clear ref
	const destroyHls = (hlsRef: { current: Hls | null }) => {
		if (hlsRef.current) {
			hlsRef.current.destroy();
			hlsRef.current = null;
		}
	};

	// Load a track into a specific slot. Does NOT call play() unless autoPlay=true.
	const loadIntoSlot = (
		slot: 0 | 1,
		trackKey: string,
		autoPlay: boolean,
	): (() => void) => {
		const audio = slot === 0 ? audio0Ref.current : audio1Ref.current;
		const hlsRef = slot === 0 ? hls0Ref : hls1Ref;
		if (!audio) {
			return () => {};
		}

		destroyHls(hlsRef);
		audio.src = "";

		if (slot === activeSlotRef.current) {
			setIsBuffering(true);
		}

		slotKeyRef.current[slot] = trackKey;

		let cancelled = false;
		const [pluginId, libraryId, trackId] = trackKey.split(":") as [
			string,
			string,
			string,
		];

		createTrackAudioSession(pluginId, libraryId, trackId)
			.then(({ status, data: session }) => {
				if (cancelled || !session || status !== 200) {
					return;
				}

				if (session.type === "stream") {
					audio.src = `${session.baseUrl}/stream`;
					audio.load();
					if (autoPlay) {
						audio.play();
					}
					return;
				}

				if (session.type === "hls") {
					const url = `${session.baseUrl}/hls/playlist.m3u8`;

					if (audio.canPlayType("application/vnd.apple.mpegurl")) {
						audio.src = url;
						audio.load();
						if (autoPlay) {
							audio.play();
						}
						return;
					}

					if (Hls.isSupported()) {
						const hls = new Hls();
						hlsRef.current = hls;
						hls.loadSource(url);
						hls.attachMedia(audio);
						if (autoPlay) {
							hls.on(Hls.Events.MANIFEST_PARSED, () => {
								if (!cancelled) {
									audio.play();
								}
							});
						}
					} else {
						if (slot === activeSlotRef.current) {
							const id = createNotification(
								"Failed to play track: browser does not support HLS",
								{ timeout: null },
							);
							failedNotificationRef.current = id;
						}
					}
				}
			})
			.catch((e) => {
				if (cancelled || slot !== activeSlotRef.current) {
					return;
				}
				const msg =
					typeof e?.body?.message === "string"
						? e.body.message
						: "Something went wrong when attempting to play track";
				const id = createNotification(msg, { timeout: null });
				failedNotificationRef.current = id;
				console.error(e);
			});

		return () => {
			cancelled = true;
		};
	};

	// Preload the next track into the standby slot
	const triggerPreload = () => {
		const { queue, currentIndex, repeat } = usePlayerStore.getState();

		let nextIndex = currentIndex + 1;
		if (nextIndex >= queue.length) {
			if (repeat === "all") {
				nextIndex = 0;
			} else {
				return;
			}
		}

		const nextKey = queue[nextIndex];
		if (!nextKey) {
			return;
		}

		const standbySlot = getStandbySlot();
		if (slotKeyRef.current[standbySlot] === nextKey) {
			return;
		}
		if (preloadingKeyRef.current === nextKey) {
			return;
		}

		// Clear existing standby
		const standbyAudio = getStandbyAudio();
		const standbyHlsRef = getStandbyHlsRef();
		destroyHls(standbyHlsRef);
		if (standbyAudio) {
			standbyAudio.src = "";
		}
		slotKeyRef.current[standbySlot] = null;

		preloadingKeyRef.current = nextKey;

		const audio = standbyAudio;
		const hlsRef = standbyHlsRef;
		if (!audio) {
			return;
		}

		const [pluginId, libraryId, trackId] = nextKey.split(":") as [
			string,
			string,
			string,
		];
		createTrackAudioSession(pluginId, libraryId, trackId)
			.then(({ status, data: session }) => {
				if (
					preloadingKeyRef.current !== nextKey ||
					!session ||
					status !== 200
				) {
					return;
				}

				if (session.type === "stream") {
					audio.src = `${session.baseUrl}/stream`;
					audio.load();
				} else if (session.type === "hls") {
					const url = `${session.baseUrl}/hls/playlist.m3u8`;
					if (audio.canPlayType("application/vnd.apple.mpegurl")) {
						audio.src = url;
						audio.load();
					} else if (Hls.isSupported()) {
						const hls = new Hls();
						hlsRef.current = hls;
						hls.loadSource(url);
						hls.attachMedia(audio);
						// No play() — just buffering
					}
				}

				slotKeyRef.current[standbySlot] = nextKey;
				preloadingKeyRef.current = null;
			})
			.catch(() => {
				if (preloadingKeyRef.current === nextKey) {
					preloadingKeyRef.current = null;
				}
			});
	};

	// Keyboard shortcuts
	useKeyboardShortcuts((key, shift) => {
		if (key === " ") {
			toggle();
			return true;
		}
		if (key === "ArrowRight") {
			if (shift) {
				next();
			} else {
				seek((current) => current + 10);
			}
			return true;
		}
		if (key === "ArrowLeft") {
			if (shift) {
				const { currentTime } = usePlayerStore.getState();
				if (currentTime > 3) {
					seek(0);
				} else {
					prev();
				}
			} else {
				seek((current) => current - 10);
			}
			return true;
		}
		const numberIndex = "0123456789".indexOf(key);
		if (key.length === 1 && numberIndex >= 0) {
			seek((_current, duration) => (duration / 10) * numberIndex);
			return true;
		}
		return false;
	}, []);

	// Media Session API
	useEffect(() => {
		if (!("mediaSession" in navigator) || !trackResult.data) {
			return;
		}

		const track = trackResult.data;
		const title = getAttribute(track.attributes, "title", "string", true);
		let artistString = "";

		if (track.artists?.length) {
			for (const [index, artist] of track.artists.entries()) {
				const name = getAttribute(
					artist.artist.attributes,
					"name",
					"string",
					true,
				);
				if (name) {
					artistString += name;
					if (artist.joinPhrase) {
						artistString += artist.joinPhrase;
					} else if (index < track.artists.length - 1) {
						artistString += ", ";
					}
				}
			}
		}
		if (!artistString) {
			const attribute = getAttribute(
				track.attributes,
				"artist",
				"string",
				true,
				true,
			);
			if (attribute?.length) {
				artistString = attribute.join(", ");
			}
		}

		navigator.mediaSession.metadata = new MediaMetadata({
			title: title ?? track.title,
			artist: artistString || "Unknown Artist",
		});

		navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
		navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
		navigator.mediaSession.setActionHandler("seekto", (details) => {
			if (details.seekTime !== undefined) {
				seek(details.seekTime);
			}
		});
		navigator.mediaSession.setActionHandler("seekbackward", (details) => {
			seek((current) => current - (details.seekOffset ?? 10));
		});
		navigator.mediaSession.setActionHandler("seekforward", (details) => {
			seek((current) => current + (details.seekOffset ?? 10));
		});
		navigator.mediaSession.setActionHandler("nexttrack", () => next());
		navigator.mediaSession.setActionHandler("previoustrack", () => {
			const { currentTime } = usePlayerStore.getState();
			if (currentTime > 3) {
				seek(0);
			} else {
				prev();
			}
		});
	}, [trackResult.data]);

	// Sync volume/muted to both audio elements
	useEffect(() => {
		const vol = muted ? 0 : volume;
		if (audio0Ref.current) {
			audio0Ref.current.volume = vol;
		}
		if (audio1Ref.current) {
			audio1Ref.current.volume = vol;
		}
	}, [volume, muted]);

	// HLS cleanup on unmount
	useEffect(() => {
		return () => {
			destroyHls(hls0Ref);
			destroyHls(hls1Ref);
		};
	}, []);

	// Load current track into active slot
	useEffect(() => {
		if (!currentTrack) {
			// Queue was cleared — stop and reset both slots
			destroyHls(hls0Ref);
			destroyHls(hls1Ref);
			if (audio0Ref.current) {
				audio0Ref.current.pause();
				audio0Ref.current.src = "";
			}
			if (audio1Ref.current) {
				audio1Ref.current.pause();
				audio1Ref.current.src = "";
			}
			slotKeyRef.current = [null, null];
			preloadingKeyRef.current = null;
			preloadTriggeredRef.current = false;
			return;
		}

		// Skip if already loaded via gapless swap
		if (slotKeyRef.current[activeSlotRef.current] === currentTrack) {
			return;
		}

		// Clear failed notification from previous track
		if (failedNotificationRef.current) {
			removeNotification(failedNotificationRef.current);
			failedNotificationRef.current = null;
		}

		// Cancel any in-progress preload for a different track
		preloadingKeyRef.current = null;
		preloadTriggeredRef.current = false;

		// Clear standby slot (stale preload is no longer valid)
		const standbySlot = getStandbySlot();
		const standbyAudio = getStandbyAudio();
		destroyHls(getStandbyHlsRef());
		if (standbyAudio) {
			standbyAudio.pause();
			standbyAudio.src = "";
		}
		slotKeyRef.current[standbySlot] = null;

		const cancel = loadIntoSlot(activeSlotRef.current, currentTrack, isPlaying);
		return cancel;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTrack]);

	// Play / pause active slot
	useEffect(() => {
		const audio = getActiveAudio();
		if (!audio) {
			return;
		}
		if (isPlaying) {
			audio.play().catch(() => {
				usePlayerStore.setState({ isPlaying: false });
			});
		} else {
			audio.pause();
		}
	}, [isPlaying, currentTrack]);

	// Seek active slot
	useEffect(() => {
		const audio = getActiveAudio();
		if (audio && seekTo !== null) {
			audio.currentTime = seekTo;
			usePlayerStore.setState({ seekTo: null });
		}
	}, [seekTo]);

	// --- Event handlers ---

	const handleTimeUpdate = (slot: 0 | 1) => {
		if (slot !== activeSlotRef.current) {
			return;
		}
		const audio = getActiveAudio();
		if (!audio) {
			return;
		}

		const time = audio.currentTime;
		const dur = isNaN(audio.duration) ? -1 : audio.duration;
		updateProgress(time, dur);

		if (
			!preloadTriggeredRef.current &&
			dur > 0 &&
			dur - time < PRELOAD_THRESHOLD
		) {
			preloadTriggeredRef.current = true;
			triggerPreload();
		}
	};

	const handleEnded = (slot: 0 | 1) => {
		if (slot !== activeSlotRef.current) {
			return;
		}

		const { queue, currentIndex, repeat } = usePlayerStore.getState();

		if (repeat === "one") {
			const audio = getActiveAudio();
			if (audio) {
				audio.currentTime = 0;
				audio.play();
			}
			return;
		}

		const hasNext = currentIndex < queue.length - 1 || repeat === "all";
		if (!hasNext) {
			setIsPlaying(false);
			return;
		}

		let nextIndex = currentIndex + 1;
		if (nextIndex >= queue.length) {
			nextIndex = 0;
		}
		const nextKey = queue[nextIndex];
		const standbySlot = getStandbySlot();

		if (nextKey && slotKeyRef.current[standbySlot] === nextKey) {
			// Gapless swap: standby is already loaded, just flip slots and play
			const standbyAudio = getStandbyAudio();
			if (standbyAudio) {
				activeSlotRef.current = standbySlot;
				preloadTriggeredRef.current = false;

				const { volume, muted } = usePlayerStore.getState();
				standbyAudio.volume = muted ? 0 : volume;
				standbyAudio.play();

				next();
				setIsPlaying(true);
				return;
			}
		}

		// Normal transition — let currentTrack effect handle loading
		next();
		setIsPlaying(true);
	};

	const handlePlayEvent = (slot: 0 | 1) => {
		if (slot === activeSlotRef.current) {
			usePlayerStore.setState({ isPlaying: true });
		}
	};

	const handlePauseEvent = (slot: 0 | 1) => {
		if (slot === activeSlotRef.current) {
			usePlayerStore.setState({ isPlaying: false });
		}
	};

	const handleBuffering = (slot: 0 | 1, buffering: boolean) => {
		if (slot === activeSlotRef.current) {
			setIsBuffering(buffering);
		}
	};

	return (
		<>
			<audio
				ref={audio0Ref}
				onTimeUpdate={() => handleTimeUpdate(0)}
				onLoadedMetadata={() => handleTimeUpdate(0)}
				onEnded={() => handleEnded(0)}
				onPlay={() => handlePlayEvent(0)}
				onPause={() => handlePauseEvent(0)}
				onWaiting={() => handleBuffering(0, true)}
				onPlaying={() => handleBuffering(0, false)}
				onCanPlay={() => handleBuffering(0, false)}
				onStalled={() => handleBuffering(0, true)}
				crossOrigin="anonymous"
			/>
			<audio
				ref={audio1Ref}
				onTimeUpdate={() => handleTimeUpdate(1)}
				onLoadedMetadata={() => handleTimeUpdate(1)}
				onEnded={() => handleEnded(1)}
				onPlay={() => handlePlayEvent(1)}
				onPause={() => handlePauseEvent(1)}
				onWaiting={() => handleBuffering(1, true)}
				onPlaying={() => handleBuffering(1, false)}
				onCanPlay={() => handleBuffering(1, false)}
				onStalled={() => handleBuffering(1, true)}
				crossOrigin="anonymous"
			/>
		</>
	);
}
