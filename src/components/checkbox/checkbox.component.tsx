import { cc } from "@/lib/util";
import styles from "./checkbox.module.scss";
import { IconCheck } from "@tabler/icons-react";

interface Props {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
}

export function Checkbox({ checked, onChange, disabled }: Props) {
	return (
		<button
			className={cc(styles.checkbox, checked && styles.checked)}
			onClick={() => {
				if (!disabled) {
					onChange?.(!checked);
				}
			}}
			disabled={disabled}
		>
			{checked && <IconCheck className={styles.tick} strokeWidth={4} />}
		</button>
	);
}
