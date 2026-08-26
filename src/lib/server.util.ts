import { cookies, headers } from "next/headers";

export async function getAuthHeaders(): Promise<HeadersInit | null> {
	const [cookiesStore, incomingHeaders] = await Promise.all([
		cookies(),
		headers(),
	]);
	const token = cookiesStore.get("auth_token")?.value;

	const baseHeaders: HeadersInit = {};

	const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
	let resolvedHost: string | null = null;
	let resolvedProto: string | null = null;

	if (publicApiUrl) {
		try {
			const url = new URL(publicApiUrl);
			resolvedHost = url.host;
			resolvedProto = url.protocol.replace(":", "");
		} catch {}
	}

	if (!resolvedHost) {
		resolvedHost = incomingHeaders.get("host");
		resolvedProto =
			incomingHeaders.get("x-forwarded-proto") ??
			(resolvedHost?.includes(":443") ? "https" : "http");
	}

	if (resolvedHost) {
		baseHeaders["X-Forwarded-Host"] = resolvedHost;
		baseHeaders["X-Forwarded-Proto"] = resolvedProto ?? "http";
	}

	if (!token) {
		return baseHeaders;
	}

	return {
		...baseHeaders,
		Authorization: `Bearer ${token}`,
	};
}

export async function isSSR() {
	const allHeaders = await headers();
	return !!allHeaders.get("accept")?.includes("text/html");
}
