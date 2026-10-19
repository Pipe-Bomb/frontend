import Link from "next/link";
import styles from "./navbar-link.module.scss";
import { cc } from "@/lib/util";
import { ComponentType, SVGProps } from "react";
import { Resource } from "@api";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";

type Props = {
	href: string;
	name: string;
	subtitle?: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>> | null;
	active?: boolean;
	image?: Resource | null;
};

export function NavbarLink({
	href,
	name,
	subtitle,
	active,
	icon,
	image,
	...props
}: Props) {
	const IconComponent = icon;

	return (
		<Link
			href={href}
			className={cc(styles.link, active && styles.active)}
			{...props}
		>
			{image ? (
				<ResourceImage
					resource={image}
					className={styles.image}
					fallback={<AlbumArtFallback />}
					width={32}
					height={32}
				/>
			) : (
				!!IconComponent &&
				!subtitle && <IconComponent className={styles.icon} />
			)}
			<div>
				<span className={styles.name}>{name}</span>
				{!!subtitle && (
					<span className={styles.subtitle}>
						{!!IconComponent && <IconComponent className={styles.icon} />}
						{subtitle}
					</span>
				)}
			</div>
		</Link>
	);
}
