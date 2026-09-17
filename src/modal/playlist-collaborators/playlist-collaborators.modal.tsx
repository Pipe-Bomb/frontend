"use client";

import { Modal } from "@/components/modal/modal.component";
import {
	getGetPlaylistMembersQueryKey,
	Playlist,
	PlaylistMemberRole,
	upsertPlaylistMember,
	useGetPlaylistMembers,
	useSearchUsers,
	User,
} from "@api";
import styles from "./playlist-collaborators.module.scss";
import { Spinner } from "@/components/spinner/spinner.component";
import { useMemo, useState } from "react";
import { useNotificationStore } from "@/store/notification.store";
import { useQueryClient } from "@tanstack/react-query";
import { TextInput } from "@/components/text-input/text-input.component";
import { useDebounce } from "@/hook/debounce.hook";
import { useTranslation } from "@/context/language.context";
import { PlaylistCollaboratorEntry } from "@/components/playlist-collaborator-entry/playlist-collaborator-entry.component";

interface SharedProps {
	playlist: Playlist;
	onClose?: () => void;
}

interface Props extends SharedProps {
	open: boolean;
}

export function PlaylistCollaboratorsModal({ open, onClose, playlist }: Props) {
	return (
		<Modal open={open} onClose={onClose} title="Manage Playlist Collaborators">
			<Inner playlist={playlist} onClose={onClose} />
		</Modal>
	);
}

function Inner({ playlist }: SharedProps) {
	const { t } = useTranslation();
	const membersQuery = useGetPlaylistMembers(playlist.uuid, {
		query: { enabled: true },
	});

	if (membersQuery.isPending || !membersQuery.data) {
		return <Spinner position="expand" />;
	}

	if (membersQuery.data.status !== 200) {
		return <p>Failed to load members</p>;
	}

	const members = membersQuery.data.data;
	const ownerUuid = playlist.ownerUuid as unknown as string | null;

	return (
		<div className={styles.container}>
			{members.length === 0 ? (
				<p className={styles.empty}>
					{t("modal.playlist-collaborators.empty", "No members yet")}
				</p>
			) : (
				<div className={styles.memberList}>
					{members.map((member) => (
						<PlaylistCollaboratorEntry
							key={member.userUuid}
							member={member}
							playlistUuid={playlist.uuid}
						/>
					))}
				</div>
			)}
			<AddMemberForm
				playlistUuid={playlist.uuid}
				ownerUuid={ownerUuid}
				existingMemberUuids={members.map((m) => m.userUuid)}
			/>
		</div>
	);
}

interface AddMemberFormProps {
	playlistUuid: string;
	ownerUuid: string | null;
	existingMemberUuids: string[];
}

function AddMemberForm({
	playlistUuid,
	ownerUuid,
	existingMemberUuids,
}: AddMemberFormProps) {
	const { t } = useTranslation();
	const { createNotification } = useNotificationStore();
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [debouncedQuery] = useDebounce(searchQuery, 500);

	const searchResult = useSearchUsers(
		{ q: debouncedQuery },
		{ query: { enabled: !!debouncedQuery && !isLoading } },
	);

	const filteredResults = useMemo(() => {
		if (!searchResult.data || searchResult.data.status !== 200) return [];
		return searchResult.data.data
			.filter(
				(user) =>
					user.uuid !== ownerUuid && !existingMemberUuids.includes(user.uuid),
			)
			.slice(0, 3);
	}, [searchResult.data, ownerUuid, existingMemberUuids]);

	const showResults = !!searchQuery && !isLoading;

	const selectUser = async (user: User) => {
		setSearchQuery("");
		setIsLoading(true);
		try {
			await upsertPlaylistMember(playlistUuid, user.uuid, {
				role: PlaylistMemberRole.viewer,
			});
			await queryClient.invalidateQueries({
				queryKey: getGetPlaylistMembersQueryKey(playlistUuid),
			});
			createNotification("Added member");
		} catch {
			createNotification("Failed to add member");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={styles.addSection}>
			<p className={styles.addTitle}>
				{t("modal.playlist-collaborators.add-section")}
			</p>
			<div className={styles.searchWrapper}>
				<TextInput
					value={searchQuery}
					onChange={setSearchQuery}
					placeholder={t("modal.playlist-collaborators.search-placeholder")}
				/>
				{isLoading ? (
					<div className={styles.searchResultMessage}>
						<Spinner />
					</div>
				) : showResults ? (
					<div className={styles.searchResults}>
						{searchResult.isPending ? (
							<div className={styles.searchResultMessage}>
								<Spinner />
							</div>
						) : filteredResults.length > 0 ? (
							filteredResults.map((user) => (
								<button
									key={user.uuid}
									className={styles.searchResult}
									onClick={() => selectUser(user)}
								>
									{user.username}
								</button>
							))
						) : (
							<p className={styles.searchResultMessage}>
								{t("modal.playlist-collaborators.no-results", "No users found")}
							</p>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
}
