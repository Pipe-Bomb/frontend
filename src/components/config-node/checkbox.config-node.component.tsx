import { Checkbox } from "@/components/checkbox/checkbox.component";
import { CheckboxConfigNode as CheckboxConfigNodeType } from "pipe-bomb-tanstack-client";
import { useEffect, useState } from "react";

interface Props {
	node: CheckboxConfigNodeType;
	onChange: (id: string, value: any) => void;
	disabled?: boolean;
}

export function CheckboxConfigNode({ node, onChange, disabled }: Props) {
	const [value, setValue] = useState(node.checked);

	useEffect(() => {
		setValue(node.checked);
	}, [node]);

	return (
		<Checkbox
			checked={value}
			onChange={(value) => {
				setValue(value);
				onChange(node.id, value);
			}}
			disabled={disabled || node.readonly}
		/>
	);
}
