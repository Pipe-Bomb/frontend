import Link from "next/link";
import { HTMLAttributeAnchorTarget, ReactNode } from "react";

interface Props extends Omit<
	React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLAnchorElement>,
		HTMLAnchorElement
	>,
	"href"
> {
	href: string | null;
	children?: ReactNode;
	target?: HTMLAttributeAnchorTarget;
}

export function OptionalLink({
	href,
	children,
	popoverTarget,
	target,
	...props
}: Props) {
	if (href) {
		return (
			<Link href={href} {...props} target={target}>
				{children}
			</Link>
		);
	}

	return <span {...props}>{children}</span>;
}
