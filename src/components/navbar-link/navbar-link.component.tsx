import Link from "next/link";
import styles from "./navbar-link.module.scss";
import { cc } from "@/lib/util";
import { ComponentType, SVGProps } from "react";
import { Resource } from "@api";
import { ResourceImage } from "@/components/resource-image/resource-image.component";
import { AlbumArtFallback } from "@/components/album-art-fallback/album-art-fallback.component";
import { Tooltip } from "@/components/tooltip/tooltip.component";

type Props = {
	href: string;
	name: string;
	subtitle?: string | null;
	icon?: ComponentType<SVGProps<SVGSVGElement>> | null;
	active?: boolean;
	image?: Resource | null;
	showFallbackImage?: boolean;
	mini?: boolean;
};

export function NavbarLink({
	href,
	name,
	subtitle,
	active,
	icon,
	image,
	showFallbackImage,
	mini,
	...props
}: Props) {
	const IconComponent = icon;

	return (
		<Tooltip
			tooltipContent={mini ? name : null}
			side="right"
			offset={14}
			href={href}
			className={cc(styles.link, active && styles.active, mini && styles.mini)}
			{...props}
		>
			{image || showFallbackImage ? (
				<ResourceImage
					resource={image ?? null}
					className={styles.image}
					fallback={<AlbumArtFallback />}
					width={32}
					height={32}
				/>
			) : (
				!!IconComponent &&
				!subtitle && <IconComponent className={styles.icon} />
			)}
			<div className={styles.content}>
				<span className={styles.name}>{name}</span>
				{!!subtitle && (
					<span className={styles.subtitleContainer}>
						{!!IconComponent && <IconComponent className={styles.icon} />}
						<span className={styles.subtitle}>{subtitle}</span>
					</span>
				)}
			</div>
		</Tooltip>
	);
}
