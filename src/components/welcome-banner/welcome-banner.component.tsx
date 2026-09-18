"use client";

import { useAuth } from "@/context/auth.context";
import styles from "./welcome-banner.module.scss";
import Link from "next/link";

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour >= 5 && hour < 12) {
		return "Good morning,";
	}
	if (hour >= 12 && hour < 18) {
		return "Good afternoon,";
	}
	return "Good evening,";
}

export function WelcomeBanner() {
	const user = useAuth();

	if (!user) {
		return null;
	}

	return (
		<div className={styles.banner}>
			<h1 className={styles.greeting}>
				{getGreeting()} <span className={styles.username}>{user.username}</span>
			</h1>
			<div className={styles.links}>
				<Link href="https://pipebomb.net/wiki" target="_blank">
					Wiki
				</Link>
				<Link href="https://discord.gg/Kj7KfPDwCE" target="_blank">
					Discord
				</Link>
			</div>
		</div>
	);
}
