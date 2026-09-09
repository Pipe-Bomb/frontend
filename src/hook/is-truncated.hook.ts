import {
	RefObject,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export function useIsTruncated() {
	const ref = useRef<HTMLElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	const checkTruncation = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		setIsTruncated(el.scrollWidth > el.clientWidth);
	}, []);

	useLayoutEffect(() => {
		checkTruncation();

		const el = ref.current;
		if (!el) return;

		const ro = new ResizeObserver(checkTruncation);
		ro.observe(el);

		return () => ro.disconnect();
	}, [checkTruncation]);

	return [ref, isTruncated] as [RefObject<HTMLElement>, boolean];
}
