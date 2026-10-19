import Link from "next/link";
import { HTMLAttributeAnchorTarget, ReactNode, Ref } from "react";

interface Props extends Omit<
	React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLAnchorElement | HTMLSpanElement>,
		HTMLAnchorElement | HTMLSpanElement
	>,
	"href"
> {
	href: string | null;
	children?: ReactNode;
	target?: HTMLAttributeAnchorTarget;
	ref?: Ref<HTMLSpanElement | HTMLAnchorElement>;
}

export function OptionalLink({
	href,
	children,
	popoverTarget,
	target,
	ref,
	...props
}: Props) {
	if (href) {
		return (
			<Link
				href={href}
				{...props}
				target={target}
				ref={ref as Ref<HTMLAnchorElement>}
			>
				{children}
			</Link>
		);
	}

	return (
		<span {...props} ref={ref}>
			{children}
		</span>
	);
}
