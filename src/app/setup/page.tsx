import { redirect } from "next/navigation";
import { SetupWizard } from "./setup-wizard.component";

export const dynamic = "force-dynamic";

async function checkSetupStatus(): Promise<boolean> {
	try {
		const apiUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:3000";
		const res = await fetch(`${apiUrl}/setup`, { cache: "no-store" });
		if (res.ok) {
			const data = (await res.json()) as { needsSetup: boolean };
			return data.needsSetup;
		}
	} catch {}
	return false;
}

export default async function SetupPage() {
	const needsSetup = await checkSetupStatus();
	if (!needsSetup) {
		redirect("/");
	}

	return <SetupWizard />;
}
