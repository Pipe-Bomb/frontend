import Link from "next/link";
import styles from "./navbar-link.module.scss";
import { cc } from "@/lib/util";
import { ComponentType, SVGProps } from "react";

interface Props {
	href: string;
	name: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>> | null;
	active?: boolean;
}

export function NavbarLink({ href, name, active, icon, ...props }: Props) {
	const IconComponent = icon;

	return (
		<Link
			href={href}
			className={cc(styles.link, active && styles.active)}
			{...props}
		>
			{!!IconComponent && <IconComponent className={styles.icon} />}
			{name}
		</Link>
	);
}
