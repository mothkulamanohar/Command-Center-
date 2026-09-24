"use server";

import { authenticateUser } from "@/lib/services/user";
import { createSession } from "@/lib/auth/session";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  mustChangePw?: boolean;
}

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<LoginActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const keepMeSignedIn = formData.get("keepMeSignedIn") === "on";

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password" };
  }

  const result = await authenticateUser({
    email,
    password,
    keepMeSignedIn,
  });

  if (!result.success || !result.user) {
    return { success: false, error: result.error || "Email or password is wrong" };
  }

  await createSession(result.user.id, keepMeSignedIn);

  return {
    success: true,
    mustChangePw: result.user.mustChangePw,
  };
}
