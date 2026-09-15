"use client";

import { IconButton } from "@/components/icon-button/icon-button";
import { ListIdentifier } from "@/components/list-identifier/list-identifier.component";
import { List } from "@/components/list/list.component";
import { Spinner } from "@/components/spinner/spinner.component";
import { safeFetch, unwrapData } from "@/lib/api.util";
import { useNotificationStore } from "@/store/notification.store";
import {
	getGetAllIdentifiersQueryKey,
	IdentifierKeyDto,
	updateIdentifiers,
	useGetAllIdentifiers,
} from "@api";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.scss";

export default function Page() {
	const { data: identifiersResponse } = useGetAllIdentifiers({
		query: {
			enabled: true,
		},
	});
	const queryClient = useQueryClient();
	const [disabledStates, setDisabledStates] = useState<boolean[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const { createNotification } = useNotificationStore();

	const needsSaving = useMemo(() => {
		if (identifiersResponse?.status != 200) {
			return false;
		}
		if (disabledStates.length != identifiersResponse.data.length) {
			return false;
		}
		for (let i = 0; i < disabledStates.length; i++) {
			if (disabledStates[i] != identifiersResponse.data[i].disabled) {
				return true;
			}
		}
		return false;
	}, [identifiersResponse, disabledStates]);

	useEffect(() => {
		if (identifiersResponse?.status == 200) {
			setDisabledStates(
				identifiersResponse.data.map(({ disabled }) => disabled),
			);
		} else {
			setDisabledStates([]);
		}
	}, [identifiersResponse]);

	if (!identifiersResponse) {
		return <Spinner position="expand" />;
	}

	const identifiers = unwrapData(identifiersResponse);

	const save = () => {
		if (isSaving || identifiers.length != disabledStates.length) {
			return;
		}
		setIsSaving(true);
		const enable: IdentifierKeyDto[] = [];
		const disable: IdentifierKeyDto[] = [];

		for (let i = 0; i < identifiers.length; i++) {
			const identifier = identifiers[i];

			const identifierKey: IdentifierKeyDto = {
				pluginId: identifier.pluginId,
				identifierId: identifier.identifierId,
				type: identifier.type,
			};
			if (disabledStates[i]) {
				disable.push(identifierKey);
			} else {
				enable.push(identifierKey);
			}
		}

		safeFetch(updateIdentifiers, {
			enable,
			disable,
		}).then(([status, data, response]) => {
			if (status == 200) {
				queryClient.setQueryData(getGetAllIdentifiersQueryKey(), response);
			} else {
				if (data) {
					createNotification(`Failed to update Identifiers: ${data.message}`);
				} else {
					createNotification("Failed to update Identifiers");
				}
			}
			setIsSaving(false);
		});
	};

	return (
		<div>
			<div className={styles.saveContainer}>
				<IconButton
					icon={IconDeviceFloppy}
					iconSource="tabler"
					style={needsSaving ? "background" : "simple"}
					loading={isSaving}
					onClick={save}
				/>
			</div>

			<List>
				{identifiers.map((identifier, i) => {
					const hasDisabledDep = identifier.dependencies.some((dep) => {
						const depIdx = identifiers.findIndex(
							(id) =>
								id.identifierId === dep.sourceId &&
								(dep.pluginId == null || id.pluginId === dep.pluginId),
						);
						return depIdx !== -1 && (disabledStates[depIdx] ?? true);
					});
					return (
						<ListIdentifier
							key={`${identifier.pluginId}:${identifier.identifierId}:${identifier.type}`}
							identifier={identifier}
							onEnableChange={(enabled) =>
								setDisabledStates((prev) =>
									prev.map((value, j) => (j == i ? enabled : value)),
								)
							}
							disabled={hasDisabledDep || (disabledStates[i] ?? true)}
							preventChanges={hasDisabledDep || isSaving}
						/>
					);
				})}
			</List>
		</div>
	);
}
