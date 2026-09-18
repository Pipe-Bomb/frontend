"use client";

import { Resource } from "@api";
import { ReactNode, useEffect, useState } from "react";
import styles from "./resource-image.module.scss";
import { cc } from "@/lib/util";

interface Props {
	resource: Resource | null;
	className?: string;
	fallbackSrc?: string;
	fallback?: ReactNode;
	width?: number;
	height?: number;
}

export function ResourceImage({
	resource,
	className,
	fallbackSrc,
	fallback,
	width,
	height,
}: Props) {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (resource?.url) {
			let url = resource.url;
			if (width || height) {
				if (url.includes("?")) {
					url += "&";
				} else {
					url += "?";
				}
				if (width) {
					url += `width=${width}`;
					if (height) {
						url += "&";
					}
				}
				if (height) {
					url += `height=${height}`;
				}
			}

			setUrl(url);
		} else {
			setUrl(fallbackSrc ?? null);
		}
	}, [resource?.url, fallbackSrc, width, height]);

	return (
		<div className={cc(styles.container, className)}>
			{url ? (
				<img
					src={url}
					className={styles.image}
					onError={() => setUrl(fallbackSrc ?? null)}
				/>
			) : (
				fallback ?? null
			)}
		</div>
	);
}
