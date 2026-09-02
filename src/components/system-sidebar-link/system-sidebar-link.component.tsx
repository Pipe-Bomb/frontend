"useClient";

import Link from "next/link";
import styles from "./system-sidebar-link.module.scss";
import { usePrivilegeCheck } from "@/hook/privilege-check.hook";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cc } from "@/lib/util";

interface Props {
	url: string;
	exactUrl?: boolean;
	children: string;
	privilege?: string;
}

export function SystemSidebarLink({
	url,
	children,
	privilege,
	exactUrl,
}: Props) {
	const hasPrivilege = usePrivilegeCheck();
	const pathname = usePathname();

	const isActive = useMemo(() => {
		return url == pathname || (!exactUrl && pathname.startsWith(`${url}/`));
	}, [pathname, url, exactUrl]);

	if (privilege && !hasPrivilege(privilege)) {
		return null;
	}

	return (
		<Link
			href={url}
			className={cc(styles.container, isActive && styles.active)}
		>
			{children}
		</Link>
	);
}
