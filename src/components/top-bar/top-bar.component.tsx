"use client";

import { useAuth } from "@/context/auth.context";
import styles from "./top-bar.module.scss";
import { IconSearch, IconUserCircle } from "@tabler/icons-react";
import { TextInput } from "@/components/text-input/text-input.component";
import { useUrlParam } from "@/hook/url-param.hook";
import { useRef } from "react";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { IconButton } from "@/components/icon-button/icon-button";
import { useKeyboardShortcuts } from "@/hook/keyboard-shortcuts.hook";
import { useState } from "react";
import { useButtonMenu } from "@/hook/button-menu.hook";
import { logoutUser } from "@api";
import { ContextMenuElement } from "@/context/context-menu.context";

export function TopBar() {
	const user = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [searchInput, setSearchInput] = useState<HTMLInputElement | null>(null);

	const [query, setQuery] = useUrlParam("query", {
		replace: true,
		debounceMs: 300,
	});

	useKeyboardShortcuts(
		(key, _shift, ctrl) => {
			if (key == "k" && ctrl) {
				if (searchInput) {
					searchInput.focus();
				}
				return true;
			}
			return false;
		},
		[searchInput],
	);

	const pushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
const changeQuery = (newQuery: string) => {
if (pathname != "/search" && newQuery.trim() != "") {
    if (pushTimeout.current) clearTimeout(pushTimeout.current);
    pushTimeout.current = setTimeout(() => {
        router.push(`/search?query=${encodeURIComponent(newQuery)}`, { scroll: false });
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
					logoutUser().then((response) => {
						router.refresh();
					});
				},
			},
		];

		if (user) {
			items.unshift({
				key: "go-to-profile",
				languageKey: "contextmenu.top.view-profile",
				href: `/user/${user.uuid}`,
			});
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
					onClick={() => router.push(`/search?query=${encodeURIComponent(query ?? "")}`, { scroll: false })}
					iconClassName={styles.searchIcon}
				/>
			</div>
			{user && (
				<button className={styles.userSection} onClick={onClick}>
					<IconUserCircle className={styles.userIcon} />
					<span className={styles.username}>{user.username}</span>
				</button>
			)}
		</div>
	);
}
