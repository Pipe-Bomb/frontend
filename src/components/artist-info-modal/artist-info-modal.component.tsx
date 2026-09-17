"use client";

import { Modal } from "@/components/modal/modal.component";
import { Artist } from "@api";
import styles from "./artist-info-modal.module.scss";
import { useGetArtist } from "@api";
import { Spinner } from "@/components/spinner/spinner.component";
import { useTranslation } from "@/context/language.context";
import Link from "next/link";
import { unwrapData } from "@/lib/api.util";

interface Props {
	artist: Artist;
	open: boolean;
	onClose?: () => void;
}

export function ArtistInfoModal({ artist, open, onClose }: Props) {
	if (!artist.uuid) {
		return null;
	}
	return (
		<Modal
			open={open}
			onClose={onClose}
			className={styles.container}
			title="Artist Info"
		>
			<Inner artistUuid={artist.uuid} />
		</Modal>
	);
}

interface InnerProps {
	artistUuid: string;
}

function Inner({ artistUuid }: InnerProps) {
	const { data: fullArtistResponse } = useGetArtist(artistUuid, {
		query: {
			enabled: true,
		},
	});

	if (!fullArtistResponse) {
		return (
			<div>
				<Spinner />
			</div>
		);
	}

	if (fullArtistResponse.status == 404) {
		return (
			<div>
				<span>Artist not found</span>
			</div>
		);
	}

	const artist = unwrapData(fullArtistResponse);

	return <Content artist={artist} />;
}

interface ContentProps {
	artist: Artist;
}

function Content({ artist }: ContentProps) {
	const { t } = useTranslation();

	return (
		<div>
			<div>
				<h2>Identities</h2>
				{artist.identities?.map((identity) => (
					<div
						key={`${identity.pluginId} ${identity.identityId} ${identity.ordinal}`}
					>
						<span>{t(`plugin.${identity.pluginId}.name`)}</span>
						<span>{" > "}</span>
						<span>{identity.identityId}</span>
						<span className={styles.identityValue}>{identity.value}</span>
					</div>
				))}
			</div>
			<div>
				<h2>Attributes</h2>
				{Object.entries(artist.attributes ?? {}).map(
					([key, { type, values }]) => (
						<div key={key}>
							<span>{key}</span>
							{values.map((value, index) =>
								typeof value == "object" ? (
									<Link
										href={value.url}
										key={index}
										target="_blank"
										className={styles.identityValue}
									>
										{value.uuid}
									</Link>
								) : (
									<span key={index} className={styles.identityValue}>
										{value}
									</span>
								),
							)}
						</div>
					),
				)}
			</div>
		</div>
	);
}
