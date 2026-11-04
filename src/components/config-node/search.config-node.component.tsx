import {
	PluginConfig,
	SearchConfigNode as SearchConfigNodeType,
	searchPluginConfig,
} from "@api";
import styles from "./search.config-node.module.scss";
import { TextInput } from "@/components/text-input/text-input.component";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hook/debounce.hook";
import { safeFetch } from "@/lib/api.util";
import { Spinner } from "@/components/spinner/spinner.component";
import { RootConfigNode } from "@/components/config-node/root.config-node.component";
import { ConfigNode } from "@/components/config-node/config-node.component";

interface Props {
	node: SearchConfigNodeType;
	pluginId: string;
	userConfigId: string | null;
	onChange: (id: string, value: any) => void;
	disabled?: boolean;
	onAction: () => (config: PluginConfig | null) => void;
}

export function SearchConfigNode({
	node,
	disabled,
	pluginId,
	userConfigId,
	onChange,
	onAction,
}: Props) {
	const [value, setValue] = useState(node.value);
	const [debounceValue, isDebouncing] = useDebounce(value, 500);
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState(node.results);

	useEffect(() => {
		setValue(node.value);
	}, [node]);

	useEffect(() => {
		if (isDebouncing || !debounceValue) {
			return;
		}

		const abortController = new AbortController();
		setIsSearching(true);

		const request = safeFetch(
			searchPluginConfig,
			pluginId,
			{
				id: node.id,
				query: value,
			},
			{
				signal: abortController.signal,
			},
		);

		request.then(([status, data]) => {
			if (abortController.signal.aborted) {
				return;
			}
			setIsSearching(false);

			if (status == 200) {
				setResults(data.node);
			}
		});

		return () => abortController.abort();
	}, [debounceValue, isDebouncing, node]);

	return (
		<div className={styles.container}>
			<span className={styles.name}>{node.name}</span>
			<div className={styles.inputContainer}>
				<TextInput
					placeholder={node.placeholder ?? undefined}
					value={value}
					onChange={setValue}
					disabled={disabled}
				/>
				{(isDebouncing || isSearching) && !!value && <Spinner />}
			</div>
			{results && (
				<div className={styles.resultsContainer}>
					<ConfigNode
						node={results}
						pluginId={pluginId}
						userConfigId={userConfigId}
						onChange={onChange}
						disabled={disabled}
						onAction={onAction}
					/>
				</div>
			)}
		</div>
	);
}
