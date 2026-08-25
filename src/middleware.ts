import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const pathname = request.nextUrl.pathname;

	if (pathname.startsWith("/setup")) {
		return NextResponse.next();
	}

	try {
		const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:3000";
		const res = await fetch(`${apiUrl}/setup`, { cache: "no-store" });
		if (res.ok) {
			const data = (await res.json()) as { needsSetup: boolean };
			if (data.needsSetup) {
				return NextResponse.redirect(new URL("/setup", request.url));
			}
		}
	} catch {
		// Backend temporarily unavailable — let the request through
	}

	return NextResponse.next();
}

export const config = {
	// Exclude Next.js internals and static files (paths with a file extension)
	matcher: ["/((?!_next/static|_next/image|favicon\\.ico|[^/]*\\.[^/]+$).*)"],
};
