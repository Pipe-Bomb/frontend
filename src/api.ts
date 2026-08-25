import { setBaseUrl } from "pipe-bomb-tanstack-client";

if (typeof window === "undefined") {
	const serverUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:3000";
	setBaseUrl(serverUrl);
} else {
	let clientUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
	if (clientUrl.startsWith("/")) {
		clientUrl = window.location.origin + clientUrl;
	}
	setBaseUrl(clientUrl);
}

export * from "pipe-bomb-tanstack-client";
