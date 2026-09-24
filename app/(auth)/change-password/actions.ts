"use server";

import { changeOwnPassword } from "@/lib/services/user";
import { getSessionUser } from "@/lib/auth/session";

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

export async function changePasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ChangePasswordResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }

  return await changeOwnPassword(user.id, {
    oldPassword,
    newPassword,
  });
}
