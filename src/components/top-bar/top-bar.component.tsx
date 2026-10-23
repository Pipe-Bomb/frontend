"use client";

import { useAuth } from "@/context/auth.context";
import styles from "./top-bar.module.scss";
import { IconCancel, IconSearch, IconUserCircle } from "@tabler/icons-react";
import { TextInput } from "@/components/text-input/text-input.component";
import { useUrlParam } from "@/hook/url-param.hook";
import { useMemo, useRef } from "react";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { IconButton } from "@/components/icon-button/icon-button";
import { useKeyboardShortcuts } from "@/hook/keyboard-shortcuts.hook";
import { useState } from "react";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { logoutUser } from "@api";
import { ContextMenuElement } from "@/context/context-menu.context";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import {
	getSelectionMessage,
	useSelectionCount,
	useSelectionMode,
	useSelectionStore,
} from "@/store/selection.store";
import { BulkMenu } from "@/components/bulk-menu/bulk-menu.component";

export function TopBar() {
	const user = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [searchInput, setSearchInput] = useState<HTMLInputElement | null>(null);
	const hasPrivilege = usePrivilegeCheck();
	const selectionCount = useSelectionCount();
	const inSelectionMode = useSelectionMode();
	const selectionMessage = useMemo(
		() => getSelectionMessage(selectionCount),
		[selectionCount],
	);
	const clearAllSelection = useSelectionStore((state) => state.clearAll);

	const [query, setQuery] = useUrlParam("query", {
		replace: true,
		debounceMs: 300,
	});

	const showSettings =
		hasPrivilege("view-tasks") ||
		hasPrivilege("view-privileges") ||
		hasPrivilege("edit-attribute-source-order") ||
		hasPrivilege("view-workflows");

	useKeyboardShortcuts(
		(key, _shift, ctrl) => {
			if (key == "k" && ctrl) {
				if (searchInput) {
					searchInput.focus();
				}
				return true;
			}
			if (key == "Escape") {
				clearAllSelection();
				return true;
			}
			return false;
		},
		[searchInput, inSelectionMode],
	);

	const pushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const changeQuery = (newQuery: string) => {
		if (pathname != "/search" && newQuery.trim() != "") {
			if (pushTimeout.current) clearTimeout(pushTimeout.current);
			pushTimeout.current = setTimeout(() => {
				router.push(`/search?query=${encodeURIComponent(newQuery)}`, {
					scroll: false,
				});
			}, 250);
		}

		setQuery(newQuery);
	};

	const { onClick } = useButtonMenu(() => {
		const items: ContextMenuElement[] = [
			{
				key: "logout",
				languageKey: "contextmenu.top.logout",
				onClick: () => {
					logoutUser().then(() => {
						router.refresh();
					});
				},
			},
		];

		if (user) {
			if (showSettings) {
				items.unshift({
					key: "server-settings",
					languageKey: "contextmenu.top.server-settings",
					href: "/settings/system",
				});
			}

			items.unshift(
				{
					key: "go-to-profile",
					languageKey: "contextmenu.top.view-profile",
					href: `/user/${user.uuid}`,
				},
				{
					key: "user-settings",
					languageKey: "contextmenu.top.user-settings",
					href: "/settings/user",
				},
			);
		}

		return items;
	});

	return (
		<div className={styles.container}>
			<div className={styles.buttons}>
				<Link href="/" className={styles.homeButton}>
					<img src="/logo.png" className={styles.homeButtonLogo} />
				</Link>
			</div>
			{selectionCount.total ? (
				<div className={styles.selectionContainer}>
					<span className={styles.selectionMessage}>{selectionMessage}</span>
					<div className={styles.selectionButtons}>
						<BulkMenu />
						<IconButton
							icon={IconCancel}
							iconSource="tabler"
							onClick={clearAllSelection}
						/>
					</div>
				</div>
			) : (
				<div className={styles.search}>
					<div className={styles.searchBox}>
						<TextInput
							value={query ?? ""}
							onChange={changeQuery}
							placeholder="Search..."
							ref={setSearchInput}
						/>
					</div>

					<IconButton
						icon={IconSearch}
						iconSource="tabler"
						onClick={() =>
							router.push(`/search?query=${encodeURIComponent(query ?? "")}`, {
								scroll: false,
							})
						}
						iconClassName={styles.searchIcon}
					/>
				</div>
			)}

			{user && (
				<button className={styles.userSection} onClick={onClick}>
					<IconUserCircle className={styles.userIcon} />
					<span className={styles.username}>{user.username}</span>
				</button>
			)}
		</div>
	);
}
