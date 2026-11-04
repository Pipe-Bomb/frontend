import { cc } from "@/lib/util";
import MD from "markdown-to-jsx";
import styles from "./markdown.module.scss";
import Link from "next/link";

interface Props {
	children: string;
	className?: string;
}

export function Markdown({ children, className }: Props) {
	return (
		<MD
			className={cc(styles.container, className)}
			options={{
				overrides: {
					a: {
						component: ({ children, ...props }) => (
							<Link {...props} target="_blank" className={styles.link}>
								{children}
							</Link>
						),
					},
				},
			}}
		>
			{children}
		</MD>
	);
}
