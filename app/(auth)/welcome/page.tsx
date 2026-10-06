import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import WelcomeClient from "./WelcomeClient";

export default async function WelcomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <WelcomeClient />;
}
