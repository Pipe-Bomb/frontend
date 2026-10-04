"use client";

import { IconButton } from "@/components/icon-button/icon-button";
import { BookmarkToggle } from "@/hook/saved-toggle.hook";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";

type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonStyle = "simple" | "background" | "ghost";

interface Props {
	bookmark: BookmarkToggle;
	size?: ButtonSize;
	style?: ButtonStyle;
}

export function BookmarkButton({ bookmark, size, style }: Props) {
	const { bookmarked, isUpdating, toggle } = bookmark;

	return (
		<IconButton
			icon={bookmarked ? IconBookmarkFilled : IconBookmark}
			iconSource="tabler"
			loading={isUpdating}
			size={size}
			style={style}
			onClick={toggle}
		/>
	);
}
