import { Button } from "@/components/button/button.component";
import { safeFetch } from "@/lib/api.util";
import { useNotificationStore } from "@/store/notification.store";
import {
	activatePluginConfigButton,
	ButtonConfigNode as ButtonConfigNodeType,
	PluginConfig,
} from "pipe-bomb-tanstack-client";
import { useState } from "react";

interface Props {
	node: ButtonConfigNodeType;
	pluginId: string;
	userConfigId: string | null;
	disabled?: boolean;
	onAction: () => (config: PluginConfig | null) => void;
}

export function ButtonConfigNode({
	node,
	pluginId,
	userConfigId,
	disabled,
	onAction,
}: Props) {
	const [isClicking, setIsClicking] = useState(false);
	const { createNotification } = useNotificationStore();

	const click = () => {
		if (isClicking) {
			return;
		}
		setIsClicking(true);
		const onComplete = onAction();
		const request = safeFetch(activatePluginConfigButton, pluginId, {
			id: node.id,
		});

		request.then(([status, data]) => {
			setIsClicking(false);
			if (status == 200) {
				console.log("Clicked");
				onComplete(data);
			} else {
				createNotification("Failed to activate button");
				onComplete(null);
			}
		});
	};

	return (
		<Button
			onClick={click}
			loading={isClicking}
			disabled={disabled && !isClicking}
		>
			{node.content}
		</Button>
	);
}
