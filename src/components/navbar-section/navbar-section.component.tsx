import { ComponentType, ReactNode, SVGProps, useMemo, useState } from "react";
import styles from "./navbar-section.module.scss";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { cc } from "@/lib/util";
import { useUISettings } from "@/context/ui-settings.context";

interface SectionAction {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	onClick: () => void;
}

interface Props {
	children?: ReactNode;
	title: string;
	id: string;
	actions?: SectionAction[];
}

export function NavbarSection({ children, title, id, actions }: Props) {
	const [collapsedSections, setCollapsedSections] = useUISettings(
		"navbarCollapsedSections",
		[],
	);
	const isCollapsed = useMemo(
		() => collapsedSections.includes(id),
		[collapsedSections, id],
	);
	const toggleCollapse = () => {
		if (isCollapsed) {
			setCollapsedSections(
				collapsedSections.filter((sectionId) => sectionId != id),
			);
		} else {
			setCollapsedSections([...collapsedSections, id]);
		}
	};

	const allActions: SectionAction[] = [
		...(actions ?? []),
		{
			icon: isCollapsed ? IconChevronDown : IconChevronUp,
			onClick: toggleCollapse,
		},
	];

	return (
		<div className={styles.container}>
			<div className={styles.heading}>
				<span className={styles.title} onClick={toggleCollapse}>
					{title}
				</span>
				<div className={styles.actions}>
					{allActions.map((action, index) => (
						<IconButton
							key={index}
							icon={action.icon}
							iconSource="tabler"
							size="sm"
							className={styles.actionButton}
							iconClassName={styles.actionButtonIcon}
							onClick={action.onClick}
							style="ghost"
						/>
					))}
				</div>
			</div>
			<div
				className={cc(styles.contentContainer, isCollapsed && styles.closed)}
			>
				<div className={styles.contentWrapper}>
					<div className={styles.list}>{children}</div>
				</div>
			</div>
		</div>
	);
}
