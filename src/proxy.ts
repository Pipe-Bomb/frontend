import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setBaseUrl, getSetupStatus } from "pipe-bomb-tanstack-client";

export async function proxy(request: NextRequest): Promise<NextResponse> {
	const pathname = request.nextUrl.pathname;

	if (pathname.startsWith("/setup")) {
		return NextResponse.next();
	}

	try {
		setBaseUrl(process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3000");
		const result = await getSetupStatus({ cache: "no-store" });
		if (result.status === 200 && result.data.needsSetup) {
			return NextResponse.redirect(new URL("/setup", request.url));
		}
	} catch {
		// Backend temporarily unavailable - let the request through
	}

	return NextResponse.next();
}

export const config = {
	// Exclude Next.js internals and static files (paths with a file extension)
	matcher: ["/((?!_next/static|_next/image|favicon\\.ico|[^/]*\\.[^/]+$).*)"],
};
