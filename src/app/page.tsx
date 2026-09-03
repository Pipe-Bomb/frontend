"use client";

import { RequireAuth } from "@/guard/auth.guard";
import styles from "./page.module.scss";
import Link from "next/link";

export default function Home() {
	return (
		<RequireAuth>
			<div className={styles.container}>
				<h1 className={styles.title}>Welcome to Pipe Bomb</h1>
				<div className={styles.links}>
					<Link href="https://pipebomb.net/wiki" target="_blank">
						Wiki
					</Link>
					<Link href="https://discord.gg/Kj7KfPDwCE" target="_blank">
						Discord
					</Link>
				</div>
			</div>
		</RequireAuth>
	);
}
