import { Modal } from "@/components/modal/modal.component";
import { Track } from "@api";
import styles from "./track-info-modal.module.scss";
import { useGetTrack, useGetTrackIdentities } from "@api";
import { Spinner } from "@/components/spinner/spinner.component";
import { IconButton } from "@/components/icon-button/icon-button";
import { IconCopyFilled } from "@tabler/icons-react";
import { copyToClipboard } from "@/lib/clipboard/util";
import { AttributeUnion } from "@/lib/attribute.util";
import Link from "next/link";
import { unwrapData } from "@/lib/api.util";

interface Props extends InnerProps {
	open: boolean;
	onClose?: () => void;
}

export function TrackInfoModal({ track, open, onClose }: Props) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			className={styles.container}
			title="Track Info"
		>
			<Inner track={track} />
		</Modal>
	);
}

interface InnerProps {
	track: Track;
}

function Inner({ track }: InnerProps) {
	const fullTrackResponse = useGetTrack(
		track.pluginId,
		track.libraryId,
		track.trackId,
		{
			query: {
				enabled: true,
			},
		},
	).data;

	const identitiesResponse = useGetTrackIdentities(
		track.pluginId,
		track.libraryId,
		track.trackId,
		{
			query: {
				enabled: true,
			},
		},
	).data;

	if (!fullTrackResponse || !identitiesResponse) {
		return <Spinner />;
	}

	if (fullTrackResponse.status == 404 || identitiesResponse.status == 404) {
		return <h1>Track not found</h1>;
	}

	const fullTrack = unwrapData(fullTrackResponse);

	const attributes: Record<string, AttributeUnion> | null =
		fullTrack.attributes;
	const identities = unwrapData(identitiesResponse);

	if (!attributes) {
		return (
			<div>
				<span>Failed to load attributes</span>
			</div>
		);
	}

	return (
		<div>
			<h2 className={styles.sectionTitle}>Attributes</h2>
			<div>
				{Object.entries(attributes).map(([id, value]) => (
					<div key={id} className={styles.entry}>
						<span className={styles.key}>{id}</span>
						<div>
							{value.values.map((value, index) =>
								typeof value == "object" ? (
									<Link href={value.url} target="_blank" key={index}>
										{value.uuid}.{value.extension}
									</Link>
								) : (
									<span key={index}>{value}</span>
								),
							)}
						</div>
					</div>
				))}
			</div>

			<h2 className={styles.sectionTitle}>Identities</h2>
			<div>
				{identities.map((identity) => (
					<div
						key={`${identity.pluginId} ${identity.identityId} ${identity.ordinal}`}
						className={styles.entry}
					>
						<span className={styles.key}>{identity.identityId}</span>
						<div className={styles.valueContainer}>
							<span className={styles.value}>{identity.value}</span>
							<IconButton
								icon={IconCopyFilled}
								size="sm"
								iconSource="tabler"
								onClick={() => copyToClipboard(identity.value)}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
