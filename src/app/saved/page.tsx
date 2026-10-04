"use client";

import { RequireAuth } from "@/guard/auth.guard";
import { RootPadding } from "@/components/root-padding/root-padding.component";
import { SavedPage } from "@/components/saved/saved-page.component";

export default function SavedRoute() {
	return (
		<RequireAuth>
			<RootPadding vertical>
				<SavedPage />
			</RootPadding>
		</RequireAuth>
	);
}
