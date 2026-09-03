"useClient";

import Link, { LinkProps } from "next/link";
import styles from "./system-sidebar-link.module.scss";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cc } from "@/lib/util";

interface Props extends LinkProps<any> {
	exactUrl?: boolean;
	children: string;
	privilege?: string;
}

export function SystemSidebarLink({
	children,
	privilege,
	exactUrl,
	href,
	...props
}: Props) {
	const hasPrivilege = usePrivilegeCheck();
	const pathname = usePathname();

	const isActive = useMemo(() => {
		return href == pathname || (!exactUrl && pathname.startsWith(`${href}/`));
	}, [pathname, href, exactUrl]);

	if (privilege && !hasPrivilege(privilege)) {
		return null;
	}

	return (
		<Link
			className={cc(styles.container, isActive && styles.active)}
			href={href}
			{...props}
		>
			{children}
		</Link>
	);
}
