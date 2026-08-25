import { redirect } from "next/navigation";
import { getSetupStatus } from "@api";
import { SetupWizard } from "./setup-wizard.component";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
	try {
		const result = await getSetupStatus({ cache: "no-store" });
		if (result.status !== 200 || !result.data.needsSetup) {
			redirect("/");
		}
	} catch {
		redirect("/");
	}

	return <SetupWizard />;
}
